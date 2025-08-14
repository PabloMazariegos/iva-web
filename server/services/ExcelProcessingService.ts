import * as XLSX from 'xlsx'
import type { ExcelRow, ProcessedFileData } from '../types/tax.types'

export class ExcelProcessingService {
  async processExcelFile(fileStream: ReadableStream): Promise<ProcessedFileData> {
    const buffer = await this.streamToBuffer(fileStream)
    const workbook = this.readWorkbook(buffer)
    const data = this.extractDataFromWorkbook(workbook)
    const detectedColumns = this.detectColumns(data)

    return {
      data,
      detectedColumns
    }
  }

  private async streamToBuffer(stream: ReadableStream): Promise<Buffer> {
    const buffers: Uint8Array[] = []
    const reader = stream.getReader()
    
    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        if (value) buffers.push(value)
      }
      
      const buffer = Buffer.concat(buffers.map(chunk => Buffer.from(chunk)))
      
      // Validate buffer has content
      if (buffer.length === 0) {
        throw new Error('Empty file buffer')
      }
      
      return buffer
    } catch (error) {
      throw new Error(`Failed to read file stream: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      reader.releaseLock()
    }
  }

  private readWorkbook(buffer: Buffer): XLSX.WorkBook {
    try {
      // Try different reading strategies
      const strategies = [
        () => XLSX.read(buffer, { type: 'buffer', cellDates: true }),
        () => XLSX.read(buffer, { type: 'buffer', cellDates: true, codepage: 65001 }),
        () => XLSX.read(buffer, { type: 'buffer', cellDates: true, codepage: 1252 }),
        () => XLSX.read(new Uint8Array(buffer), { type: 'array', cellDates: true }),
      ]

      let lastError: Error | null = null

      for (const strategy of strategies) {
        try {
          const workbook = strategy()
          if (workbook && workbook.SheetNames && workbook.SheetNames.length > 0) {
            return workbook
          }
        } catch (error) {
          lastError = error instanceof Error ? error : new Error('Unknown error')
          continue
        }
      }

      throw lastError || new Error('Failed to read Excel file with all attempted methods')
    } catch (error) {
      throw new Error(`Failed to parse Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private extractDataFromWorkbook(workbook: XLSX.WorkBook): ExcelRow[] {
    try {
      const sheetName = workbook.SheetNames[0]
      if (!sheetName) {
        throw new Error('No worksheets found in the Excel file')
      }

      const worksheet = workbook.Sheets[sheetName]
      if (!worksheet) {
        throw new Error('Worksheet is empty or corrupted')
      }

      const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1,
        defval: '',
        raw: false // This helps with formatting
      }) as (string | number)[][]
      
      if (jsonData.length === 0) {
        return []
      }

      return this.convertToObjects(jsonData)
    } catch (error) {
      throw new Error(`Failed to extract data from workbook: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private convertToObjects(jsonData: (string | number)[][]): ExcelRow[] {
    if (jsonData.length === 0) return []
    
    const headers = jsonData[0] as string[]
    const rows = jsonData.slice(1)
    
    return rows
      .map(row => this.createRowObject(headers, row))
      .filter(row => this.isRowNotEmpty(row))
  }

  private createRowObject(headers: string[], row: (string | number)[]): ExcelRow {
    const obj: ExcelRow = {}
    headers.forEach((header, index) => {
      const value = row[index]
      obj[header] = value !== undefined && value !== null ? String(value).trim() : ''
    })
    return obj
  }

  private isRowNotEmpty(row: ExcelRow): boolean {
    return Object.values(row).some(value => value !== '')
  }

  private detectColumns(data: ExcelRow[]) {
    if (data.length === 0) return {}

    const columns = Object.keys(data[0])
    
    const patterns = {
      date: /fecha|date|fch/i,
      taxpayerNumber: /nit|ruc|identificacion|taxpayer/i,
      taxpayerName: /nombre|razon|client|proveedor|empresa|name|company/i,
      total: /total|monto|importe|valor|amount/i,
      tax: /iva|impuesto|tax/i,
      invoiceNumber: /serie|correlativo|numero|factura|invoice/i
    }

    const detected: { [key: string]: string | null } = {}

    Object.entries(patterns).forEach(([key, pattern]) => {
      const matchedColumn = columns.find(col => pattern.test(col))
      detected[key] = matchedColumn || null
    })

    return detected
  }
}

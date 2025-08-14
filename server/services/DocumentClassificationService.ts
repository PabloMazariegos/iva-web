import type { 
  ExcelRow, 
  DocumentType, 
  DocumentTypeBreakdown, 
  CurrencyBreakdown,
  DetailedTaxSummary,
  ColumnMapping
} from '../types/tax.types'

const DOCUMENT_TYPE_COLUMN = 'Tipo de DTE (nombre)'

export const DocumentClassificationService = {
  classifyDocument(row: ExcelRow): DocumentType {
    const documentTypeValue = row[DOCUMENT_TYPE_COLUMN]
    
    if (!documentTypeValue) return 'OTHER'
    
    const docType = String(documentTypeValue).toUpperCase().trim()
    
    if (docType.includes('NDEB')) return 'NDEB'
    if (docType.includes('NCRE')) return 'NCRE'
    if (docType.includes('FACT')) return 'FACT'
    
    return 'OTHER'
  },

  classifyDocuments(data: ExcelRow[]): Map<DocumentType, ExcelRow[]> {
    const classification = new Map<DocumentType, ExcelRow[]>()
    
    for (const row of data) {
      const docType = this.classifyDocument(row)
      
      if (!classification.has(docType)) {
        classification.set(docType, [])
      }
      
      classification.get(docType)!.push(row)
    }
    
    return classification
  },

  calculateDocumentTypeBreakdown(
    data: ExcelRow[],
    columnMappings: ColumnMapping,
    exchangeRate: number
  ): DocumentTypeBreakdown {
    const classified = this.classifyDocuments(data)
    
    const breakdown: DocumentTypeBreakdown = {
      regular: { count: 0, totalAmount: 0, totalTax: 0 },
      debitNotes: { count: 0, totalAmount: 0, totalTax: 0 },
      creditNotes: { count: 0, totalAmount: 0, totalTax: 0 }
    }
    
    const regularDocs = [
      ...(classified.get('FACT') || []),
      ...(classified.get('OTHER') || [])
    ]
    const debitNotes = classified.get('NDEB') || []
    const creditNotes = classified.get('NCRE') || []

    breakdown.regular = this.calculateCategoryTotals(regularDocs, columnMappings, exchangeRate)
    breakdown.debitNotes = this.calculateCategoryTotals(debitNotes, columnMappings, exchangeRate)
    breakdown.creditNotes = this.calculateCategoryTotals(creditNotes, columnMappings, exchangeRate)
    
    return breakdown
  },

  calculateCategoryTotals(
    documents: ExcelRow[],
    columnMappings: ColumnMapping,
    exchangeRate: number
  ): { count: number; totalAmount: number; totalTax: number } {
    let totalAmount = 0
    let totalTax = 0
    
    for (const doc of documents) {
      const amount = this.parseNumericValue(doc[columnMappings.total || ''])
      const tax = this.parseNumericValue(doc[columnMappings.tax || ''])
      const currency = String(doc[columnMappings.currency || '']).toUpperCase()
      
      const convertedAmount = currency === 'USD' ? amount * exchangeRate : amount
      const convertedTax = currency === 'USD' ? tax * exchangeRate : tax
      
      totalAmount += convertedAmount
      totalTax += convertedTax
    }
    
    return {
      count: documents.length,
      totalAmount,
      totalTax
    }
  },

  calculateCurrencyBreakdown(
    data: ExcelRow[],
    columnMappings: ColumnMapping,
    exchangeRate: number,
    isForTax: boolean = false
  ): CurrencyBreakdown {
    let usdCount = 0
    let gtqCount = 0
    let usdTotal = 0
    let gtqTotal = 0
    let originalUsdTotal = 0

    const targetColumn = isForTax ? columnMappings.tax : columnMappings.total

    for (const row of data) {
      const value = this.parseNumericValue(row[targetColumn || ''])
      const currency = String(row[columnMappings.currency || '']).toUpperCase()
      
      if (currency === 'USD') {
        usdCount++
        originalUsdTotal += value
        usdTotal += value * exchangeRate
      } else {
        gtqCount++
        gtqTotal += value
      }
    }

    return {
      usd: {
        count: usdCount,
        total: usdTotal,
        originalTotal: originalUsdTotal
      },
      gtq: {
        count: gtqCount,
        total: gtqTotal
      }
    }
  },

  createDetailedTaxSummary(
    data: ExcelRow[],
    columnMappings: ColumnMapping,
    exchangeRate: number
  ): DetailedTaxSummary {
    const totalAmount = this.sumColumnValues(data, columnMappings.total, columnMappings.currency, exchangeRate)
    const totalTax = this.sumColumnValues(data, columnMappings.tax, columnMappings.currency, exchangeRate)
    
    return {
      invoiceCount: data.length,
      totalAmount: totalAmount.total,
      totalTax: totalTax.total,
      currencyBreakdown: this.calculateCurrencyBreakdown(data, columnMappings, exchangeRate, false),
      documentBreakdown: this.calculateDocumentTypeBreakdown(data, columnMappings, exchangeRate)
    }
  },

  sumColumnValues(
    data: ExcelRow[],
    columnName: string | null | undefined,
    currencyColumn: string | null | undefined,
    exchangeRate: number
  ): { total: number; usdCount: number; gtqCount: number; originalUsdTotal: number } {
    if (!columnName) return { total: 0, usdCount: 0, gtqCount: 0, originalUsdTotal: 0 }
    
    let total = 0
    let usdCount = 0
    let gtqCount = 0
    let originalUsdTotal = 0
    
    for (const row of data) {
      const value = row[columnName]
      const currency = currencyColumn ? String(row[currencyColumn]).toUpperCase() : 'GTQ'
      const numericValue = this.parseNumericValue(value)
      
      if (currency === 'USD') {
        total += numericValue * exchangeRate
        originalUsdTotal += numericValue
        usdCount++
      } else {
        total += numericValue
        gtqCount++
      }
    }
    
    return { total, usdCount, gtqCount, originalUsdTotal }
  },

  parseNumericValue(value: string | number | Date): number {
    if (typeof value === 'number') return value
    
    const cleanedValue = String(value).replace(/[,\s]/g, '')
    const numericValue = parseFloat(cleanedValue)
    
    return isNaN(numericValue) ? 0 : numericValue
  }
}
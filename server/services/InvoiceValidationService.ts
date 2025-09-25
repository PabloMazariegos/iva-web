import type { ExcelRow } from '../types/tax.types'

export const InvoiceValidationService = {
  isValidInvoice(row: ExcelRow): boolean {
    return this.hasRequiredFields(row) &&
           this.isNotCanceled(row) &&
           this.isNotExemptDocument(row) &&
           this.hasPositiveTax(row)
  },

  hasRequiredFields(row: ExcelRow): boolean {
    const requiredFields = ['Gran Total (Moneda Original)', 'IVA (monto de este impuesto)']
    return requiredFields.every(field => row[field] !== undefined && row[field] !== null)
  },

  isNotCanceled(row: ExcelRow): boolean {
    const canceledField = row['Marca de anulado']
    return canceledField !== 'Si' && canceledField !== 'YES' && canceledField !== true
  },

  isNotExemptDocument(row: ExcelRow): boolean {
    const documentType = String(row['Tipo de DTE (nombre)'] || '').toUpperCase()
    return documentType !== 'RECI' || this.parseNumericValue(row['IVA (monto de este impuesto)']) > 0
  },

  hasPositiveTax(row: ExcelRow): boolean {
    return this.parseNumericValue(row['IVA (monto de este impuesto)']) > 0
  },

  parseNumericValue(value: string | number | Date): number {
    if (typeof value === 'number') return value
    const cleanedValue = String(value).replace(/[,\s]/g, '')
    const numericValue = parseFloat(cleanedValue)
    return isNaN(numericValue) ? 0 : numericValue
  }
}
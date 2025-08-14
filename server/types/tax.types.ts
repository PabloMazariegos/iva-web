export interface ExcelRow {
  [key: string]: string | number | Date
}

export interface TaxCalculationResult {
  totalSales: number
  totalPurchases: number
  salesTax: number
  purchasesTax: number
  taxPayable: number
  taxCredit: number
  salesData: ExcelRow[]
  purchasesData: ExcelRow[]
  detectedColumns: {
    sales: ColumnMapping
    purchases: ColumnMapping
  }
}

export interface ColumnMapping {
  date?: string | null
  taxpayerNumber?: string | null
  taxpayerName?: string | null
  total?: string | null
  tax?: string | null
  invoiceNumber?: string | null
}

export interface FileValidationResult {
  isValid: boolean
  errorMessage?: string
}

export interface ProcessedFileData {
  data: ExcelRow[]
  detectedColumns: ColumnMapping
}

export const TAX_RATE = 0.12 // Guatemala VAT rate 12%
export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
export const ALLOWED_EXTENSIONS = ['.xlsx', '.xls']
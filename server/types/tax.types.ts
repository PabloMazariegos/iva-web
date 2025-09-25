export interface ExcelRow {
  [key: string]: string | number | Date
}

// Document types from Guatemala tax system
export type DocumentType = 'FACT' | 'NDEB' | 'NCRE' | 'OTHER'

export interface DocumentTypeBreakdown {
  regular: { count: number; totalAmount: number; totalTax: number }
  debitNotes: { count: number; totalAmount: number; totalTax: number } // NDEB
  creditNotes: { count: number; totalAmount: number; totalTax: number } // NCRE
}

export interface CurrencyBreakdown {
  usd: { count: number; total: number; originalTotal: number }
  gtq: { count: number; total: number }
}

export interface DetailedTaxSummary {
  invoiceCount: number
  totalAmount: number
  totalTax: number
  currencyBreakdown: CurrencyBreakdown
  documentBreakdown: DocumentTypeBreakdown
}

export interface OptimizedInvoice {
  invoiceNumber: string
  taxpayerName: string
  totalAmount: number
  taxAmount: number
  currency: string
  documentType: DocumentType
  originalRow: ExcelRow
  taxRatio: number
  efficiencyScore: number
  isValid: boolean
}

export interface InvoiceOptimizationResult {
  targetTaxAmount: number
  achievedTaxAmount: number
  coveragePercentage: number
  selectedInvoices: OptimizedInvoice[]
  totalSelectedInvoices: number
  remainingTaxGap: number
}

export interface TaxCalculationResult {
  // Legacy fields for backward compatibility
  totalSales: number
  totalPurchases: number
  salesTax: number
  purchasesTax: number
  taxPayable: number
  taxCredit: number
  salesData: readonly ExcelRow[]
  purchasesData: readonly ExcelRow[]
  detectedColumns: {
    sales: ColumnMapping
    purchases: ColumnMapping
  }
  exchangeRate: number
  baseCurrency: 'GTQ'
  
  // New detailed analysis
  salesSummary: DetailedTaxSummary
  purchasesSummary: DetailedTaxSummary
  invoiceOptimization: InvoiceOptimizationResult
  
  // Legacy breakdowns (keeping for compatibility)
  currencyBreakdown: {
    sales: CurrencyBreakdown
    purchases: CurrencyBreakdown
  }
  taxBreakdown: {
    sales: CurrencyBreakdown
    purchases: CurrencyBreakdown
  }
}

export interface ColumnMapping {
  date?: string | null
  taxpayerNumber?: string | null
  taxpayerName?: string | null
  total?: string | null
  tax?: string | null
  invoiceNumber?: string | null
  currency?: string | null
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
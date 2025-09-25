import type {
  ExcelRow,
  OptimizedInvoice,
  InvoiceOptimizationResult,
  ColumnMapping,
  DocumentType
} from '../types/tax.types'
import { DocumentClassificationService } from './DocumentClassificationService'
import { InvoiceValidationService } from './InvoiceValidationService'
import { InvoiceScoreService } from './InvoiceScoreService'
import { OptimizedInvoiceSelectionService } from './OptimizedInvoiceSelectionService'

export const InvoiceOptimizationService = {
  optimizeInvoiceSelection(
    purchasesData: ExcelRow[],
    salesTaxAmount: number,
    columnMappings: ColumnMapping,
    exchangeRate: number
  ): InvoiceOptimizationResult {
    const optimizedInvoices = this.createOptimizedInvoiceList(
      purchasesData,
      columnMappings,
      exchangeRate
    )

    const selectedInvoices = OptimizedInvoiceSelectionService.selectOptimalInvoices(
      optimizedInvoices,
      salesTaxAmount
    )

    const achievedTaxAmount = selectedInvoices.reduce(
      (sum: number, invoice: OptimizedInvoice) => sum + invoice.taxAmount, 
      0
    )

    const coveragePercentage = salesTaxAmount > 0 
      ? Math.min((achievedTaxAmount / salesTaxAmount) * 100, 100)
      : 0

    const remainingTaxGap = Math.max(salesTaxAmount - achievedTaxAmount, 0)

    return {
      targetTaxAmount: salesTaxAmount,
      achievedTaxAmount,
      coveragePercentage,
      selectedInvoices,
      totalSelectedInvoices: selectedInvoices.length,
      remainingTaxGap
    }
  },

  createOptimizedInvoiceList(
    purchasesData: ExcelRow[],
    columnMappings: ColumnMapping,
    exchangeRate: number
  ): OptimizedInvoice[] {
    const invoices: OptimizedInvoice[] = []

    for (const row of purchasesData) {
      if (!InvoiceValidationService.isValidInvoice(row)) continue

      const taxAmount = this.parseNumericValue(row[columnMappings.tax || ''])
      const totalAmount = this.parseNumericValue(row[columnMappings.total || ''])
      const currency = String(row[columnMappings.currency || 'GTQ']).toUpperCase()

      const convertedTaxAmount = currency === 'USD' ? taxAmount * exchangeRate : taxAmount
      const convertedTotalAmount = currency === 'USD' ? totalAmount * exchangeRate : totalAmount

      const invoiceNumber = String(row[columnMappings.invoiceNumber || ''] || 'N/A')
      const taxpayerName = String(row[columnMappings.taxpayerName || ''] || 'N/A')
      const documentType = DocumentClassificationService.classifyDocument(row)
      const taxRatio = convertedTotalAmount > 0 ? convertedTaxAmount / convertedTotalAmount : 0

      const optimizedInvoice: OptimizedInvoice = {
        invoiceNumber,
        taxpayerName,
        totalAmount: convertedTotalAmount,
        taxAmount: convertedTaxAmount,
        currency: currency === 'USD' ? 'USD' : 'GTQ',
        documentType,
        originalRow: row,
        taxRatio,
        efficiencyScore: 0,
        isValid: true
      }

      optimizedInvoice.efficiencyScore = InvoiceScoreService.calculateEfficiencyScore(optimizedInvoice)
      invoices.push(optimizedInvoice)
    }

    return invoices
  },


  getInvoicesByDocumentType(
    optimizationResult: InvoiceOptimizationResult
  ): Record<DocumentType, OptimizedInvoice[]> {
    const byType: Record<DocumentType, OptimizedInvoice[]> = {
      FACT: [],
      NDEB: [],
      NCRE: [],
      OTHER: []
    }

    for (const invoice of optimizationResult.selectedInvoices) {
      byType[invoice.documentType].push(invoice)
    }

    return byType
  },

  calculateOptimizationStats(
    optimizationResult: InvoiceOptimizationResult
  ): {
    averageInvoiceAmount: number
    averageTaxAmount: number
    documentTypeDistribution: Record<DocumentType, number>
    currencyDistribution: Record<string, number>
  } {
    const invoices = optimizationResult.selectedInvoices
    
    if (invoices.length === 0) {
      return {
        averageInvoiceAmount: 0,
        averageTaxAmount: 0,
        documentTypeDistribution: { FACT: 0, NDEB: 0, NCRE: 0, OTHER: 0 },
        currencyDistribution: {}
      }
    }

    const averageInvoiceAmount = invoices.reduce((sum: number, inv: OptimizedInvoice) => sum + inv.totalAmount, 0) / invoices.length
    const averageTaxAmount = invoices.reduce((sum: number, inv: OptimizedInvoice) => sum + inv.taxAmount, 0) / invoices.length

    const documentTypeDistribution: Record<DocumentType, number> = { FACT: 0, NDEB: 0, NCRE: 0, OTHER: 0 }
    const currencyDistribution: Record<string, number> = {}

    for (const invoice of invoices) {
      documentTypeDistribution[invoice.documentType]++
      currencyDistribution[invoice.currency] = (currencyDistribution[invoice.currency] || 0) + 1
    }

    return {
      averageInvoiceAmount,
      averageTaxAmount,
      documentTypeDistribution,
      currencyDistribution
    }
  },

  parseNumericValue(value: string | number | Date): number {
    if (typeof value === 'number') return value
    
    const cleanedValue = String(value).replace(/[,\s]/g, '')
    const numericValue = parseFloat(cleanedValue)
    
    return isNaN(numericValue) ? 0 : numericValue
  }
}
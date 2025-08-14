import type { 
  ExcelRow, 
  OptimizedInvoice, 
  InvoiceOptimizationResult,
  ColumnMapping,
  DocumentType
} from '../types/tax.types'
import { DocumentClassificationService } from './DocumentClassificationService'

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

    const selectedInvoices = this.findOptimalCombination(
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
      const taxAmount = this.parseNumericValue(row[columnMappings.tax || ''])
      
      if (taxAmount <= 0) continue

      const totalAmount = this.parseNumericValue(row[columnMappings.total || ''])
      const currency = String(row[columnMappings.currency || 'GTQ']).toUpperCase()
      
      const convertedTaxAmount = currency === 'USD' ? taxAmount * exchangeRate : taxAmount
      const convertedTotalAmount = currency === 'USD' ? totalAmount * exchangeRate : totalAmount

      const invoiceNumber = String(row[columnMappings.invoiceNumber || ''] || 'N/A')
      const taxpayerName = String(row[columnMappings.taxpayerName || ''] || 'N/A')
      
      const documentType = DocumentClassificationService.classifyDocument(row)

      invoices.push({
        invoiceNumber,
        taxpayerName,
        totalAmount: convertedTotalAmount,
        taxAmount: convertedTaxAmount,
        currency: currency === 'USD' ? 'USD' : 'GTQ',
        documentType,
        originalRow: row
      })
    }

    return invoices.sort((a, b) => b.taxAmount - a.taxAmount)
  },

  findOptimalCombination(
    invoices: OptimizedInvoice[],
    targetAmount: number
  ): OptimizedInvoice[] {
    if (invoices.length === 0 || targetAmount <= 0) return []

    const n = invoices.length
    const target = Math.floor(targetAmount * 100)
    const dp: boolean[][] = Array(n + 1).fill(null).map(() => Array(target + 1).fill(false))
    const parent: number[][] = Array(n + 1).fill(null).map(() => Array(target + 1).fill(-1))

    dp[0][0] = true

    for (let i = 1; i <= n; i++) {
      const invoice = invoices[i - 1]
      const weight = Math.floor(invoice.taxAmount * 100)

      for (let w = 0; w <= target; w++) {
        dp[i][w] = dp[i - 1][w]
        if (dp[i][w]) {
          parent[i][w] = 0
        }

        if (weight <= w && dp[i - 1][w - weight]) {
          if (!dp[i][w] || this.shouldPreferThisCombination(invoice)) {
            dp[i][w] = true
            parent[i][w] = 1
          }
        }
      }
    }

    let bestAmount = 0
    for (let w = target; w >= 0; w--) {
      if (dp[n][w]) {
        bestAmount = w
        break
      }
    }

    const selectedInvoices: OptimizedInvoice[] = []
    let currentInvoice = n
    let currentWeight = bestAmount

    while (currentInvoice > 0 && currentWeight > 0) {
      if (parent[currentInvoice][currentWeight] === 1) {
        selectedInvoices.push(invoices[currentInvoice - 1])
        const invoiceWeight = Math.floor(invoices[currentInvoice - 1].taxAmount * 100)
        currentWeight -= invoiceWeight
      }
      currentInvoice--
    }

    return selectedInvoices.sort((a, b) => b.taxAmount - a.taxAmount)
  },

  shouldPreferThisCombination(currentInvoice: OptimizedInvoice): boolean {
    if (currentInvoice.documentType === 'FACT') return true
    if (currentInvoice.documentType === 'NCRE') return false
    
    return Math.random() > 0.5
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
import type { ExcelRow, TaxCalculationResult, ColumnMapping } from '../types/tax.types'
import { DocumentClassificationService } from './DocumentClassificationService'
import { InvoiceOptimizationService } from './InvoiceOptimizationService'

const sumColumnValues = (
  data: ExcelRow[], 
  columnName: string | null | undefined, 
  currencyColumn: string | null | undefined, 
  exchangeRate: number
): { total: number; usdCount: number; gtqCount: number; originalUsdTotal: number } => {
  if (!columnName) return { total: 0, usdCount: 0, gtqCount: 0, originalUsdTotal: 0 }
  
  let total = 0
  let usdCount = 0
  let gtqCount = 0
  let originalUsdTotal = 0
  
  for (const row of data) {
    const value = row[columnName]
    const currency = currencyColumn ? String(row[currencyColumn]).toUpperCase() : 'GTQ'
    const numericValue = parseNumericValue(value)
    
    if (currency === 'USD') {
      // Convert USD to GTQ
      total += numericValue * exchangeRate
      originalUsdTotal += numericValue
      usdCount++
    } else {
      // GTQ or any other currency treated as GTQ
      total += numericValue
      gtqCount++
    }
  }
  
  return { total, usdCount, gtqCount, originalUsdTotal }
}

const parseNumericValue = (value: string | number | Date): number => {
  if (typeof value === 'number') return value
  
  const cleanedValue = String(value).replace(/[,\s]/g, '')
  const numericValue = parseFloat(cleanedValue)
  
  return isNaN(numericValue) ? 0 : numericValue
}

// This function is no longer used - we now get IVA amounts directly from the Excel files
// const calculateTaxAmount = (amount: number): number => {
//   return amount * TAX_RATE
// }

const calculateTaxPayable = (salesTax: number, purchasesTax: number): number => {
  const difference = salesTax - purchasesTax
  return Math.max(difference, 0)
}

const calculateTaxCredit = (salesTax: number, purchasesTax: number): number => {
  const difference = salesTax - purchasesTax
  return difference < 0 ? Math.abs(difference) : 0
}

export const TaxCalculationService = {
  calculateTax(
    salesData: ExcelRow[], 
    purchasesData: ExcelRow[], 
    columnMappings: {
      sales: ColumnMapping
      purchases: ColumnMapping
    },
    exchangeRate: number = 7.75
  ): TaxCalculationResult {
    const salesAmountSummary = sumColumnValues(
      salesData, 
      columnMappings.sales.total,
      columnMappings.sales.currency,
      exchangeRate
    )
    const purchasesAmountSummary = sumColumnValues(
      purchasesData, 
      columnMappings.purchases.total,
      columnMappings.purchases.currency,
      exchangeRate
    )
    
    // Get IVA amounts directly from the Excel files instead of calculating
    const salesTaxSummary = sumColumnValues(
      salesData, 
      columnMappings.sales.tax,
      columnMappings.sales.currency,
      exchangeRate
    )
    const purchasesTaxSummary = sumColumnValues(
      purchasesData, 
      columnMappings.purchases.tax,
      columnMappings.purchases.currency,
      exchangeRate
    )
    
    const totalSales = salesAmountSummary.total
    const totalPurchases = purchasesAmountSummary.total
    
    const salesTax = salesTaxSummary.total
    const purchasesTax = purchasesTaxSummary.total
    
    const taxPayable = calculateTaxPayable(salesTax, purchasesTax)
    const taxCredit = calculateTaxCredit(salesTax, purchasesTax)

    // Generate detailed analysis using new services
    const salesSummary = DocumentClassificationService.createDetailedTaxSummary(
      salesData,
      columnMappings.sales,
      exchangeRate
    )

    const purchasesSummary = DocumentClassificationService.createDetailedTaxSummary(
      purchasesData,
      columnMappings.purchases,
      exchangeRate
    )

    const invoiceOptimization = InvoiceOptimizationService.optimizeInvoiceSelection(
      purchasesData,
      salesTax,
      columnMappings.purchases,
      exchangeRate
    )

    return {
      totalSales,
      totalPurchases,
      salesTax,
      purchasesTax,
      taxPayable,
      taxCredit,
      salesData,
      purchasesData,
      detectedColumns: columnMappings,
      exchangeRate,
      baseCurrency: 'GTQ' as const,
      
      // New detailed analysis
      salesSummary,
      purchasesSummary,
      invoiceOptimization,
      currencyBreakdown: {
        sales: {
          usd: { 
            count: salesAmountSummary.usdCount, 
            total: salesAmountSummary.originalUsdTotal * exchangeRate, 
            originalTotal: salesAmountSummary.originalUsdTotal 
          },
          gtq: { 
            count: salesAmountSummary.gtqCount, 
            total: totalSales - (salesAmountSummary.originalUsdTotal * exchangeRate) 
          }
        },
        purchases: {
          usd: { 
            count: purchasesAmountSummary.usdCount, 
            total: purchasesAmountSummary.originalUsdTotal * exchangeRate, 
            originalTotal: purchasesAmountSummary.originalUsdTotal 
          },
          gtq: { 
            count: purchasesAmountSummary.gtqCount, 
            total: totalPurchases - (purchasesAmountSummary.originalUsdTotal * exchangeRate) 
          }
        }
      },
      taxBreakdown: {
        sales: {
          usd: { 
            count: salesTaxSummary.usdCount, 
            total: salesTaxSummary.originalUsdTotal * exchangeRate, 
            originalTotal: salesTaxSummary.originalUsdTotal 
          },
          gtq: { 
            count: salesTaxSummary.gtqCount, 
            total: salesTax - (salesTaxSummary.originalUsdTotal * exchangeRate) 
          }
        },
        purchases: {
          usd: { 
            count: purchasesTaxSummary.usdCount, 
            total: purchasesTaxSummary.originalUsdTotal * exchangeRate, 
            originalTotal: purchasesTaxSummary.originalUsdTotal 
          },
          gtq: { 
            count: purchasesTaxSummary.gtqCount, 
            total: purchasesTax - (purchasesTaxSummary.originalUsdTotal * exchangeRate) 
          }
        }
      }
    }
  }
}
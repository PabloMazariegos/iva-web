import type { ExcelRow, TaxCalculationResult, ColumnMapping } from '../types/tax.types'
import { TAX_RATE } from '../types/tax.types'

const sumColumnValues = (data: ExcelRow[], columnName: string | null | undefined): number => {
  if (!columnName) return 0
  
  return data.reduce((sum, row) => {
    const value = row[columnName]
    const numericValue = parseNumericValue(value)
    return sum + numericValue
  }, 0)
}

const parseNumericValue = (value: string | number | Date): number => {
  if (typeof value === 'number') return value
  
  const cleanedValue = String(value).replace(/[,\s]/g, '')
  const numericValue = parseFloat(cleanedValue)
  
  return isNaN(numericValue) ? 0 : numericValue
}

const calculateTaxAmount = (amount: number): number => {
  return amount * TAX_RATE
}

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
    }
  ): TaxCalculationResult {
    const totalSales = sumColumnValues(salesData, columnMappings.sales.total)
    const totalPurchases = sumColumnValues(purchasesData, columnMappings.purchases.total)
    
    const salesTax = calculateTaxAmount(totalSales)
    const purchasesTax = calculateTaxAmount(totalPurchases)
    
    const taxPayable = calculateTaxPayable(salesTax, purchasesTax)
    const taxCredit = calculateTaxCredit(salesTax, purchasesTax)

    return {
      totalSales,
      totalPurchases,
      salesTax,
      purchasesTax,
      taxPayable,
      taxCredit,
      salesData,
      purchasesData,
      detectedColumns: columnMappings
    }
  }
}
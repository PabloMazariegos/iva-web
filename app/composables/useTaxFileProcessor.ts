import type { ExcelRow, ColumnMapping } from "~~/server/types/tax.types"

export interface TaxCalculationResult {
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
}

export interface FileUploadState {
  salesFile: File | null
  purchasesFile: File | null
  isProcessing: boolean
  results: TaxCalculationResult | null
  error: string | null
}

export const useTaxFileProcessor = () => {
  const state = ref<FileUploadState>({
    salesFile: null,
    purchasesFile: null,
    isProcessing: false,
    results: null,
    error: null
  })

  const setSalesFile = (file: File | null) => {
    state.value.salesFile = file
    clearError()
  }

  const setPurchasesFile = (file: File | null) => {
    state.value.purchasesFile = file
    clearError()
  }

  const clearError = () => {
    state.value.error = null
  }

  const clearResults = () => {
    state.value.results = null
    clearError()
  }

  const resetState = () => {
    state.value = {
      salesFile: null,
      purchasesFile: null,
      isProcessing: false,
      results: null,
      error: null
    }
  }

  const canProcess = computed(() => {
    return state.value.salesFile !== null && 
           state.value.purchasesFile !== null && 
           !state.value.isProcessing
  })

  const processFiles = async (): Promise<boolean> => {
    if (!canProcess.value) {
      state.value.error = 'Both sales and purchases files are required'
      return false
    }

    state.value.isProcessing = true
    clearError()
    clearResults()

    try {
      const formData = createFormData()
      const response = await $fetch<{ success: boolean; data: TaxCalculationResult }>('/api/process-excel', {
        method: 'POST',
        body: formData
      })

      if (response.success) {
        state.value.results = response.data
        return true
      } else {
        throw new Error('Processing failed')
      }
    } catch (error) {
      handleProcessingError(error)
      return false
    } finally {
      state.value.isProcessing = false
    }
  }

  const createFormData = (): FormData => {
    const formData = new FormData()
    
    if (state.value.salesFile) {
      formData.append('sales', state.value.salesFile)
    }
    
    if (state.value.purchasesFile) {
      formData.append('purchases', state.value.purchasesFile)
    }
    
    return formData
  }

  const handleProcessingError = (error: unknown) => {
    console.error('Processing error:', error)
    
    if (error && typeof error === 'object' && 'data' in error && 
        error.data && typeof error.data === 'object' && 'statusMessage' in error.data) {
      state.value.error = String(error.data.statusMessage)
    } else if (error && typeof error === 'object' && 'message' in error) {
      state.value.error = String(error.message)
    } else {
      state.value.error = 'An unexpected error occurred while processing files'
    }
  }

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-GT', {
      style: 'currency',
      currency: 'GTQ',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const downloadResults = () => {
    if (!state.value.results) return

    const results = state.value.results
    const reportData = {
      summary: {
        totalSales: results.totalSales,
        totalPurchases: results.totalPurchases,
        salesTax: results.salesTax,
        purchasesTax: results.purchasesTax,
        taxPayable: results.taxPayable,
        taxCredit: results.taxCredit
      },
      detectedColumns: results.detectedColumns,
      salesData: results.salesData,
      purchasesData: results.purchasesData,
      generatedAt: new Date().toISOString()
    }

    const dataStr = JSON.stringify(reportData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `tax-report-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    
    URL.revokeObjectURL(url)
  }

  return {
    // State
    state: readonly(state),
    
    // Computed
    canProcess,
    
    // Actions
    setSalesFile,
    setPurchasesFile,
    processFiles,
    clearError,
    clearResults,
    resetState,
    downloadResults,
    
    // Utilities
    formatCurrency
  }
}
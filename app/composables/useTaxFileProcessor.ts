import type { TaxCalculationResult } from "~~/server/types/tax.types"

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
    state.value.error = null
  }

  const setPurchasesFile = (file: File | null) => {
    state.value.purchasesFile = file
    state.value.error = null
  }

  const clearError = () => {
    state.value.error = null
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

  const processFiles = async (exchangeRate?: number): Promise<boolean> => {
    if (!canProcess.value) {
      state.value.error = 'Se requieren ambos archivos de ventas y compras'
      return false
    }

    if (exchangeRate && (exchangeRate <= 0 || exchangeRate < 1 || exchangeRate > 15)) {
      state.value.error = 'La tasa de cambio debe estar entre 1 y 15'
      return false
    }

    state.value.isProcessing = true
    state.value.error = null
    state.value.results = null

    try {
      const formData = new FormData()
      formData.append('sales', state.value.salesFile!)
      formData.append('purchases', state.value.purchasesFile!)
      if (exchangeRate) {
        formData.append('exchangeRate', exchangeRate.toString())
      }

      const response = await $fetch<{ success: boolean; data: TaxCalculationResult }>('/api/process-excel', {
        method: 'POST',
        body: formData
      })

      if (response.success) {
        state.value.results = response.data
        return true
      } else {
        throw new Error('Error al procesar los archivos')
      }
    } catch (error) {
      console.error('Processing error:', error)
      
      if (error && typeof error === 'object' && 'data' in error && 
          error.data && typeof error.data === 'object' && 'statusMessage' in error.data) {
        state.value.error = String(error.data.statusMessage)
      } else if (error && typeof error === 'object' && 'message' in error) {
        state.value.error = String(error.message)
      } else {
        state.value.error = 'Ocurrió un error inesperado al procesar los archivos'
      }
      return false
    } finally {
      state.value.isProcessing = false
    }
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
    link.download = `reporte-iva-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    
    URL.revokeObjectURL(url)
  }

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-GT', {
      style: 'currency',
      currency: 'GTQ',
      minimumFractionDigits: 2
    }).format(amount)
  }

  return {
    state: readonly(state),
    canProcess,
    setSalesFile,
    setPurchasesFile,
    processFiles,
    clearError,
    resetState,
    downloadResults,
    formatCurrency
  }
}
import { FileValidationService } from '../services/FileValidationService'
import { ExcelProcessingService } from '../services/ExcelProcessingService'
import { TaxCalculationService } from '../services/TaxCalculationService'
import type { ExcelRow } from '../types/tax.types'
import type { EventHandlerRequest, H3Event } from 'h3'

export default defineEventHandler(async (event) => {
  try {
    const { salesFile, purchasesFile, exchangeRate } = await extractFilesFromRequest(event)
    
    validateFiles(salesFile, purchasesFile)
    validateExchangeRate(exchangeRate)
    
    const excelProcessor = new ExcelProcessingService()
    
    const [salesProcessed, purchasesProcessed] = await Promise.all([
      excelProcessor.processExcelFile(salesFile.stream()),
      excelProcessor.processExcelFile(purchasesFile.stream())
    ])

    validateProcessedData(salesProcessed.data, purchasesProcessed.data)

    const taxCalculation = TaxCalculationService.calculateTax(
      salesProcessed.data,
      purchasesProcessed.data,
      {
        sales: salesProcessed.detectedColumns,
        purchases: purchasesProcessed.detectedColumns
      },
      exchangeRate
    )

    return {
      success: true,
      data: taxCalculation
    }

  } catch (error) {
    return handleError(error)
  }
})

async function extractFilesFromRequest(event: H3Event<EventHandlerRequest>): Promise<{ salesFile: File; purchasesFile: File; exchangeRate: number }> {
  const formData = await readMultipartFormData(event)
  
  if (!formData?.length) {
    throw createError({
      statusCode: 400,
      statusMessage: 'No files received'
    })
  }

  let salesFile: File | null = null
  let purchasesFile: File | null = null
  let exchangeRate = 7.75 // Default rate

  for (const item of formData) {
    if (item.name === 'sales' && item.data) {
      salesFile = new File([new Uint8Array(item.data)], item.filename || 'sales.xlsx')
    } else if (item.name === 'purchases' && item.data) {
      purchasesFile = new File([new Uint8Array(item.data)], item.filename || 'purchases.xlsx')
    } else if (item.name === 'exchangeRate' && item.data) {
      const rateStr = new TextDecoder().decode(item.data)
      const parsedRate = parseFloat(rateStr)
      if (!isNaN(parsedRate)) {
        exchangeRate = parsedRate
      }
    }
  }

  if (!salesFile || !purchasesFile) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Both files required: sales and purchases'
    })
  }

  return { salesFile, purchasesFile, exchangeRate }
}

function validateFiles(salesFile: File, purchasesFile: File): void {
  const salesValidation = FileValidationService.validateExcelFile(salesFile)
  if (!salesValidation.isValid) {
    throw createError({
      statusCode: 400,
      statusMessage: `Sales file: ${salesValidation.errorMessage}`
    })
  }

  const purchasesValidation = FileValidationService.validateExcelFile(purchasesFile)
  if (!purchasesValidation.isValid) {
    throw createError({
      statusCode: 400,
      statusMessage: `Purchases file: ${purchasesValidation.errorMessage}`
    })
  }
}

function validateExchangeRate(exchangeRate: number): void {
  if (!exchangeRate || exchangeRate <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Exchange rate must be greater than 0'
    })
  }
  
  if (exchangeRate < 1 || exchangeRate > 15) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Exchange rate must be between 1 and 15'
    })
  }
}

function validateProcessedData(salesData: ExcelRow[], purchasesData: ExcelRow[]): void {
  if (salesData.length === 0 || purchasesData.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Excel files are empty or contain no valid data'
    })
  }
}

function handleError(error: unknown) {
  console.error('Error processing Excel files:', error)
  
  if (error && typeof error === 'object' && 'statusCode' in error) {
    throw error
  }
  
  // Handle specific Excel processing errors
  if (error instanceof Error) {
    if (error.message.includes('Failed to parse Excel file') || 
        error.message.includes('Failed to read file stream') ||
        error.message.includes('decode')) {
      throw createError({
        statusCode: 400,
        statusMessage: `Excel file processing error: ${error.message}. Please ensure the file is a valid Excel file (.xlsx or .xls) and is not corrupted.`
      })
    }
  }
  
  throw createError({
    statusCode: 500,
    statusMessage: `Internal server error: ${error && typeof error === 'object' && 'message' in error ? error.message : 'Unknown error'}`
  })
}

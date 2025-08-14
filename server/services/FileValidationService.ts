import type { FileValidationResult } from '../types/tax.types'
import { MAX_FILE_SIZE, ALLOWED_EXTENSIONS } from '../types/tax.types'

const validateFileExtension = (fileName: string): FileValidationResult => {
  const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'))
  
  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return {
      isValid: false,
      errorMessage: `File ${fileName}: must be Excel format (.xlsx or .xls)`
    }
  }

  return { isValid: true }
}

const validateFileSize = (fileSize: number): FileValidationResult => {
  if (fileSize > MAX_FILE_SIZE) {
    return {
      isValid: false,
      errorMessage: `File size must not exceed ${MAX_FILE_SIZE / (1024 * 1024)}MB`
    }
  }

  return { isValid: true }
}

export const FileValidationService = {
  validateExcelFile(file: File): FileValidationResult {
    const extensionValidation = validateFileExtension(file.name)
    if (!extensionValidation.isValid) {
      return extensionValidation
    }

    const sizeValidation = validateFileSize(file.size)
    if (!sizeValidation.isValid) {
      return sizeValidation
    }

    return { isValid: true }
  }
}
import type { OptimizedInvoice, DocumentType } from '../types/tax.types'

export const InvoiceScoreService = {
  calculateEfficiencyScore(invoice: OptimizedInvoice): number {
    const taxRatioScore = this.calculateTaxRatioScore(invoice.taxRatio)
    const documentTypeScore = this.getDocumentTypeScore(invoice.documentType)
    const sizeScore = this.calculateSizeScore(invoice.taxAmount)

    return taxRatioScore * 0.5 + documentTypeScore * 0.3 + sizeScore * 0.2
  },

  calculateTaxRatioScore(taxRatio: number): number {
    const optimalRatio = 0.12
    const difference = Math.abs(taxRatio - optimalRatio)

    if (difference <= 0.005) return 1.0
    if (difference <= 0.01) return 0.8
    if (difference <= 0.02) return 0.6
    if (difference <= 0.03) return 0.4
    return 0.2
  },

  getDocumentTypeScore(documentType: DocumentType): number {
    const scores: Record<DocumentType, number> = {
      'FACT': 1.0,
      'NDEB': 0.8,
      'OTHER': 0.6,
      'NCRE': 0.3
    }
    return scores[documentType] || 0.5
  },

  calculateSizeScore(taxAmount: number): number {
    if (taxAmount >= 100) return 1.0
    if (taxAmount >= 50) return 0.8
    if (taxAmount >= 20) return 0.6
    if (taxAmount >= 5) return 0.4
    return 0.2
  }
}
import type { OptimizedInvoice } from '../types/tax.types'

export const OptimizedInvoiceSelectionService = {
  selectOptimalInvoices(invoices: OptimizedInvoice[], targetAmount: number): OptimizedInvoice[] {
    const validInvoices = this.filterValidInvoices(invoices)
    const sortedInvoices = this.sortByEfficiency(validInvoices)

    return this.greedyKnapsack(sortedInvoices, targetAmount)
  },

  filterValidInvoices(invoices: OptimizedInvoice[]): OptimizedInvoice[] {
    return invoices.filter(invoice => invoice.isValid && invoice.taxAmount > 0)
  },

  sortByEfficiency(invoices: OptimizedInvoice[]): OptimizedInvoice[] {
    return [...invoices].sort((a, b) => {
      const efficiencyDiff = b.efficiencyScore - a.efficiencyScore
      if (Math.abs(efficiencyDiff) > 0.1) return efficiencyDiff

      return b.taxAmount - a.taxAmount
    })
  },

  greedyKnapsack(sortedInvoices: OptimizedInvoice[], targetAmount: number): OptimizedInvoice[] {
    const selected: OptimizedInvoice[] = []
    let currentTotal = 0
    const tolerance = targetAmount * 0.05

    for (const invoice of sortedInvoices) {
      const newTotal = currentTotal + invoice.taxAmount

      if (newTotal <= targetAmount + tolerance) {
        selected.push(invoice)
        currentTotal = newTotal

        if (currentTotal >= targetAmount - tolerance) {
          break
        }
      }
    }

    return this.refineSelection(selected, targetAmount)
  },

  refineSelection(selected: OptimizedInvoice[], targetAmount: number): OptimizedInvoice[] {
    const currentTotal = selected.reduce((sum, inv) => sum + inv.taxAmount, 0)

    if (currentTotal >= targetAmount * 0.95) {
      return selected
    }

    return this.attemptBetterCombination(selected, targetAmount) || selected
  },

  attemptBetterCombination(selected: OptimizedInvoice[], targetAmount: number): OptimizedInvoice[] | null {
    const currentTotal = selected.reduce((sum, inv) => sum + inv.taxAmount, 0)
    const gap = targetAmount - currentTotal

    if (gap <= 0) return null

    const remainingInvoices = selected.filter(inv => inv.taxAmount <= gap * 2)

    for (const invoice of remainingInvoices) {
      if (invoice.taxAmount >= gap * 0.8 && invoice.taxAmount <= gap * 1.2) {
        return [...selected.filter(inv => inv !== invoice), invoice]
      }
    }

    return null
  }
}
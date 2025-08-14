<template>
  <Card class="hover:shadow-lg transition-shadow duration-300">
    <template #header>
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-2">
          <Icon name="i-heroicons-document-text" class="text-xl" />
          <span class="font-medium">{{ title }}</span>
        </div>
        <Badge :value="summary.invoiceCount" size="small" />
      </div>
    </template>
    <template #content>
      <div class="space-y-4">
        <!-- Regular Invoices (FACT) -->
        <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center space-x-2">
              <Icon name="i-heroicons-document-check" class="text-blue-600" />
              <span class="font-medium text-blue-800 dark:text-blue-200">Facturas Regulares</span>
            </div>
            <Badge :value="documentBreakdown.regular.count" severity="info" size="small" />
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div class="space-y-2">
              <div class="flex justify-between">
                <span class="text-surface-600 dark:text-surface-400">Total Monto:</span>
                <span class="font-medium">{{ formatCurrency(documentBreakdown.regular.totalAmount) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-surface-600 dark:text-surface-400">Total IVA:</span>
                <span class="font-medium text-blue-600">{{ formatCurrency(documentBreakdown.regular.totalTax) }}</span>
              </div>
            </div>
            <div class="text-xs text-surface-500 dark:text-surface-400">
              Incluye facturas estándar (FACT) y otros tipos de documentos
            </div>
          </div>
        </div>

        <!-- Debit Notes (NDEB) -->
        <div v-if="documentBreakdown.debitNotes.count > 0" class="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center space-x-2">
              <Icon name="i-heroicons-arrow-trending-up" class="text-orange-600" />
              <span class="font-medium text-orange-800 dark:text-orange-200">Notas de Débito (NDEB)</span>
            </div>
            <Badge :value="documentBreakdown.debitNotes.count" severity="warning" size="small" />
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div class="space-y-2">
              <div class="flex justify-between">
                <span class="text-surface-600 dark:text-surface-400">Total Monto:</span>
                <span class="font-medium">{{ formatCurrency(documentBreakdown.debitNotes.totalAmount) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-surface-600 dark:text-surface-400">Total IVA:</span>
                <span class="font-medium text-orange-600">{{ formatCurrency(documentBreakdown.debitNotes.totalTax) }}</span>
              </div>
            </div>
            <div class="text-xs text-surface-500 dark:text-surface-400">
              Incrementan el monto total de {{ isForSales ? 'ventas' : 'compras' }}
            </div>
          </div>
        </div>

        <!-- Credit Notes (NCRE) -->
        <div v-if="documentBreakdown.creditNotes.count > 0" class="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center space-x-2">
              <Icon name="i-heroicons-arrow-trending-down" class="text-green-600" />
              <span class="font-medium text-green-800 dark:text-green-200">Notas de Crédito (NCRE)</span>
            </div>
            <Badge :value="documentBreakdown.creditNotes.count" severity="success" size="small" />
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div class="space-y-2">
              <div class="flex justify-between">
                <span class="text-surface-600 dark:text-surface-400">Total Monto:</span>
                <span class="font-medium">{{ formatCurrency(documentBreakdown.creditNotes.totalAmount) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-surface-600 dark:text-surface-400">Total IVA:</span>
                <span class="font-medium text-green-600">{{ formatCurrency(documentBreakdown.creditNotes.totalTax) }}</span>
              </div>
            </div>
            <div class="text-xs text-surface-500 dark:text-surface-400">
              Reducen el monto total de {{ isForSales ? 'ventas' : 'compras' }}
            </div>
          </div>
        </div>

        <!-- Summary Totals -->
        <div class="bg-surface-100 dark:bg-surface-800 p-4 rounded-lg border-t-2 border-primary-500">
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div class="space-y-2">
              <div class="flex justify-between">
                <span class="font-medium text-surface-700 dark:text-surface-300">Total Facturas:</span>
                <span class="font-bold">{{ summary.invoiceCount }}</span>
              </div>
              <div class="flex justify-between">
                <span class="font-medium text-surface-700 dark:text-surface-300">Monto Total:</span>
                <span class="font-bold">{{ formatCurrency(summary.totalAmount) }}</span>
              </div>
            </div>
            <div class="space-y-2">
              <div class="flex justify-between">
                <span class="font-medium text-surface-700 dark:text-surface-300">IVA Total:</span>
                <span class="font-bold text-primary-600">{{ formatCurrency(summary.totalTax) }}</span>
              </div>
              <div class="flex justify-between text-xs text-surface-500 dark:text-surface-400">
                <span>Tasa Efectiva:</span>
                <span>{{ calculateEffectiveRate() }}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </Card>
</template>

<script setup lang="ts">
import type { DetailedTaxSummary } from '~~/server/types/tax.types'

interface Props {
  summary: DetailedTaxSummary
  title: string
  isForSales: boolean
}

const props = defineProps<Props>()

const documentBreakdown = computed(() => props.summary.documentBreakdown)

const calculateEffectiveRate = (): string => {
  if (props.summary.totalAmount === 0) return '0.00'
  const netAmount = props.summary.totalAmount - props.summary.totalTax
  if (netAmount === 0) return '0.00'
  const rate = (props.summary.totalTax / netAmount) * 100
  return rate.toFixed(2)
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-GT', {
    style: 'currency',
    currency: 'GTQ',
    minimumFractionDigits: 2
  }).format(amount)
}
</script>
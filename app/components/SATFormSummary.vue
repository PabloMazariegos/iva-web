<template>
  <Card class="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-300 dark:border-green-700 shadow-xl">
    <template #header>
      <div class="bg-green-600 dark:bg-green-800 text-white p-6 rounded-t-lg">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <Icon name="i-heroicons-document-text" class="text-3xl" />
            <div>
              <h3 class="text-2xl font-bold">Datos para Formulario SAT</h3>
              <p class="text-green-100 text-sm mt-1">Información lista para declaración de IVA</p>
            </div>
          </div>
          <Badge value="SAT" severity="success" size="large" class="text-lg px-4 py-2" />
        </div>
      </div>
    </template>

    <template #content>
      <div class="space-y-6">
        <!-- Main SAT Form Fields -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- VENTAS (Left Column) -->
          <div class="space-y-4">
            <div class="flex items-center space-x-2 mb-4 pb-2 border-b-2 border-blue-300 dark:border-blue-700">
              <Icon name="i-heroicons-arrow-trending-up" class="text-2xl text-blue-600" />
              <h4 class="text-xl font-bold text-blue-800 dark:text-blue-200">Ventas</h4>
            </div>

            <!-- Ventas Gravadas -->
            <div class="bg-white dark:bg-surface-800 p-4 rounded-lg shadow-md border-l-4 border-blue-500">
              <div class="flex items-start justify-between mb-2">
                <div class="flex-1">
                  <div class="flex items-center space-x-2 mb-1">
                    <span class="text-sm font-medium text-surface-600 dark:text-surface-400">Ventas Gravadas</span>
                    <button
                      @click="copyToClipboard(summary.totalSales, 'Ventas Gravadas')"
                      class="text-surface-400 hover:text-blue-600 transition-colors"
                      title="Copiar valor"
                    >
                      <Icon name="i-heroicons-clipboard-document" class="text-lg" />
                    </button>
                  </div>
                  <p class="text-3xl font-bold text-blue-700 dark:text-blue-300">
                    {{ formatCurrency(summary.totalSales) }}
                  </p>
                  <p class="text-xs text-surface-500 dark:text-surface-400 mt-1">
                    Total de todas las ventas del período
                  </p>
                </div>
              </div>
            </div>

            <!-- Total Facturas Emitidas -->
            <div class="bg-white dark:bg-surface-800 p-4 rounded-lg shadow-md border-l-4 border-blue-400">
              <div class="flex items-start justify-between mb-2">
                <div class="flex-1">
                  <div class="flex items-center space-x-2 mb-1">
                    <span class="text-sm font-medium text-surface-600 dark:text-surface-400">Total Facturas Emitidas</span>
                    <button
                      @click="copyToClipboard(salesSummary.invoiceCount.toString(), 'Total Facturas Emitidas')"
                      class="text-surface-400 hover:text-blue-600 transition-colors"
                      title="Copiar valor"
                    >
                      <Icon name="i-heroicons-clipboard-document" class="text-lg" />
                    </button>
                  </div>
                  <p class="text-3xl font-bold text-blue-700 dark:text-blue-300">
                    {{ salesSummary.invoiceCount }}
                  </p>
                  <p class="text-xs text-surface-500 dark:text-surface-400 mt-1">
                    Cantidad total de documentos emitidos
                  </p>
                </div>
              </div>

              <!-- Desglose de documentos de ventas -->
              <div class="mt-3 pt-3 border-t border-surface-200 dark:border-surface-700 space-y-1 text-xs">
                <div class="flex justify-between">
                  <span class="text-surface-600 dark:text-surface-400">Facturas:</span>
                  <span class="font-medium">{{ salesSummary.documentBreakdown.regular.count }}</span>
                </div>
                <div v-if="salesSummary.documentBreakdown.debitNotes.count > 0" class="flex justify-between text-orange-600">
                  <span>Notas de Débito:</span>
                  <span class="font-medium">{{ salesSummary.documentBreakdown.debitNotes.count }}</span>
                </div>
                <div v-if="salesSummary.documentBreakdown.creditNotes.count > 0" class="flex justify-between text-green-600">
                  <span>Notas de Crédito:</span>
                  <span class="font-medium">{{ salesSummary.documentBreakdown.creditNotes.count }}</span>
                </div>
              </div>
            </div>

            <!-- Notas de Crédito VENTAS (si existen) -->
            <div
              v-if="salesSummary.documentBreakdown.creditNotes.count > 0"
              class="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg shadow-md border-l-4 border-green-500"
            >
              <div class="flex items-start justify-between mb-2">
                <div class="flex-1">
                  <div class="flex items-center space-x-2 mb-1">
                    <Icon name="i-heroicons-arrow-trending-down" class="text-green-600" />
                    <span class="text-sm font-medium text-green-700 dark:text-green-300">Notas de Crédito Emitidas</span>
                    <button
                      @click="copyToClipboard(salesSummary.documentBreakdown.creditNotes.totalAmount, 'Notas de Crédito Ventas')"
                      class="text-surface-400 hover:text-green-600 transition-colors"
                      title="Copiar valor"
                    >
                      <Icon name="i-heroicons-clipboard-document" class="text-lg" />
                    </button>
                  </div>
                  <p class="text-2xl font-bold text-green-700 dark:text-green-300">
                    {{ formatCurrency(salesSummary.documentBreakdown.creditNotes.totalAmount) }}
                  </p>
                  <div class="mt-2 text-xs space-y-1">
                    <div class="flex justify-between">
                      <span class="text-surface-600 dark:text-surface-400">Cantidad:</span>
                      <span class="font-medium">{{ salesSummary.documentBreakdown.creditNotes.count }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-surface-600 dark:text-surface-400">IVA:</span>
                      <span class="font-medium text-green-600">{{ formatCurrency(salesSummary.documentBreakdown.creditNotes.totalTax) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Notas de Débito VENTAS (si existen) -->
            <div
              v-if="salesSummary.documentBreakdown.debitNotes.count > 0"
              class="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg shadow-md border-l-4 border-orange-500"
            >
              <div class="flex items-start justify-between mb-2">
                <div class="flex-1">
                  <div class="flex items-center space-x-2 mb-1">
                    <Icon name="i-heroicons-arrow-trending-up" class="text-orange-600" />
                    <span class="text-sm font-medium text-orange-700 dark:text-orange-300">Notas de Débito Emitidas</span>
                    <button
                      @click="copyToClipboard(salesSummary.documentBreakdown.debitNotes.totalAmount, 'Notas de Débito Ventas')"
                      class="text-surface-400 hover:text-orange-600 transition-colors"
                      title="Copiar valor"
                    >
                      <Icon name="i-heroicons-clipboard-document" class="text-lg" />
                    </button>
                  </div>
                  <p class="text-2xl font-bold text-orange-700 dark:text-orange-300">
                    {{ formatCurrency(salesSummary.documentBreakdown.debitNotes.totalAmount) }}
                  </p>
                  <div class="mt-2 text-xs space-y-1">
                    <div class="flex justify-between">
                      <span class="text-surface-600 dark:text-surface-400">Cantidad:</span>
                      <span class="font-medium">{{ salesSummary.documentBreakdown.debitNotes.count }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-surface-600 dark:text-surface-400">IVA:</span>
                      <span class="font-medium text-orange-600">{{ formatCurrency(salesSummary.documentBreakdown.debitNotes.totalTax) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- COMPRAS (Right Column) -->
          <div class="space-y-4">
            <div class="flex items-center space-x-2 mb-4 pb-2 border-b-2 border-green-300 dark:border-green-700">
              <Icon name="i-heroicons-arrow-trending-down" class="text-2xl text-green-600" />
              <h4 class="text-xl font-bold text-green-800 dark:text-green-200">Compras</h4>
            </div>

            <!-- Otras Compras -->
            <div class="bg-white dark:bg-surface-800 p-4 rounded-lg shadow-md border-l-4 border-green-500">
              <div class="flex items-start justify-between mb-2">
                <div class="flex-1">
                  <div class="flex items-center space-x-2 mb-1">
                    <span class="text-sm font-medium text-surface-600 dark:text-surface-400">Otras Compras</span>
                    <button
                      @click="copyToClipboard(totalSelectedPurchases, 'Otras Compras')"
                      class="text-surface-400 hover:text-green-600 transition-colors"
                      title="Copiar valor"
                    >
                      <Icon name="i-heroicons-clipboard-document" class="text-lg" />
                    </button>
                  </div>
                  <p class="text-3xl font-bold text-green-700 dark:text-green-300">
                    {{ formatCurrency(totalSelectedPurchases) }}
                  </p>
                  <p class="text-xs text-surface-500 dark:text-surface-400 mt-1">
                    Total de facturas seleccionadas optimizadas
                  </p>
                  <div class="mt-2 pt-2 border-t border-surface-200 dark:border-surface-700">
                    <div class="flex justify-between text-xs">
                      <span class="text-surface-500">Facturas seleccionadas:</span>
                      <span class="font-medium text-primary-600">{{ selectedInvoicesCount }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Total Facturas Recibidas (Seleccionadas) -->
            <div class="bg-white dark:bg-surface-800 p-4 rounded-lg shadow-md border-l-4 border-green-400">
              <div class="flex items-start justify-between mb-2">
                <div class="flex-1">
                  <div class="flex items-center space-x-2 mb-1">
                    <span class="text-sm font-medium text-surface-600 dark:text-surface-400">Total Facturas Recibidas</span>
                    <button
                      @click="copyToClipboard(selectedInvoicesCount.toString(), 'Total Facturas Recibidas')"
                      class="text-surface-400 hover:text-green-600 transition-colors"
                      title="Copiar valor"
                    >
                      <Icon name="i-heroicons-clipboard-document" class="text-lg" />
                    </button>
                  </div>
                  <p class="text-3xl font-bold text-green-700 dark:text-green-300">
                    {{ selectedInvoicesCount }}
                  </p>
                  <p class="text-xs text-surface-500 dark:text-surface-400 mt-1">
                    Facturas seleccionadas para deducción de IVA
                  </p>
                </div>
              </div>

              <!-- Desglose de documentos de compras SELECCIONADAS -->
              <div class="mt-3 pt-3 border-t border-surface-200 dark:border-surface-700 space-y-1 text-xs">
                <div class="flex justify-between">
                  <span class="text-surface-600 dark:text-surface-400">Facturas:</span>
                  <span class="font-medium">{{ selectedInvoicesByType.regular }}</span>
                </div>
                <div v-if="selectedInvoicesByType.debitNotes > 0" class="flex justify-between text-orange-600">
                  <span>Notas de Débito:</span>
                  <span class="font-medium">{{ selectedInvoicesByType.debitNotes }}</span>
                </div>
                <div v-if="selectedInvoicesByType.creditNotes > 0" class="flex justify-between text-green-600">
                  <span>Notas de Crédito:</span>
                  <span class="font-medium">{{ selectedInvoicesByType.creditNotes }}</span>
                </div>
              </div>
            </div>

            <!-- Notas de Crédito COMPRAS SELECCIONADAS (si existen) -->
            <div
              v-if="selectedCreditNotesTotals.count > 0"
              class="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg shadow-md border-l-4 border-green-500"
            >
              <div class="flex items-start justify-between mb-2">
                <div class="flex-1">
                  <div class="flex items-center space-x-2 mb-1">
                    <Icon name="i-heroicons-arrow-trending-down" class="text-green-600" />
                    <span class="text-sm font-medium text-green-700 dark:text-green-300">Notas de Crédito Recibidas (Seleccionadas)</span>
                    <button
                      @click="copyToClipboard(selectedCreditNotesTotals.totalAmount, 'Notas de Crédito Compras')"
                      class="text-surface-400 hover:text-green-600 transition-colors"
                      title="Copiar valor"
                    >
                      <Icon name="i-heroicons-clipboard-document" class="text-lg" />
                    </button>
                  </div>
                  <p class="text-2xl font-bold text-green-700 dark:text-green-300">
                    {{ formatCurrency(selectedCreditNotesTotals.totalAmount) }}
                  </p>
                  <div class="mt-2 text-xs space-y-1">
                    <div class="flex justify-between">
                      <span class="text-surface-600 dark:text-surface-400">Cantidad:</span>
                      <span class="font-medium">{{ selectedCreditNotesTotals.count }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-surface-600 dark:text-surface-400">IVA:</span>
                      <span class="font-medium text-green-600">{{ formatCurrency(selectedCreditNotesTotals.totalTax) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Notas de Débito COMPRAS SELECCIONADAS (si existen) -->
            <div
              v-if="selectedDebitNotesTotals.count > 0"
              class="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg shadow-md border-l-4 border-orange-500"
            >
              <div class="flex items-start justify-between mb-2">
                <div class="flex-1">
                  <div class="flex items-center space-x-2 mb-1">
                    <Icon name="i-heroicons-arrow-trending-up" class="text-orange-600" />
                    <span class="text-sm font-medium text-orange-700 dark:text-orange-300">Notas de Débito Recibidas (Seleccionadas)</span>
                    <button
                      @click="copyToClipboard(selectedDebitNotesTotals.totalAmount, 'Notas de Débito Compras')"
                      class="text-surface-400 hover:text-orange-600 transition-colors"
                      title="Copiar valor"
                    >
                      <Icon name="i-heroicons-clipboard-document" class="text-lg" />
                    </button>
                  </div>
                  <p class="text-2xl font-bold text-orange-700 dark:text-orange-300">
                    {{ formatCurrency(selectedDebitNotesTotals.totalAmount) }}
                  </p>
                  <div class="mt-2 text-xs space-y-1">
                    <div class="flex justify-between">
                      <span class="text-surface-600 dark:text-surface-400">Cantidad:</span>
                      <span class="font-medium">{{ selectedDebitNotesTotals.count }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-surface-600 dark:text-surface-400">IVA:</span>
                      <span class="font-medium text-orange-600">{{ formatCurrency(selectedDebitNotesTotals.totalTax) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Lista de Facturas Seleccionadas (Collapsible) -->
        <div v-if="optimization && optimization.selectedInvoices.length > 0" class="mt-6">
          <div
            class="bg-surface-100 dark:bg-surface-800 p-4 rounded-lg cursor-pointer hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors"
            @click="showInvoiceList = !showInvoiceList"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-3">
                <Icon name="i-heroicons-document-duplicate" class="text-xl text-primary-600" />
                <h4 class="text-lg font-bold text-surface-900 dark:text-surface-0">
                  Listado de Facturas Seleccionadas
                </h4>
                <Badge :value="optimization.selectedInvoices.length" severity="info" />
              </div>
              <Icon
                :name="showInvoiceList ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
                class="text-xl text-surface-600"
              />
            </div>
          </div>

          <div v-if="showInvoiceList" class="mt-4 bg-white dark:bg-surface-900 p-4 rounded-lg shadow-inner">
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead class="bg-surface-100 dark:bg-surface-800">
                  <tr>
                    <th class="px-4 py-2 text-left">No. Factura</th>
                    <th class="px-4 py-2 text-left">Tipo</th>
                    <th class="px-4 py-2 text-left">Proveedor</th>
                    <th class="px-4 py-2 text-right">Monto Total</th>
                    <th class="px-4 py-2 text-right">IVA</th>
                    <th class="px-4 py-2 text-center">Moneda</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(invoice, index) in optimization.selectedInvoices"
                    :key="index"
                    class="border-b border-surface-200 dark:border-surface-700 hover:bg-surface-50 dark:hover:bg-surface-800"
                  >
                    <td class="px-4 py-2">{{ invoice.invoiceNumber }}</td>
                    <td class="px-4 py-2">
                      <Badge
                        :value="invoice.documentType"
                        :severity="getDocumentTypeSeverity(invoice.documentType)"
                        size="small"
                      />
                    </td>
                    <td class="px-4 py-2 max-w-xs truncate">{{ invoice.taxpayerName }}</td>
                    <td class="px-4 py-2 text-right font-medium">{{ formatCurrency(invoice.totalAmount) }}</td>
                    <td class="px-4 py-2 text-right font-medium text-primary-600">{{ formatCurrency(invoice.taxAmount) }}</td>
                    <td class="px-4 py-2 text-center">
                      <Badge
                        :value="invoice.currency"
                        :severity="invoice.currency === 'USD' ? 'info' : 'success'"
                        size="small"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Helper Message -->
        <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <div class="flex items-start space-x-3">
            <Icon name="i-heroicons-information-circle" class="text-xl text-blue-600 mt-0.5" />
            <div class="text-sm text-surface-700 dark:text-surface-300">
              <p class="font-medium mb-1">Cómo usar estos datos en el formulario SAT:</p>
              <ul class="list-disc list-inside space-y-1 text-xs">
                <li><strong>Ventas:</strong> Se muestran TODAS las ventas del período</li>
                <li><strong>Compras:</strong> Se muestran solo las facturas SELECCIONADAS optimizadas para cubrir el IVA de ventas</li>
                <li>Haz clic en el ícono de portapapeles para copiar cada valor</li>
                <li>Los valores mostrados ya incluyen todas las conversiones de moneda a GTQ</li>
                <li>Las notas de crédito reducen el total, las notas de débito lo aumentan</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </template>
  </Card>
</template>

<script setup lang="ts">
import type { TaxCalculationResult, DetailedTaxSummary, InvoiceOptimizationResult, DocumentType } from '~~/server/types/tax.types'

interface Props {
  summary: TaxCalculationResult
}

const props = defineProps<Props>()

const showInvoiceList = ref(false)

const salesSummary = computed<DetailedTaxSummary>(() => props.summary.salesSummary)
const purchasesSummary = computed<DetailedTaxSummary>(() => props.summary.purchasesSummary)
const optimization = computed<InvoiceOptimizationResult | null>(() => props.summary.invoiceOptimization)

// Computed: Total de facturas SELECCIONADAS (optimizadas)
const totalSelectedPurchases = computed<number>(() => {
  if (!optimization.value || !optimization.value.selectedInvoices) return 0
  return optimization.value.selectedInvoices.reduce((total, invoice) => total + invoice.totalAmount, 0)
})

// Computed: Cantidad de facturas SELECCIONADAS
const selectedInvoicesCount = computed<number>(() => {
  if (!optimization.value || !optimization.value.selectedInvoices) return 0
  return optimization.value.selectedInvoices.length
})

// Computed: Desglose de facturas SELECCIONADAS por tipo
const selectedInvoicesByType = computed<{ regular: number; debitNotes: number; creditNotes: number }>(() => {
  if (!optimization.value || !optimization.value.selectedInvoices) {
    return { regular: 0, debitNotes: 0, creditNotes: 0 }
  }

  const breakdown = { regular: 0, debitNotes: 0, creditNotes: 0 }

  optimization.value.selectedInvoices.forEach(invoice => {
    switch (invoice.documentType) {
      case 'FACT':
      case 'OTHER':
        breakdown.regular++
        break
      case 'NDEB':
        breakdown.debitNotes++
        break
      case 'NCRE':
        breakdown.creditNotes++
        break
    }
  })

  return breakdown
})

// Computed: Totales de notas de crédito SELECCIONADAS en compras
const selectedCreditNotesTotals = computed<{ count: number; totalAmount: number; totalTax: number }>(() => {
  if (!optimization.value || !optimization.value.selectedInvoices) {
    return { count: 0, totalAmount: 0, totalTax: 0 }
  }

  const creditNotes = optimization.value.selectedInvoices.filter(inv => inv.documentType === 'NCRE')

  return {
    count: creditNotes.length,
    totalAmount: creditNotes.reduce((sum, inv) => sum + inv.totalAmount, 0),
    totalTax: creditNotes.reduce((sum, inv) => sum + inv.taxAmount, 0)
  }
})

// Computed: Totales de notas de débito SELECCIONADAS en compras
const selectedDebitNotesTotals = computed<{ count: number; totalAmount: number; totalTax: number }>(() => {
  if (!optimization.value || !optimization.value.selectedInvoices) {
    return { count: 0, totalAmount: 0, totalTax: 0 }
  }

  const debitNotes = optimization.value.selectedInvoices.filter(inv => inv.documentType === 'NDEB')

  return {
    count: debitNotes.length,
    totalAmount: debitNotes.reduce((sum, inv) => sum + inv.totalAmount, 0),
    totalTax: debitNotes.reduce((sum, inv) => sum + inv.taxAmount, 0)
  }
})

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-GT', {
    style: 'currency',
    currency: 'GTQ',
    minimumFractionDigits: 2
  }).format(amount)
}

const copyToClipboard = async (value: number | string, fieldName: string) => {
  try {
    const textValue = typeof value === 'number' ? value.toFixed(2) : value
    await navigator.clipboard.writeText(textValue)

    // Show success feedback (you can integrate with PrimeVue Toast here if available)
    console.log(`✓ ${fieldName} copiado: ${textValue}`)
  } catch (error) {
    console.error('Error al copiar:', error)
  }
}

const getDocumentTypeSeverity = (type: DocumentType): 'info' | 'warning' | 'success' | 'secondary' => {
  switch (type) {
    case 'FACT': return 'info'
    case 'NDEB': return 'warning'
    case 'NCRE': return 'success'
    default: return 'secondary'
  }
}
</script>

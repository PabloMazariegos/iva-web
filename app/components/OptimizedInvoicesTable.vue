<template>
  <Card class="hover:shadow-lg transition-shadow duration-300">
    <template #header>
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-2">
          <Icon name="i-heroicons-sparkles" class="text-xl text-purple-600" />
          <span class="font-medium">Facturas Optimizadas para Crédito Fiscal</span>
        </div>
        <Badge :value="optimization.totalSelectedInvoices" severity="secondary" size="small" />
      </div>
    </template>
    <template #content>
      <div class="space-y-6">
        <!-- Optimization Summary -->
        <div class="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 p-4 rounded-lg">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div class="text-center">
              <div class="text-2xl font-bold text-purple-600">{{ formatCurrency(optimization.targetTaxAmount) }}</div>
              <div class="text-surface-600 dark:text-surface-400">IVA Objetivo</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-blue-600">{{ formatCurrency(optimization.achievedTaxAmount) }}</div>
              <div class="text-surface-600 dark:text-surface-400">IVA Cubierto</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold" :class="coverageColorClass">{{ optimization.coveragePercentage.toFixed(1) }}%</div>
              <div class="text-surface-600 dark:text-surface-400">Cobertura</div>
            </div>
          </div>
          
          <div v-if="optimization.remainingTaxGap > 0" class="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <div class="flex items-center space-x-2">
              <Icon name="i-heroicons-exclamation-triangle" class="text-yellow-600" />
              <div class="text-sm">
                <span class="font-medium text-yellow-800 dark:text-yellow-200">Diferencia pendiente:</span>
                <span class="font-bold text-yellow-900 dark:text-yellow-100 ml-1">{{ formatCurrency(optimization.remainingTaxGap) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Document Type Distribution -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div v-for="(invoices, docType) in invoicesByDocumentType" :key="docType" :class="getDocumentTypeCardClass(docType)">
            <div class="text-center p-4">
              <div class="text-lg font-bold">{{ invoices.length }}</div>
              <div class="text-sm text-surface-600 dark:text-surface-400">{{ getDocumentTypeName(docType) }}</div>
              <div class="text-xs font-medium mt-1">
                {{ formatCurrency(invoices.reduce((sum, inv) => sum + inv.taxAmount, 0)) }}
              </div>
            </div>
          </div>
        </div>

        <!-- Invoices DataTable -->
        <div class="overflow-x-auto">
          <DataTable 
            :value="optimization.selectedInvoices" 
            :paginator="optimization.selectedInvoices.length > 10"
            :rows="10"
            :rows-per-page-options="[10, 20, 50]"
            responsive-layout="stack"
            breakpoint="768px"
            striped-rows
            :sort-field="'taxAmount'"
            :sort-order="-1"
          >
            <Column field="invoiceNumber" header="No. Factura" :sortable="true">
              <template #body="slotProps">
                <div class="flex items-center space-x-2">
                  <Badge 
                    :value="getDocumentTypeAbbrev(slotProps.data.documentType)" 
                    :severity="getDocumentTypeSeverity(slotProps.data.documentType)" 
                    size="small" 
                  />
                  <span class="font-mono text-sm">{{ slotProps.data.invoiceNumber }}</span>
                </div>
              </template>
            </Column>
            
            <Column field="taxpayerName" header="Proveedor" :sortable="true">
              <template #body="slotProps">
                <div class="max-w-32 truncate" :title="slotProps.data.taxpayerName">
                  {{ slotProps.data.taxpayerName }}
                </div>
              </template>
            </Column>
            
            <Column field="efficiencyScore" header="Puntuación" :sortable="true">
              <template #body="slotProps">
                <div class="flex items-center space-x-2">
                  <ProgressBar
                    :value="slotProps.data.efficiencyScore * 100"
                    :show-value="false"
                    class="w-12 h-2"
                    :class="getEfficiencyColorClass(slotProps.data.efficiencyScore)"
                  />
                  <span class="text-xs font-medium">{{ (slotProps.data.efficiencyScore * 100).toFixed(0) }}%</span>
                </div>
              </template>
            </Column>

            <Column field="taxRatio" header="Ratio IVA" :sortable="true">
              <template #body="slotProps">
                <Badge
                  :value="(slotProps.data.taxRatio * 100).toFixed(1) + '%'"
                  :severity="getTaxRatioSeverity(slotProps.data.taxRatio)"
                  size="small"
                />
              </template>
            </Column>

            <Column field="totalAmount" header="Monto Total" :sortable="true">
              <template #body="slotProps">
                <div class="text-right">
                  <div class="font-medium">{{ formatCurrency(slotProps.data.totalAmount) }}</div>
                  <div v-if="slotProps.data.currency === 'USD'" class="text-xs text-surface-500 dark:text-surface-400">
                    Original: ${{ (slotProps.data.totalAmount / exchangeRate).toFixed(2) }}
                  </div>
                </div>
              </template>
            </Column>
            
            <Column field="taxAmount" header="IVA" :sortable="true">
              <template #body="slotProps">
                <div class="text-right">
                  <div class="font-bold text-primary-600">{{ formatCurrency(slotProps.data.taxAmount) }}</div>
                  <div v-if="slotProps.data.currency === 'USD'" class="text-xs text-surface-500 dark:text-surface-400">
                    Original: ${{ (slotProps.data.taxAmount / exchangeRate).toFixed(2) }}
                  </div>
                </div>
              </template>
            </Column>
            
            <Column field="currency" header="Moneda" :sortable="true">
              <template #body="slotProps">
                <Badge 
                  :value="slotProps.data.currency" 
                  :severity="slotProps.data.currency === 'USD' ? 'info' : 'success'" 
                  size="small" 
                />
              </template>
            </Column>
            
            <Column header="Eficiencia">
              <template #body="slotProps">
                <div class="text-center">
                  <div class="text-sm font-medium">{{ calculateTaxRatio(slotProps.data).toFixed(5) }}%</div>
                  <div class="text-xs text-surface-500 dark:text-surface-400">IVA/Total</div>
                </div>
              </template>
            </Column>
          </DataTable>
        </div>

        <!-- Summary Statistics -->
        <div class="bg-surface-50 dark:bg-surface-800 p-4 rounded-lg">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div class="text-center">
              <div class="font-bold text-lg">{{ optimization.selectedInvoices.length }}</div>
              <div class="text-surface-600 dark:text-surface-400">Facturas Seleccionadas</div>
            </div>
            <div class="text-center">
              <div class="font-bold text-lg">{{ formatCurrency(totalSelectedAmount) }}</div>
              <div class="text-surface-600 dark:text-surface-400">Monto Total</div>
            </div>
            <div class="text-center">
              <div class="font-bold text-lg">{{ formatCurrency(averageInvoiceAmount) }}</div>
              <div class="text-surface-600 dark:text-surface-400">Promedio por Factura</div>
            </div>
            <div class="text-center">
              <div class="font-bold text-lg">{{ averageTaxRatio.toFixed(1) }}%</div>
              <div class="text-surface-600 dark:text-surface-400">Ratio IVA Promedio</div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </Card>
</template>

<script setup lang="ts">
import type { InvoiceOptimizationResult, DocumentType } from '~~/server/types/tax.types'

interface Props {
  optimization: InvoiceOptimizationResult
  exchangeRate: number
}

const props = defineProps<Props>()

const invoicesByDocumentType = computed(() => {
  const byType: Record<DocumentType, typeof props.optimization.selectedInvoices> = {
    FACT: [],
    NDEB: [],
    NCRE: [],
    OTHER: []
  }

  for (const invoice of props.optimization.selectedInvoices) {
    byType[invoice.documentType].push(invoice)
  }

  return byType
})

const coverageColorClass = computed(() => {
  const coverage = props.optimization.coveragePercentage
  if (coverage >= 95) return 'text-green-600'
  if (coverage >= 80) return 'text-yellow-600'
  return 'text-red-600'
})

const totalSelectedAmount = computed(() => 
  props.optimization.selectedInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0)
)

const averageInvoiceAmount = computed(() => 
  props.optimization.selectedInvoices.length > 0 
    ? totalSelectedAmount.value / props.optimization.selectedInvoices.length 
    : 0
)

const averageTaxRatio = computed(() => {
  if (props.optimization.selectedInvoices.length === 0) return 0
  const totalRatio = props.optimization.selectedInvoices.reduce((sum, inv) => {
    return sum + calculateTaxRatio(inv)
  }, 0)
  return totalRatio / props.optimization.selectedInvoices.length
})

const getDocumentTypeName = (docType: DocumentType): string => {
  const names = {
    FACT: 'Facturas',
    NDEB: 'Notas Débito',
    NCRE: 'Notas Crédito',
    OTHER: 'Otros'
  }
  return names[docType]
}

const getDocumentTypeAbbrev = (docType: DocumentType): string => docType

const getDocumentTypeSeverity = (docType: DocumentType) => {
  const severities = {
    FACT: 'info',
    NDEB: 'warning',
    NCRE: 'success',
    OTHER: 'secondary'
  }
  return severities[docType]
}

const getDocumentTypeCardClass = (docType: DocumentType): string => {
  const classes = {
    FACT: 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg',
    NDEB: 'bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg',
    NCRE: 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg',
    OTHER: 'bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg'
  }
  return classes[docType]
}

const calculateTaxRatio = (invoice: typeof props.optimization.selectedInvoices[0]): number => {
  if (invoice.totalAmount === 0) return 0
  const netAmount = invoice.totalAmount - invoice.taxAmount
  if (netAmount === 0) return 0
  return ((invoice.taxAmount / netAmount) * 100)
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-GT', {
    style: 'currency',
    currency: 'GTQ',
    minimumFractionDigits: 2
  }).format(amount)
}

const getEfficiencyColorClass = (score: number): string => {
  if (score >= 0.8) return 'text-green-600'
  if (score >= 0.6) return 'text-blue-600'
  if (score >= 0.4) return 'text-yellow-600'
  return 'text-red-600'
}

const getTaxRatioSeverity = (ratio: number): string => {
  const optimalRatio = 0.12
  const difference = Math.abs(ratio - optimalRatio)

  if (difference <= 0.005) return 'success'
  if (difference <= 0.01) return 'info'
  if (difference <= 0.02) return 'warn'
  return 'danger'
}
</script>
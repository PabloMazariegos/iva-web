<template>
  <div class="space-y-6">
    <div class="text-center">
      <h2 class="text-2xl font-semibold text-surface-900 dark:text-surface-0 mb-2">
        Resultados del Cálculo de IVA
      </h2>
      <p class="text-surface-600 dark:text-surface-400">
        Resumen de la declaración de IVA basada en tus archivos
      </p>
    </div>

    <!-- Loading State -->
    <div v-if="isProcessing" class="flex flex-col items-center justify-center py-12">
      <ProgressSpinner style="width: 50px; height: 50px" stroke-width="8" fill="transparent" />
      <p class="text-lg font-medium text-surface-700 dark:text-surface-300 mt-4">
        Procesando archivos...
      </p>
      <p class="text-surface-500 dark:text-surface-400">
        Esto puede tomar unos momentos
      </p>
    </div>

    <!-- Error State -->
    <Message v-else-if="error" severity="error" class="mb-6">
      <div class="flex items-start space-x-3">
        <Icon name="i-heroicons-exclamation-triangle" class="text-lg mt-0.5" />
        <div>
          <p class="font-medium mb-1">Error al procesar los archivos</p>
          <p class="text-sm">{{ error }}</p>
        </div>
      </div>
    </Message>

    <!-- Results -->
    <div v-else-if="results" class="space-y-6">
      <!-- Exchange Rate Info -->
      <Card class="mb-6 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border border-green-200 dark:border-green-800">
        <template #content>
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <Icon name="i-heroicons-currency-dollar" class="text-2xl text-green-600" />
              <div>
                <p class="text-sm text-green-600 dark:text-green-400 font-medium">Tasa de Cambio Utilizada</p>
                <p class="text-xl font-bold text-green-800 dark:text-green-200">
                  $1 USD = Q{{ results.exchangeRate.toFixed(4) }}
                </p>
              </div>
            </div>
            <div class="text-right">
              <p class="text-xs text-surface-500 dark:text-surface-400">Moneda Base</p>
              <p class="text-lg font-bold text-surface-800 dark:text-surface-200">{{ results.baseCurrency }}</p>
            </div>
          </div>
        </template>
      </Card>

      <!-- Summary Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <template #content>
            <div class="text-center">
              <Icon name="i-heroicons-arrow-trending-up" class="text-3xl text-blue-600 mb-2" />
              <p class="text-sm text-blue-600 dark:text-blue-400 font-medium mb-1">Total Ventas</p>
              <p class="text-xl font-bold text-blue-800 dark:text-blue-200">
                {{ formatCurrency(results.totalSales) }}
              </p>
            </div>
          </template>
        </Card>

        <Card class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
          <template #content>
            <div class="text-center">
              <Icon name="i-heroicons-arrow-trending-down" class="text-3xl text-green-600 mb-2" />
              <p class="text-sm text-green-600 dark:text-green-400 font-medium mb-1">Total Compras</p>
              <p class="text-xl font-bold text-green-800 dark:text-green-200">
                {{ formatCurrency(results.totalPurchases) }}
              </p>
            </div>
          </template>
        </Card>

        <Card class="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
          <template #content>
            <div class="text-center">
              <Icon name="i-heroicons-receipt-percent" class="text-3xl text-orange-600 mb-2" />
              <p class="text-sm text-orange-600 dark:text-orange-400 font-medium mb-1">IVA Ventas</p>
              <p class="text-xl font-bold text-orange-800 dark:text-orange-200">
                {{ formatCurrency(results.salesTax) }}
              </p>
            </div>
          </template>
        </Card>

        <Card class="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
          <template #content>
            <div class="text-center">
              <Icon name="tabler:receipt-tax" class="text-3xl text-purple-600 mb-2" />
              <p class="text-sm text-purple-600 dark:text-purple-400 font-medium mb-1">IVA Compras</p>
              <p class="text-xl font-bold text-purple-800 dark:text-purple-200">
                {{ formatCurrency(results.purchasesTax) }}
              </p>
            </div>
          </template>
        </Card>
      </div>

      <!-- Tax Calculation Result -->
      <Card class="border-2 border-primary-200 dark:border-primary-800">
        <template #content>
          <div class="text-center py-6">
            <h3 class="text-2xl font-bold text-surface-900 dark:text-surface-0 mb-4">
              Resultado de la Declaración
            </h3>
            
            <div v-if="statusInfo" class="space-y-3">
              <div 
                class="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 transition-all duration-300 hover:scale-110"
                :class="`bg-${statusInfo.color}-100 dark:bg-${statusInfo.color}-900/30`"
              >
                <Icon :name="statusInfo.icon" :class="`text-3xl text-${statusInfo.color}-600`" />
              </div>
              <p class="text-lg text-surface-600 dark:text-surface-400 mb-2">
                {{ statusInfo.title }}
              </p>
              <p :class="`text-4xl font-bold text-${statusInfo.color}-600 transition-all duration-300 hover:scale-105`">
                {{ formatCurrency(statusInfo.amount) }}
              </p>
              <p v-if="statusInfo.subtitle" class="text-sm text-surface-500 dark:text-surface-400">
                {{ statusInfo.subtitle }}
              </p>
            </div>
          </div>
        </template>
      </Card>

      <!-- New Detailed Document Analysis -->
      <div v-if="results.salesSummary && results.purchasesSummary" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DocumentTypeBreakdown
          :summary="results.salesSummary"
          title="Análisis Detallado de Ventas"
          :is-for-sales="true"
        />
        <DocumentTypeBreakdown
          :summary="results.purchasesSummary"
          title="Análisis Detallado de Compras"
          :is-for-sales="false"
        />
      </div>

      <!-- Invoice Optimization Results -->
      <div v-if="results.invoiceOptimization" class="mt-8">
        <OptimizedInvoicesTable
          :optimization="results.invoiceOptimization"
          :exchange-rate="results.exchangeRate"
        />
      </div>

      <!-- Enhanced Actions -->
      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        <Button 
          label="Descargar Reporte JSON"
          icon="pi pi-download"
          class="flex-1 sm:flex-none hover:scale-105 transition-transform duration-200"
          @click="$emit('download')"
        />
        <Button 
          label="Procesar Nuevos Archivos"
          icon="pi pi-refresh"
          severity="secondary"
          class="flex-1 sm:flex-none hover:scale-105 transition-transform duration-200"
          @click="$emit('reset')"
        />
      </div>
    </div>

    <!-- No Results State -->
    <div v-else class="text-center py-12">
      <Icon name="i-heroicons-document-magnifying-glass" class="text-6xl text-surface-400 mb-4" />
      <p class="text-xl font-medium text-surface-700 dark:text-surface-300 mb-2">
        Listos para procesar
      </p>
      <p class="text-surface-500 dark:text-surface-400">
        Los resultados del cálculo aparecerán aquí una vez procesados los archivos
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TaxCalculationResult } from '~~/server/types/tax.types'
import DocumentTypeBreakdown from './DocumentTypeBreakdown.vue'
import OptimizedInvoicesTable from './OptimizedInvoicesTable.vue'

interface Props {
  results: TaxCalculationResult | null
  isProcessing: boolean
  error: string | null
}

type Emits = {
  download: []
  reset: []
}

const props = defineProps<Props>()
defineEmits<Emits>()

const statusInfo = computed(() => {
  if (!props.results) return null
  
  const hasPayable = props.results.taxPayable > 0
  return {
    type: hasPayable ? 'payable' : 'credit',
    icon: hasPayable ? 'i-heroicons-banknotes' : 'i-heroicons-arrow-uturn-left',
    color: hasPayable ? 'red' : 'green',
    title: hasPayable ? 'IVA a Pagar' : 'Crédito Fiscal',
    amount: hasPayable ? props.results.taxPayable : props.results.taxCredit,
    subtitle: hasPayable ? 'Debes pagar este monto a la SAT' : 'No hay IVA por pagar este período'
  }
})

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-GT', {
    style: 'currency',
    currency: 'GTQ',
    minimumFractionDigits: 2
  }).format(amount)
}
</script>
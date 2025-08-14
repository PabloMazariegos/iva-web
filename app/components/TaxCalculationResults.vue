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
              <Icon name="i-heroicons-receipt-tax" class="text-3xl text-purple-600 mb-2" />
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

      <!-- Enhanced Detailed Breakdown -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Tax Calculation Breakdown -->
        <Card class="hover:shadow-lg transition-shadow duration-300">
          <template #header>
            <div class="flex items-center space-x-2">
              <Icon name="i-heroicons-calculator" class="text-xl" />
              <span class="font-medium">Desglose del Cálculo</span>
            </div>
          </template>
          <template #content>
            <div class="space-y-6">
              <!-- Sales Breakdown -->
              <div class="space-y-3">
                <h4 class="font-medium text-blue-800 dark:text-blue-200 mb-3 flex items-center space-x-2">
                  <Icon name="i-heroicons-arrow-trending-up" class="text-blue-600" />
                  <span>Ventas</span>
                </h4>
                <div class="space-y-2 text-sm bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                  <div class="flex justify-between">
                    <span class="text-surface-600 dark:text-surface-400">Subtotal (sin IVA):</span>
                    <span class="font-medium">{{ formatCurrency(taxSummary?.netSales || 0) }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-surface-600 dark:text-surface-400">IVA (12%):</span>
                    <span class="font-medium text-blue-600">{{ formatCurrency(results.salesTax) }}</span>
                  </div>
                  <div class="flex justify-between border-t border-blue-200 dark:border-blue-800 pt-2">
                    <span class="font-medium">Total:</span>
                    <span class="font-bold text-blue-800 dark:text-blue-200">{{ formatCurrency(results.totalSales) }}</span>
                  </div>
                </div>
              </div>

              <!-- Purchases Breakdown -->
              <div class="space-y-3">
                <h4 class="font-medium text-green-800 dark:text-green-200 mb-3 flex items-center space-x-2">
                  <Icon name="i-heroicons-arrow-trending-down" class="text-green-600" />
                  <span>Compras</span>
                </h4>
                <div class="space-y-2 text-sm bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                  <div class="flex justify-between">
                    <span class="text-surface-600 dark:text-surface-400">Subtotal (sin IVA):</span>
                    <span class="font-medium">{{ formatCurrency(taxSummary?.netPurchases || 0) }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-surface-600 dark:text-surface-400">IVA (12%):</span>
                    <span class="font-medium text-green-600">{{ formatCurrency(results.purchasesTax) }}</span>
                  </div>
                  <div class="flex justify-between border-t border-green-200 dark:border-green-800 pt-2">
                    <span class="font-medium">Total:</span>
                    <span class="font-bold text-green-800 dark:text-green-200">{{ formatCurrency(results.totalPurchases) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </Card>

        <!-- Tax Analytics -->
        <Card class="hover:shadow-lg transition-shadow duration-300">
          <template #header>
            <div class="flex items-center space-x-2">
              <Icon name="i-heroicons-chart-bar" class="text-xl" />
              <span class="font-medium">Análisis Fiscal</span>
            </div>
          </template>
          <template #content>
            <div class="space-y-4">
              <div class="bg-surface-50 dark:bg-surface-800 p-4 rounded-lg">
                <div class="flex justify-between items-center mb-2">
                  <span class="text-sm text-surface-600 dark:text-surface-400">Tasa efectiva de IVA:</span>
                  <span class="font-bold text-orange-600">{{ taxSummary?.effectiveTaxRate.toFixed(2) }}%</span>
                </div>
                <div class="flex justify-between items-center mb-2">
                  <span class="text-sm text-surface-600 dark:text-surface-400">Utilización de crédito:</span>
                  <span class="font-bold text-purple-600">{{ taxSummary?.creditUtilization.toFixed(1) }}%</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-sm text-surface-600 dark:text-surface-400">Ratio ventas/compras:</span>
                  <span class="font-bold text-blue-600">{{ (results.totalSales / results.totalPurchases).toFixed(2) }}</span>
                </div>
              </div>
              
              <div class="text-xs text-surface-500 dark:text-surface-400 space-y-1">
                <p><strong>Nota:</strong> La tasa efectiva de IVA se calcula sobre el subtotal sin IVA.</p>
                <p>La utilización de crédito muestra qué porcentaje del IVA de compras se puede usar como crédito fiscal.</p>
              </div>
            </div>
          </template>
        </Card>
      </div>

      <!-- Data Summary -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <template #header>
            <div class="flex items-center space-x-2">
              <Icon name="i-heroicons-document-arrow-up" class="text-xl text-blue-600" />
              <span class="font-medium">Datos de Ventas</span>
            </div>
          </template>
          <template #content>
            <div class="space-y-3">
              <div class="flex justify-between items-center">
                <span class="text-surface-600 dark:text-surface-400">Total de facturas:</span>
                <span class="font-medium">{{ results.salesData.length }}</span>
              </div>
              <div class="text-xs text-surface-500 dark:text-surface-400">
                Columnas detectadas:
                <ul class="list-disc list-inside mt-1 space-y-1">
                  <li v-for="[key, column] in filteredSalesColumns" :key="key">
                    {{ key }}: {{ column }}
                  </li>
                </ul>
              </div>
            </div>
          </template>
        </Card>

        <Card>
          <template #header>
            <div class="flex items-center space-x-2">
              <Icon name="i-heroicons-shopping-cart" class="text-xl text-green-600" />
              <span class="font-medium">Datos de Compras</span>
            </div>
          </template>
          <template #content>
            <div class="space-y-3">
              <div class="flex justify-between items-center">
                <span class="text-surface-600 dark:text-surface-400">Total de facturas:</span>
                <span class="font-medium">{{ results.purchasesData.length }}</span>
              </div>
              <div class="text-xs text-surface-500 dark:text-surface-400">
                Columnas detectadas:
                <ul class="list-disc list-inside mt-1 space-y-1">
                  <li v-for="[key, column] in filteredPurchasesColumns" :key="key">
                    {{ key }}: {{ column }}
                  </li>
                </ul>
              </div>
            </div>
          </template>
        </Card>
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
import type { TaxCalculationResult } from '~/composables/useTaxFileProcessor'

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

// Computed properties to fix v-for with v-if linting issues
const filteredSalesColumns = computed(() => {
  if (!props.results?.detectedColumns.sales) return []
  return Object.entries(props.results.detectedColumns.sales).filter(([_, column]) => column)
})

const filteredPurchasesColumns = computed(() => {
  if (!props.results?.detectedColumns.purchases) return []
  return Object.entries(props.results.detectedColumns.purchases).filter(([_, column]) => column)
})

// Enhanced computed properties for better visualization
const taxSummary = computed(() => {
  if (!props.results) return null
  
  return {
    netSales: props.results.totalSales / 1.12,
    netPurchases: props.results.totalPurchases / 1.12,
    effectiveTaxRate: (props.results.salesTax / (props.results.totalSales / 1.12)) * 100,
    creditUtilization: props.results.purchasesTax > 0 
      ? (Math.min(props.results.purchasesTax, props.results.salesTax) / props.results.purchasesTax) * 100 
      : 0
  }
})

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
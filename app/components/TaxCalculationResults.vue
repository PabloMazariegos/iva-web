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
            
            <div v-if="results.taxPayable > 0" class="space-y-3">
              <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
                <Icon name="i-heroicons-banknotes" class="text-3xl text-red-600" />
              </div>
              <p class="text-lg text-surface-600 dark:text-surface-400 mb-2">
                IVA a Pagar
              </p>
              <p class="text-4xl font-bold text-red-600">
                {{ formatCurrency(results.taxPayable) }}
              </p>
            </div>

            <div v-else class="space-y-3">
              <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
                <Icon name="i-heroicons-arrow-uturn-left" class="text-3xl text-green-600" />
              </div>
              <p class="text-lg text-surface-600 dark:text-surface-400 mb-2">
                Crédito Fiscal
              </p>
              <p class="text-4xl font-bold text-green-600">
                {{ formatCurrency(results.taxCredit) }}
              </p>
              <p class="text-sm text-surface-500 dark:text-surface-400">
                No hay IVA por pagar este período
              </p>
            </div>
          </div>
        </template>
      </Card>

      <!-- Detailed Breakdown -->
      <Card>
        <template #header>
          <div class="flex items-center space-x-2">
            <Icon name="i-heroicons-calculator" class="text-xl" />
            <span class="font-medium">Desglose del Cálculo</span>
          </div>
        </template>
        <template #content>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-3">
              <h4 class="font-medium text-surface-900 dark:text-surface-0 mb-3">Ventas</h4>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-surface-600 dark:text-surface-400">Subtotal:</span>
                  <span class="font-medium">{{ formatCurrency(results.totalSales / 1.12) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-surface-600 dark:text-surface-400">IVA (12%):</span>
                  <span class="font-medium">{{ formatCurrency(results.salesTax) }}</span>
                </div>
                <div class="flex justify-between border-t border-surface-200 dark:border-surface-700 pt-2">
                  <span class="font-medium">Total:</span>
                  <span class="font-bold">{{ formatCurrency(results.totalSales) }}</span>
                </div>
              </div>
            </div>

            <div class="space-y-3">
              <h4 class="font-medium text-surface-900 dark:text-surface-0 mb-3">Compras</h4>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-surface-600 dark:text-surface-400">Subtotal:</span>
                  <span class="font-medium">{{ formatCurrency(results.totalPurchases / 1.12) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-surface-600 dark:text-surface-400">IVA (12%):</span>
                  <span class="font-medium">{{ formatCurrency(results.purchasesTax) }}</span>
                </div>
                <div class="flex justify-between border-t border-surface-200 dark:border-surface-700 pt-2">
                  <span class="font-medium">Total:</span>
                  <span class="font-bold">{{ formatCurrency(results.totalPurchases) }}</span>
                </div>
              </div>
            </div>
          </div>
        </template>
      </Card>

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

      <!-- Actions -->
      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        <Button 
          label="Descargar Reporte"
          icon="pi pi-download"
          class="flex-1 sm:flex-none"
          @click="$emit('download')"
        />
        <Button 
          label="Procesar Nuevos Archivos"
          icon="pi pi-refresh"
          severity="secondary"
          class="flex-1 sm:flex-none"
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


const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-GT', {
    style: 'currency',
    currency: 'GTQ',
    minimumFractionDigits: 2
  }).format(amount)
}
</script>
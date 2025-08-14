<template>
  <div class="max-w-6xl mx-auto p-6">
    <!-- Header -->
    <div class="text-center mb-8">
      <h1 class="text-3xl font-bold text-surface-900 dark:text-surface-0 mb-2">
        Calculadora de IVA
      </h1>
      <p class="text-surface-600 dark:text-surface-400">
        Arrastra tus archivos Excel para calcular el IVA automáticamente
      </p>
    </div>

    <!-- Exchange Rate Configuration -->
    <div v-if="!processor.state.value.results" class="bg-surface-50 dark:bg-surface-800 rounded-xl p-6 mb-8">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center space-x-2">
          <Icon name="i-heroicons-currency-dollar" class="text-xl text-green-600" />
          <h3 class="text-lg font-semibold text-surface-900 dark:text-surface-0">
            Configuración de Moneda
          </h3>
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="space-y-2">
          <label for="exchangeRate" class="block text-sm font-medium text-surface-700 dark:text-surface-300">
            Tasa de Cambio (USD a GTQ)
          </label>
          <InputNumber
            id="exchangeRate"
            v-model="exchangeRate"
            mode="decimal"
            :min="1"
            :max="15"
            :min-fraction-digits="2"
            :max-fraction-digits="4"
            placeholder="7.7500"
            class="w-full"
            :class="{ 'p-invalid': exchangeRateError }"
          />
          <small v-if="exchangeRateError" class="text-red-500">{{ exchangeRateError }}</small>
          <small v-else class="text-surface-500 dark:text-surface-400">
            Conversión: $1 USD = Q{{ exchangeRate?.toFixed(4) || '0.0000' }}
          </small>
        </div>
        <div class="flex items-center space-x-4 bg-surface-100 dark:bg-surface-700 rounded-lg p-4">
          <div class="text-center">
            <div class="text-2xl font-bold text-blue-600">USD</div>
            <div class="text-xs text-surface-600 dark:text-surface-400">Dólares</div>
          </div>
          <Icon name="i-heroicons-arrow-right" class="text-surface-400" />
          <div class="text-center">
            <div class="text-2xl font-bold text-green-600">GTQ</div>
            <div class="text-xs text-surface-600 dark:text-surface-400">Quetzales</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Upload Area -->
    <div v-if="!processor.state.value.results" class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
      <!-- Sales Upload Zone -->
      <FileDragZone
        ref="salesDragZone"
        title="Archivo de Ventas"
        description="Arrastra aquí tu archivo Excel de ventas"
        icon="i-heroicons-document-arrow-up"
        color="blue"
        :file="processor.state.value.salesFile"
        :dragover="salesDragover"
        file-description="Archivo de ventas listo"
        @file-selected="handleSalesFileSelected"
        @file-removed="handleSalesFileRemoved"
        @dragover="salesDragover = true"
        @dragleave="salesDragover = false"
        @drop="handleSalesDrop"
      />

      <!-- Purchases Upload Zone -->
      <FileDragZone
        ref="purchasesDragZone"
        title="Archivo de Compras"
        description="Arrastra aquí tu archivo Excel de compras"
        icon="i-heroicons-shopping-cart"
        color="purple"
        :file="processor.state.value.purchasesFile"
        :dragover="purchasesDragover"
        file-description="Archivo de compras listo"
        @file-selected="handlePurchasesFileSelected"
        @file-removed="handlePurchasesFileRemoved"
        @dragover="purchasesDragover = true"
        @dragleave="purchasesDragover = false"
        @drop="handlePurchasesDrop"
      />
    </div>

    <!-- Process Button -->
    <div v-if="!processor.state.value.results && (processor.state.value.salesFile || processor.state.value.purchasesFile)" class="text-center mb-8">
      <Button 
        :label="processor.state.value.isProcessing ? 'Procesando...' : 'Calcular IVA'"
        :icon="processor.state.value.isProcessing ? 'pi pi-spin pi-spinner' : 'pi pi-calculator'"
        size="large"
        :disabled="!processor.canProcess.value"
        :loading="processor.state.value.isProcessing"
        class="px-8 py-3 text-lg"
        @click="processFiles"
      />
      
      <!-- Error Message -->
      <div v-if="processor.state.value.error" class="mt-4">
        <Message severity="error" @close="processor.clearError">
          {{ processor.state.value.error }}
        </Message>
      </div>
    </div>

    <!-- Results -->
    <div v-if="processor.state.value.results" class="space-y-6">
      <TaxCalculationResults
        :results="processor.state.value.results"
        :is-processing="processor.state.value.isProcessing"
        :error="processor.state.value.error"
        @download="processor.downloadResults"
        @reset="resetCalculator"
      />
    </div>

    <!-- Toast for notifications -->
    <Toast />
  </div>
</template>

<script setup lang="ts">
import { useToast } from 'primevue/usetoast'

const toast = useToast()
const processor = useTaxFileProcessor()

// Drag states
const salesDragover = ref(false)
const purchasesDragover = ref(false)

// Exchange rate management
const exchangeRate = ref(7.75) // Default USD to GTQ rate
const exchangeRateError = ref('')

// Validate exchange rate
const validateExchangeRate = () => {
  if (!exchangeRate.value || exchangeRate.value <= 0) {
    exchangeRateError.value = 'La tasa de cambio debe ser mayor a 0'
    return false
  }
  if (exchangeRate.value < 1 || exchangeRate.value > 15) {
    exchangeRateError.value = 'La tasa de cambio debe estar entre 1 y 15'
    return false
  }
  exchangeRateError.value = ''
  return true
}

// Component refs
const salesDragZone = ref()
const purchasesDragZone = ref()

// File handlers
const handleSalesFileSelected = (file: File) => {
  processor.setSalesFile(file)
}

const handleSalesFileRemoved = () => {
  processor.setSalesFile(null)
}

const handlePurchasesFileSelected = (file: File) => {
  processor.setPurchasesFile(file)
}

const handlePurchasesFileRemoved = () => {
  processor.setPurchasesFile(null)
}

// Drop handlers
const handleSalesDrop = () => {
  salesDragover.value = false
}

const handlePurchasesDrop = () => {
  purchasesDragover.value = false
}

const processFiles = async () => {
  if (!validateExchangeRate()) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Por favor corrige la tasa de cambio antes de continuar',
      life: 5000
    })
    return
  }

  const success = await processor.processFiles(exchangeRate.value)
  if (success) {
    toast.add({
      severity: 'success',
      summary: 'Éxito',
      detail: 'Archivos procesados correctamente',
      life: 3000
    })
  }
}

const resetCalculator = () => {
  processor.resetState()
  // Clear file inputs
  salesDragZone.value?.clearInput()
  purchasesDragZone.value?.clearInput()
}

// Watch for errors
watch(() => processor.state.value.error, (error) => {
  if (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error,
      life: 5000
    })
  }
})
</script>

<style scoped>
/* Drag & drop styles */
</style>
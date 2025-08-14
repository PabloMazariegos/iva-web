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

// Component refs
const salesDragZone = ref()
const purchasesDragZone = ref()

// File handlers
const handleSalesFileSelected = (file: File) => {
  processor.setSalesFile(file)
  checkAndAutoProcess()
}

const handleSalesFileRemoved = () => {
  processor.setSalesFile(null)
}

const handlePurchasesFileSelected = (file: File) => {
  processor.setPurchasesFile(file)
  checkAndAutoProcess()
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

// Auto-process when both files are ready
const checkAndAutoProcess = () => {
  // Small delay to allow UI to update
  nextTick(() => {
    if (processor.canProcess.value && !processor.state.value.isProcessing) {
      // Auto-process after 1 second
      setTimeout(() => {
        if (processor.canProcess.value && !processor.state.value.isProcessing) {
          processFiles()
        }
      }, 1000)
    }
  })
}

const processFiles = async () => {
  const success = await processor.processFiles()
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
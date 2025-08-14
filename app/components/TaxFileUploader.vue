<template>
  <div class="max-w-4xl mx-auto p-6">
    <div class="text-center mb-8">
      <h1 class="text-3xl font-bold text-surface-900 dark:text-surface-0 mb-2">
        Calculadora de IVA
      </h1>
      <p class="text-surface-600 dark:text-surface-400">
        Sube tus archivos Excel de ventas y compras para calcular el IVA automáticamente
      </p>
    </div>

    <Stepper 
      v-model:value="currentStep" 
      linear
      class="w-full"
    >
      <StepList class="mb-8">
        <Step value="1">
          <div class="flex flex-col items-center gap-2 p-4 rounded-lg transition-all duration-200">
            <Icon name="i-heroicons-document-arrow-up" class="text-2xl" />
            <span class="font-medium">Archivo de Ventas</span>
          </div>
        </Step>
        
        <Step value="2">
          <div class="flex flex-col items-center gap-2 p-4 rounded-lg transition-all duration-200">
            <Icon name="i-heroicons-shopping-cart" class="text-2xl" />
            <span class="font-medium">Archivo de Compras</span>
          </div>
        </Step>
        
        <Step value="3">
          <div class="flex flex-col items-center gap-2 p-4 rounded-lg transition-all duration-200">
            <Icon name="i-heroicons-calculator" class="text-2xl" />
            <span class="font-medium">Resultados</span>
          </div>
        </Step>
      </StepList>

      <StepPanels>
        <StepPanel value="1">
          <SalesFileUpload
            :file="processor.state.value.salesFile"
            :is-processing="processor.state.value.isProcessing"
            @file-selected="onSalesFileSelected"
            @file-removed="onSalesFileRemoved"
          />
          
          <div class="flex justify-end mt-6">
            <Button 
              :disabled="!processor.state.value.salesFile"
              label="Siguiente"
              icon="pi pi-arrow-right"
              icon-pos="right"
              @click="goToStep('2')"
            />
          </div>
        </StepPanel>

        <StepPanel value="2">
          <PurchasesFileUpload
            :file="processor.state.value.purchasesFile"
            :is-processing="processor.state.value.isProcessing"
            @file-selected="onPurchasesFileSelected"
            @file-removed="onPurchasesFileRemoved"
          />
          
          <div class="flex justify-between mt-6">
            <Button 
              label="Anterior"
              icon="pi pi-arrow-left"
              severity="secondary"
              @click="goToStep('1')"
            />
            <Button 
              :disabled="!processor.canProcess.value"
              label="Procesar Archivos"
              icon="pi pi-cog"
              icon-pos="right"
              :loading="processor.state.value.isProcessing"
              @click="proceedToResults"
            />
          </div>
        </StepPanel>

        <StepPanel value="3">
          <TaxCalculationResults
            :results="processor.state.value.results"
            :is-processing="processor.state.value.isProcessing"
            :error="processor.state.value.error"
            @download="processor.downloadResults"
            @reset="resetAndGoToStart"
          />
          
          <div class="flex justify-between mt-6">
            <Button 
              label="Volver a Archivos"
              icon="pi pi-arrow-left"
              severity="secondary"
              @click="goToStep('2')"
            />
            <Button 
              label="Empezar de Nuevo"
              icon="pi pi-refresh"
              severity="secondary"
              @click="resetAndGoToStart"
            />
          </div>
        </StepPanel>
      </StepPanels>
    </Stepper>

    <!-- Error Toast -->
    <Toast />
  </div>
</template>

<script setup lang="ts">
import { useToast } from 'primevue/usetoast'

const toast = useToast()
const processor = useTaxFileProcessor()
const currentStep = ref('1')

const canNavigateToStep = (step: string) => {
  switch (step) {
    case '1':
      return true
    case '2':
      return !!processor.state.value.salesFile
    case '3':
      return processor.canProcess.value || !!processor.state.value.results
    default:
      return false
  }
}

const goToStep = (step: string) => {
  if (canNavigateToStep(step)) {
    currentStep.value = step
  }
}

const onSalesFileSelected = (file: File) => {
  processor.setSalesFile(file)
}

const onSalesFileRemoved = () => {
  processor.setSalesFile(null)
}

const onPurchasesFileSelected = (file: File) => {
  processor.setPurchasesFile(file)
}

const onPurchasesFileRemoved = () => {
  processor.setPurchasesFile(null)
}

const proceedToResults = async () => {
  const success = await processor.processFiles()
  if (success) {
    currentStep.value = '3'
  }
}

const resetAndGoToStart = () => {
  processor.resetState()
  currentStep.value = '1'
}

watch(() => processor.state.value.error, (error) => {
  if (error) {
    toast.add({
      severity: 'error',
      summary: 'Error de Procesamiento',
      detail: error,
      life: 5000
    })
  }
})
</script>

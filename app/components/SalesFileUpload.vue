<template>
  <div class="space-y-6">
    <div class="text-center">
      <h2 class="text-2xl font-semibold text-surface-900 dark:text-surface-0 mb-2">
        Archivo de Ventas
      </h2>
      <p class="text-surface-600 dark:text-surface-400">
        Sube tu archivo Excel con las facturas de ventas del período
      </p>
    </div>

    <Card class="w-full">
      <template #content>
        <div v-if="!file" class="space-y-4">
          <FileUpload
            mode="basic"
            :custom-upload="true"
            accept=".xlsx,.xls"
            :max-file-size="10000000"
            :auto="true"
            choose-label="Seleccionar Archivo de Ventas"
            class="w-full"
            @select="onFileSelect"
          >
            <template #empty>
              <div class="flex flex-col items-center justify-center py-12">
                <Icon name="i-heroicons-document-arrow-up" class="text-6xl text-surface-400 mb-4" />
                <p class="text-xl font-medium text-surface-700 dark:text-surface-300 mb-2">
                  Arrastra tu archivo aquí
                </p>
                <p class="text-surface-500 dark:text-surface-400 mb-4">
                  o haz clic para seleccionar
                </p>
                <p class="text-sm text-surface-400 dark:text-surface-500">
                  Formatos soportados: .xlsx, .xls (máximo 10MB)
                </p>
              </div>
            </template>
          </FileUpload>
        </div>

        <div v-else class="space-y-4">
          <div class="flex items-center justify-between p-4 border border-surface-200 dark:border-surface-700 rounded-lg bg-green-50 dark:bg-green-900/20">
            <div class="flex items-center space-x-3">
              <Icon name="i-heroicons-document-check" class="text-2xl text-green-600" />
              <div>
                <p class="font-medium text-surface-900 dark:text-surface-0">{{ file.name }}</p>
                <p class="text-sm text-surface-600 dark:text-surface-400">{{ formatFileSize(file.size) }}</p>
              </div>
            </div>
            <Button
              icon="pi pi-times"
              severity="danger"
              text
              rounded
              :disabled="isProcessing"
              aria-label="Eliminar archivo"
              @click="removeFile"
            />
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div class="text-center">
              <Icon name="i-heroicons-calendar" class="text-lg text-surface-600 mb-1" />
              <p class="text-surface-500 dark:text-surface-400">Facturas de ventas</p>
            </div>
            <div class="text-center">
              <Icon name="i-heroicons-document-text" class="text-lg text-surface-600 mb-1" />
              <p class="text-surface-500 dark:text-surface-400">Formato Excel</p>
            </div>
            <div class="text-center">
              <Icon name="i-heroicons-shield-check" class="text-lg text-surface-600 mb-1" />
              <p class="text-surface-500 dark:text-surface-400">Archivo validado</p>
            </div>
          </div>

          <Message v-if="fileInfo" severity="info" class="mt-4">
            <div class="space-y-2">
              <p class="font-medium">Información del archivo:</p>
              <ul class="list-disc list-inside space-y-1 text-sm">
                <li>Formato: {{ getFileExtension(file.name).toUpperCase() }}</li>
                <li>Tamaño: {{ formatFileSize(file.size) }}</li>
                <li>Última modificación: {{ formatDate(file.lastModified) }}</li>
              </ul>
            </div>
          </Message>
        </div>
      </template>
    </Card>

    <div v-if="file" class="bg-surface-50 dark:bg-surface-900 p-4 rounded-lg">
      <h3 class="font-medium text-surface-900 dark:text-surface-0 mb-3">
        Columnas esperadas en el archivo:
      </h3>
      <div class="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
        <div class="flex items-center space-x-2">
          <Icon name="i-heroicons-calendar" class="text-surface-600" />
          <span>Fecha</span>
        </div>
        <div class="flex items-center space-x-2">
          <Icon name="i-heroicons-identification" class="text-surface-600" />
          <span>NIT Cliente</span>
        </div>
        <div class="flex items-center space-x-2">
          <Icon name="i-heroicons-user" class="text-surface-600" />
          <span>Nombre Cliente</span>
        </div>
        <div class="flex items-center space-x-2">
          <Icon name="i-heroicons-currency-dollar" class="text-surface-600" />
          <span>Total</span>
        </div>
        <div class="flex items-center space-x-2">
          <Icon name="i-heroicons-receipt-percent" class="text-surface-600" />
          <span>IVA</span>
        </div>
        <div class="flex items-center space-x-2">
          <Icon name="i-heroicons-document" class="text-surface-600" />
          <span>No. Factura</span>
        </div>
      </div>
      <p class="text-xs text-surface-500 dark:text-surface-400 mt-3">
        * El sistema detectará automáticamente las columnas aunque tengan nombres diferentes
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  file: File | null
  isProcessing: boolean
}>()

const emit = defineEmits<{
  'file-selected': [file: File]
  'file-removed': []
}>()

const fileInfo = ref(false)

const onFileSelect = (event: { files: File[] }) => {
  const selectedFile = event.files[0]
  if (selectedFile) {
    emit('file-selected', selectedFile)
    fileInfo.value = true
  }
}

const removeFile = () => {
  emit('file-removed')
  fileInfo.value = false
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const getFileExtension = (fileName: string): string => {
  return fileName.split('.').pop() || ''
}

const formatDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleDateString('es-GT', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>
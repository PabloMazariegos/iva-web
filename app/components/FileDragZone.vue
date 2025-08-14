<template>
  <div 
    class="relative border-2 border-dashed border-surface-300 dark:border-surface-600 rounded-xl p-8 transition-all duration-300"
    :class="[
      `hover:border-${color}-400 dark:hover:border-${color}-500`,
      {
        [`border-${color}-400 dark:border-${color}-500 bg-${color}-50/50 dark:bg-${color}-900/10 scale-[1.02]`]: dragover,
        'border-green-400 dark:border-green-500 bg-green-50 dark:bg-green-900/20': file
      }
    ]"
    @dragover.prevent="$emit('dragover')"
    @dragleave.prevent="$emit('dragleave')"
    @drop.prevent="handleDrop"
  >
    <div v-if="!file" class="text-center">
      <div class="mb-4">
        <Icon 
          :name="icon" 
          :class="[
            `text-6xl text-${color}-500 mb-4 transition-transform duration-300`,
            { 'animate-bounce': dragover }
          ]"
        />
      </div>
      <h3 class="text-xl font-semibold text-surface-900 dark:text-surface-0 mb-2">
        {{ title }}
      </h3>
      <p class="text-surface-600 dark:text-surface-400 mb-4">
        {{ description }}
      </p>
      <Button 
        label="Seleccionar archivo"
        icon="pi pi-plus"
        severity="secondary"
        @click="() => fileInput?.click()"
      />
      <input 
        ref="fileInput"
        type="file" 
        accept=".xlsx,.xls"
        class="hidden"
        @change="handleFileSelect"
      >
    </div>
    
    <!-- File Selected -->
    <div v-else class="flex items-center justify-between">
      <div class="flex items-center space-x-3">
        <Icon name="i-heroicons-check-circle" class="text-2xl text-green-600" />
        <div>
          <p class="font-medium text-surface-900 dark:text-surface-0">{{ file.name }}</p>
          <p class="text-sm text-surface-600 dark:text-surface-400">{{ fileDescription }}</p>
        </div>
      </div>
      <Button
        icon="pi pi-times"
        severity="danger"
        text
        rounded
        @click="$emit('file-removed')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title: string
  description: string
  icon: string
  color: string
  file: File | null
  dragover: boolean
  fileDescription?: string
}

interface Emits {
  'file-selected': [file: File]
  'file-removed': []
  'dragover': []
  'dragleave': []
  'drop': [event: DragEvent]
}

withDefaults(defineProps<Props>(), {
  fileDescription: 'Archivo listo'
})

const emit = defineEmits<Emits>()

const fileInput = ref<HTMLInputElement>()

const handleDrop = (event: DragEvent) => {
  const files = event.dataTransfer?.files
  if (files && files.length > 0) {
    emit('file-selected', files[0])
  }
  emit('drop', event)
}

const handleFileSelect = (event: Event) => {
  const input = event.target as HTMLInputElement
  if (input.files && input.files.length > 0) {
    emit('file-selected', input.files[0])
  }
}

// Expose the file input for external clearing
defineExpose({
  clearInput: () => {
    if (fileInput.value) fileInput.value.value = ''
  }
})
</script>
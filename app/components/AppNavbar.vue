<template>
  <nav class="bg-surface-0 dark:bg-surface-900 border-b border-surface-200 dark:border-surface-700 px-4 py-3">
    <div class="container mx-auto flex items-center justify-between">
      <!-- Logo -->
      <div class="flex items-center space-x-3">
        <h1 class="text-xl font-bold text-surface-900 dark:text-surface-0">
          IVA WEB
        </h1>
      </div>

      <!-- Theme Toggle -->
      <div class="flex items-center space-x-3">
        <span class="text-surface-600 dark:text-surface-300 flex items-center">
          <Icon v-if="isDarkMode" name="material-symbols:dark-mode" />
          <Icon v-else name="material-symbols:light-mode" />
        </span>
        <ToggleSwitch 
          v-model="isDarkMode" 
          class="theme-toggle"
          @change="toggleTheme"
        />
      </div>
    </div>
  </nav>
</template>

<script setup>
const isDarkMode = ref(false)

const initializeTheme = () => {
  if (import.meta.client) {
    const saved = localStorage.getItem('theme')
    isDarkMode.value = saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)
  }
}

const toggleTheme = () => {
  document.documentElement.classList.toggle('pm-dark', isDarkMode.value)
  
  if (import.meta.client) {
    localStorage.setItem('theme', isDarkMode.value ? 'dark' : 'light')
  }
}

onMounted(() => {
  initializeTheme()
  toggleTheme()
})

watch(isDarkMode, () => {
  toggleTheme()
})
</script>

<style scoped>
.theme-toggle {
  transition: all 0.3s ease;
}
</style>

<template>
  <div id="app">
    <UserHeader />
    <main class="app-main">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { provide } from 'vue';
import { useAuthStore } from './stores/auth';
import { UserHeader } from '@boqq/ui';

const authStore = useAuthStore();
provide('authStore', authStore);
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background: #f5f5f5;
}

#app {
  min-height: 100vh;
  background: #f5f5f5;
  --app-content-max-width: 1200px;
  --app-content-padding-x: 1.5rem;
}

.app-main {
  max-width: var(--app-content-max-width);
  margin: 0 auto;
  padding-left: var(--app-content-padding-x);
  padding-right: var(--app-content-padding-x);
  width: 100%;
  box-sizing: border-box;
}

@media (max-width: 768px) {
  #app {
    --app-content-padding-x: 1rem;
  }
}
</style>

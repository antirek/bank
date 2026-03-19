<template>
  <div id="app">
    <UserHeader />
    <router-view />
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
}

#app {
  min-height: 100vh;
}
</style>

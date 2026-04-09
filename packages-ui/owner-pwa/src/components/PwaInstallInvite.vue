<template>
  <div v-if="showAndroidBar" class="pwa-install" role="region" aria-label="Установка приложения">
    <span class="pwa-install__text">Установить Boqq на экран «Домой»?</span>
    <button type="button" class="pwa-install__btn pwa-install__btn--primary" @click="onInstall">
      Установить
    </button>
    <button type="button" class="pwa-install__btn" @click="dismissAndroid">Не сейчас</button>
  </div>
  <div v-else-if="showIosHint" class="pwa-install pwa-install--ios" role="region">
    <button type="button" class="pwa-install__close" aria-label="Закрыть" @click="dismissIos">×</button>
    <p class="pwa-install__text">
      Чтобы добавить на экран «Домой»: нажмите
      <strong>Поделиться</strong>
      и выберите
      <strong>На экран «Домой»</strong>.
    </p>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const DISMISS_ANDROID = 'boqq_pwa_install_dismissed';
const DISMISS_IOS = 'boqq_pwa_ios_hint_dismissed';

const showAndroidBar = ref(false);
const showIosHint = ref(false);
let deferredPrompt = null;

function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );
}

function isIos() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function onBeforeInstallPrompt(e) {
  e.preventDefault();
  if (localStorage.getItem(DISMISS_ANDROID) === '1') return;
  deferredPrompt = e;
  showAndroidBar.value = true;
}

async function onInstall() {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice.catch(() => {});
  deferredPrompt = null;
  showAndroidBar.value = false;
}

function dismissAndroid() {
  showAndroidBar.value = false;
  localStorage.setItem(DISMISS_ANDROID, '1');
}

function dismissIos() {
  showIosHint.value = false;
  localStorage.setItem(DISMISS_IOS, '1');
}

onMounted(() => {
  if (isStandalone()) return;

  window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);

  if (
    isIos() &&
    localStorage.getItem(DISMISS_IOS) !== '1' &&
    !isStandalone()
  ) {
    showIosHint.value = true;
  }
});

onUnmounted(() => {
  window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
});
</script>

<style scoped>
.pwa-install {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 99997;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  padding: calc(0.55rem + env(safe-area-inset-bottom, 0px)) 0.75rem 0.55rem;
  padding-left: calc(0.75rem + env(safe-area-inset-left, 0px));
  padding-right: calc(0.75rem + env(safe-area-inset-right, 0px));
  background: rgba(57, 73, 171, 0.97);
  color: #fff;
  font-size: 0.88rem;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
  box-sizing: border-box;
}

.pwa-install--ios {
  flex-direction: column;
  align-items: stretch;
  text-align: left;
  gap: 0.35rem;
}

.pwa-install__text {
  flex: 1 1 200px;
  margin: 0;
  line-height: 1.4;
}

.pwa-install__btn {
  padding: 0.4rem 0.85rem;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  background: transparent;
  color: #fff;
  font-weight: 500;
  font-size: 0.85rem;
  cursor: pointer;
}

.pwa-install__btn--primary {
  background: #fff;
  color: #3949ab;
  border-color: #fff;
}

.pwa-install__close {
  position: absolute;
  top: 0.35rem;
  right: 0.5rem;
  width: 2rem;
  height: 2rem;
  border: none;
  background: transparent;
  color: #fff;
  font-size: 1.35rem;
  line-height: 1;
  cursor: pointer;
  opacity: 0.85;
}

.pwa-install--ios {
  position: relative;
  padding-top: 2rem;
}
</style>

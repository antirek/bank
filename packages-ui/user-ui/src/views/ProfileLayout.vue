<template>
  <div class="profile-layout">
    <div class="container">
      <nav class="profile-subnav" aria-label="Разделы профиля">
        <template v-if="isBusinessSection">
          <router-link v-slot="{ href, navigate }" :to="{ name: 'ProfileBusinesses' }" custom>
            <a
              :href="href"
              class="subnav-link"
              :class="{ 'router-link-active': isBusinessesSubnavActive }"
              @click="navigate"
            >
              Мои бизнесы
            </a>
          </router-link>
          <router-link v-slot="{ href, navigate }" :to="{ name: 'ProfileBusinessChats' }" custom>
            <a
              :href="href"
              class="subnav-link"
              :class="{ 'router-link-active': isBusinessChatsSubnavActive }"
              @click="navigate"
            >
              Мои бизнес чаты
            </a>
          </router-link>
        </template>
        <template v-else>
          <router-link v-slot="{ href, navigate, isExactActive }" :to="{ name: 'ProfileHome' }" custom>
            <a
              :href="href"
              class="subnav-link"
              :class="{ 'router-link-active': isExactActive }"
              @click="navigate"
            >
              Мой профиль
            </a>
          </router-link>
          <router-link v-slot="{ href, navigate, isExactActive }" :to="{ name: 'ProfileSubscriptions' }" custom>
            <a
              :href="href"
              class="subnav-link"
              :class="{ 'router-link-active': isExactActive }"
              @click="navigate"
            >
              Мои подписки
            </a>
          </router-link>
        </template>
      </nav>
      <div class="profile-outlet">
        <router-view />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

/** Список бизнесов и конструктор карточки — один раздел */
const isBusinessesSubnavActive = computed(() => {
  const p = route.path;
  return (
    p === '/my/profile/businesses' ||
    p.startsWith('/my/profile/businesses/') ||
    route.name === 'BusinessCardBuilder'
  );
});

/** Чаты владельца бизнеса */
const isBusinessChatsSubnavActive = computed(() => {
  const p = route.path;
  return p === '/my/profile/business-chats' || p.startsWith('/my/businesses/');
});

const isBusinessSection = computed(() => isBusinessesSubnavActive.value || isBusinessChatsSubnavActive.value);
</script>

<style scoped>
.profile-layout {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 0.85rem 0 2rem;
}

.container {
  max-width: 100%;
  margin: 0;
}

.profile-subnav {
  display: flex;
  flex-wrap: wrap;
  gap: 0;
  margin: 0 0 0.45rem 0;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #ddd;
  width: fit-content;
  max-width: 100%;
  background: #fff;
}

.subnav-link {
  padding: 0.45rem 1rem;
  font-size: 0.92rem;
  font-weight: 600;
  color: #555;
  text-decoration: none;
  border-right: 1px solid #ddd;
  transition: background 0.15s, color 0.15s;
  display: inline-block;
}

.profile-subnav > :last-child .subnav-link {
  border-right: none;
}

.subnav-link:hover {
  background: #f3f4fd;
  color: #333;
}

.subnav-link.router-link-active {
  background: #667eea;
  color: #fff;
}

.profile-outlet {
  min-height: 120px;
}
</style>

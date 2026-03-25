<template>
  <div class="profile-layout">
    <div class="container">
      <nav class="profile-subnav" aria-label="Разделы профиля">
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
        <router-link v-slot="{ href, navigate, isExactActive }" :to="{ name: 'ProfileBusinesses' }" custom>
          <a
            :href="href"
            class="subnav-link"
            :class="{ 'router-link-active': isExactActive }"
            @click="navigate"
          >
            Мои бизнесы
          </a>
        </router-link>
      </nav>
      <div class="profile-outlet">
        <router-view />
      </div>
    </div>
  </div>
</template>

<style scoped>
.profile-layout {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 2rem 0 3rem;
}

.container {
  max-width: 100%;
  margin: 0;
}

.profile-subnav {
  display: flex;
  flex-wrap: wrap;
  gap: 0;
  margin: 0 0 1.25rem 0;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #ddd;
  width: fit-content;
  max-width: 100%;
  background: #fff;
}

.subnav-link {
  padding: 0.55rem 1.1rem;
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

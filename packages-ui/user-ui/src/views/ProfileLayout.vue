<template>
  <div class="profile-layout">
    <div class="container">
      <h1 class="layout-title">Мой профиль</h1>
      <nav class="profile-subnav" aria-label="Разделы профиля">
        <router-link :to="{ name: 'ProfileHome' }" class="subnav-link">
          Обзор
        </router-link>
        <router-link :to="{ name: 'ProfileSubscriptions' }" class="subnav-link">
          Мои подписки
        </router-link>
        <router-link :to="{ name: 'ProfileBusinesses' }" class="subnav-link">
          Мои бизнесы
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
  padding: 2rem 1rem 3rem;
}

.container {
  max-width: 900px;
  margin: 0 auto;
}

.layout-title {
  margin: 0 0 1rem 0;
  color: #333;
  font-size: 1.65rem;
}

.profile-subnav {
  display: flex;
  flex-wrap: wrap;
  gap: 0;
  margin-bottom: 1.25rem;
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
}

.subnav-link:last-child {
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

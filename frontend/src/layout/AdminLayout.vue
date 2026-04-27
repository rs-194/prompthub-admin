<template>
  <div class="admin-layout">
    <aside class="admin-layout__aside">
      <AppAside />
    </aside>
    <div class="layout-main">
      <header class="layout-main__header">
        <AppHeader />
      </header>
      <main class="layout-main__content">
        <router-view />
      </main>
      <footer class="layout-main__footer">
        <AppFooter />
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import AppAside from '@/layout/components/AppAside.vue';
import AppFooter from '@/layout/components/AppFooter.vue';
import AppHeader from '@/layout/components/AppHeader.vue';
</script>

<style scoped>
.admin-layout {
  display: flex;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: #f5f7fa;
}

.admin-layout__aside {
  width: 240px;
  height: 100vh;
  flex: 0 0 240px;
  background: #ffffff;
  border-right: 1px solid #e5e7eb;
}

.layout-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
}

.layout-main__header {
  height: 64px;
  flex: 0 0 64px;
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
  padding: 0 24px;
}

.layout-main__content {
  flex: 1;
  min-height: 0;
  overflow: auto;
  background: #f5f7fa;
  padding: 24px;
}

.layout-main__footer {
  height: 40px;
  flex: 0 0 40px;
  background: #ffffff;
  border-top: 1px solid #e5e7eb;
  padding: 0 24px;
}
</style>

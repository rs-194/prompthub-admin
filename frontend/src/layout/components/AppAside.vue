<template>
  <div class="app-aside">
    <div class="app-aside__brand">PromptHub Admin</div>
    <el-menu :default-active="activePath" class="app-aside__menu" router>
      <el-menu-item
        v-for="item in appMenus"
        :key="item.path"
        :index="item.path"
      >
        <el-icon v-if="item.icon">
          <component :is="item.icon" />
        </el-icon>
        <span>{{ item.title }}</span>
      </el-menu-item>
    </el-menu>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { appMenus } from '@/config/menu';

const route = useRoute();
const activePath = computed(() => route.path);
</script>

<style scoped>
.app-aside {
  width: 240px;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #ffffff;
}

.app-aside__brand {
  height: 64px;
  display: flex;
  align-items: center;
  padding: 0 20px;
  font-size: 18px;
  font-weight: 700;
  color: #111827;
  border-bottom: 1px solid #e5e7eb;
}

.app-aside__menu {
  flex: 1;
  border-right: none;
}
</style>
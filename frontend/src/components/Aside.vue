<template>
     <el-menu
        active-text-color="#ffd04b"
        background-color="#545c64"
        class="el-menu"
        text-color="#fff"
        :default-active="activePath" router
      >
      <h3>通用后台管理</h3>
      
        <el-sub-menu 
        v-for="value in hasChild"
        :key="value.path"
        :index="value.path"
        >
          <template #title>
            <el-icon class="icon"><component :is="value.icon" /></el-icon>
            <span>{{ value.label }}</span>
          </template>
          <el-menu-item
            v-for="item in value.children"
            :key="item.path"
            :index="item.path"
          >
            <template #title>
            <el-icon class="icon"><component :is="item.icon" /></el-icon>
            <span>{{ item.label }}</span>
          </template>
          </el-menu-item>
        </el-sub-menu>
        <el-menu-item
        v-for="novalue in noChild"
        :key="novalue.path"
        :index="novalue.path"
        >
          <el-icon class="icon"><component :is="novalue.icon" /></el-icon>
          <span>{{ novalue.label}}</span>
        </el-menu-item>
      </el-menu>
</template>

<script setup>
import { Child } from '@/menu/Child';
import { computed } from 'vue';
    const hasChild = computed(() => Child.value.filter(item => item.children && item.children.length > 0));
    const noChild = computed(() => Child.value.filter(item => !item.children || item.children.length === 0));
    console.log('hasChild 内容:', hasChild.value);
console.log('noChild 内容:', noChild.value);
</script>

<style>
el-menu{
  width: 100vh;
  min-height: 100vh;
  h3{
    color:#fff;
    display: flex;
  }

}
</style>
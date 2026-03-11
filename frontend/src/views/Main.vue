<template>
  <div class="common-layout">
    <el-container class="el-layout">
      <el-aside class="el-aside">
        <Aside />
      </el-aside>
      <el-container>
        <el-header class="el-header"><Header /></el-header>
        <el-main class="el-main"><router-view></router-view></el-main>
        <el-footer><Footer /></el-footer>
      </el-container>
    </el-container>
  </div>
</template>
<script setup>
import Aside from '@/components/Aside.vue'
import Footer from '@/components/Footer.vue';
import Header from '@/components/Header.vue';
</script>

<style>

.el-layout {
  height: 100vh;
  width: 100vh;
}
.el-aside{
  width: 180px;
  height:100vh;
  background-color:#545c64;
}
.el-header{
  height:60px;
  width: 100vw;
  background-color:#313436;


}
.el-main{
  height:100vh;
  width:100vh;
}
</style>
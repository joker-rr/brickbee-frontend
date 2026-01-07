<!--
 * @Author: joker.rrr 
 * @Date: 2025-12-20 02:18:17
 * @LastEditors: joker.rrr 
 * @LastEditTime: 2025-12-20 16:22:34
 * @FilePath: \frontend-backend\brickbee-frontend-ts\src\App.vue
 * @Description: 
 * 
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
-->
<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { AppNavbar } from '@/components/layout'

const MIN_WIDTH = 350

// 根据屏幕宽度缩放页面
const updateScale = () => {
  const app = document.getElementById('app')
  if (!app) return

  if (window.innerWidth < MIN_WIDTH) {
    const scale = window.innerWidth / MIN_WIDTH
    app.style.transform = `scale(${scale})`
    app.style.transformOrigin = 'top left'
    app.style.width = `${MIN_WIDTH}px`
    // 🔥 关键：把 body 撑高
    app.style.height = `${100 / scale}vh`
  } else {
    app.style.transform = ''
    app.style.transformOrigin = ''
    app.style.width = '100%'
    app.style.height = ''
  }
}

onMounted(() => {
  updateScale()
  window.addEventListener('resize', updateScale)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateScale)
})

</script>

<template>
  <div id="app">
    <!-- 全局导航栏 -->
    <AppNavbar />

    <!-- 页面内容 -->
    <main class="app-main">
      <router-view />
    </main>
  </div>
</template>

<style lang="scss">
#app {
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-main {
  flex: 1;
  width: 100%;
}
</style>

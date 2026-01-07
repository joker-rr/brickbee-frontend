<!--
 * @Author: joker.rrr 
 * @Date: 2025-12-13 17:01:31
 * @LastEditors: joker.rrr 
 * @LastEditTime: 2025-12-13 17:18:22
 * @FilePath: \frontend-backend\brickbee-frontend-ts\src\components\common\LogoIcon.vue
 * @Description: 
 * 
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
-->
<script setup lang="ts">
interface Props {
  size?: number
}

const props = withDefaults(defineProps<Props>(), {
  size: 40
})
</script>

<template>
  <svg :width="size" :height="size" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" class="logo-icon">
    <rect width="100" height="100" fill="#1A1A1A" />
    <path d="M 50,20 L 85,45 L 75,90 L 25,90 L 15,45 Z" fill="#FFC107" />
    <path d="M 50,25 L 20,48 L 30,80 L 49,70 Z" fill="#2C2C2C" />
    <path d="M 50,25 L 80,48 L 70,80 L 51,70 Z" fill="#2C2C2C" />
    <path d="M 50,20 L 55,40 L 45,40 Z" fill="#2C2C2C" />
    <path d="M 45,40 L 30,20" stroke="#FFC107" stroke-width="4" fill="none" stroke-linecap="round" />
    <path d="M 55,40 L 70,20" stroke="#FFC107" stroke-width="4" fill="none" stroke-linecap="round" />
  </svg>
</template>

<style lang="scss" scoped>
.logo-icon {
  display: block;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
  transition: transform 0.3s ease;
}
</style>

<template>
  <div class="blank-layout">
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
defineOptions({
  name: 'BlankLayout'
})
</script>

<style scoped lang="scss">
.blank-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
</style>

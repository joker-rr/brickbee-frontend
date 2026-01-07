import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useAppStore = defineStore('app', () => {
  // 状态
  const loading = ref(false);
  const sidebarCollapsed = ref(false);

  // 方法
  const setLoading = (value: boolean) => {
    loading.value = value;
  };

  const toggleSidebar = () => {
    sidebarCollapsed.value = !sidebarCollapsed.value;
  };

  return {
    loading,
    sidebarCollapsed,
    setLoading,
    toggleSidebar,
  };
});

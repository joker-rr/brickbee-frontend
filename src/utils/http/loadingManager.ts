/**
 * ============================================================================
 * 文件名：loadingManager.ts
 * 位置：src/utils/http/loadingManager.ts
 * 作用：管理全局 Loading 加载动画
 * 为什么需要：
 *   1. 请求时自动显示 Loading
 *   2. 响应后自动隐藏 Loading
 *   3. 多个请求并发时，避免 Loading 闪烁
 * ============================================================================
 */
import { logger } from '../logger';
/**
 * Loading 管理器类
 * 
 * 核心原理：使用计数器
 * - 每发起一个请求，计数器 +1
 * - 每完成一个请求，计数器 -1
 * - 只有计数器从 0 变成 1 时显示 Loading
 * - 只有计数器从 1 变成 0 时隐藏 Loading
 */
export class LoadingManager {
    // 正在进行的请求数量
    private loadingCount = 0;

    // Loading 实例（如果使用 UI 框架的 Loading 组件）
    // private loadingInstance: any = null;

    // --------------------------------------------------------------------------
    // 1. 显示 Loading
    // --------------------------------------------------------------------------

    /**
     * 显示 Loading
     * 
     * 工作流程：
     * 1. 计数器 +1
     * 2. 如果计数器从 0 变成 1，显示 Loading
     * 
     * 示例场景：
     * 请求1开始: count = 0 → 1，显示 Loading ✅
     * 请求2开始: count = 1 → 2，不显示（已经显示了）
     * 请求3开始: count = 2 → 3，不显示
     */
    show(): void {
        // 如果是第一个请求，显示 Loading
        if (this.loadingCount === 0) {
            this.showLoading();
        }

        // 计数器 +1
        this.loadingCount++;

        logger.log(`🔄 Loading 显示 (当前请求数: ${this.loadingCount})`);
    }

    // --------------------------------------------------------------------------
    // 2. 隐藏 Loading
    // --------------------------------------------------------------------------

    /**
     * 隐藏 Loading
     * 
     * 工作流程：
     * 1. 计数器 -1
     * 2. 如果计数器变成 0，隐藏 Loading
     * 
     * 示例场景：
     * 请求1完成: count = 3 → 2，不隐藏（还有请求在进行）
     * 请求2完成: count = 2 → 1，不隐藏
     * 请求3完成: count = 1 → 0，隐藏 Loading ✅
     */
    hide(): void {
        // 防止计数器变成负数
        if (this.loadingCount > 0) {
            this.loadingCount--;
        }

        // 如果所有请求都完成了，隐藏 Loading
        if (this.loadingCount === 0) {
            this.hideLoading();
        }

        logger.log(`✅ Loading 隐藏 (剩余请求数: ${this.loadingCount})`);
    }

    // --------------------------------------------------------------------------
    // 3. 强制清除所有 Loading
    // --------------------------------------------------------------------------

    /**
     * 强制清除所有 Loading
     * 
     * 使用场景：
     * 1. 页面跳转时
     * 2. 出现错误需要重置时
     * 3. 用户手动取消请求时
     */
    clear(): void {
        this.loadingCount = 0;
        this.hideLoading();
        logger.log('🗑️ Loading 已清除');
    }

    // --------------------------------------------------------------------------
    // 4. 实际显示/隐藏 Loading 的方法
    // --------------------------------------------------------------------------

    /**
     * 实际显示 Loading
     * 
     * 这里的实现取决于你使用的 UI 框架：
     * - Element Plus: ElLoading.service()
     * - Ant Design Vue: message.loading()
     * - Naive UI: useLoadingBar()
     * - 原生实现: 显示一个遮罩层
     */
    private showLoading(): void {
        // ========================================
        // 方式1: 使用 Element Plus
        // ========================================
        /*
        import { ElLoading } from 'element-plus';
        
        this.loadingInstance = ElLoading.service({
          lock: true,                    // 锁定屏幕
          text: '加载中...',             // 提示文字
          background: 'rgba(0, 0, 0, 0.7)', // 背景色
        });
        */

        // ========================================
        // 方式2: 使用 Ant Design Vue
        // ========================================
        /*
        import { message } from 'ant-design-vue';
        
        this.loadingInstance = message.loading('加载中...', 0);
        */

        // ========================================
        // 方式3: 使用 Naive UI
        // ========================================
        /*
        import { useLoadingBar } from 'naive-ui';
        
        const loadingBar = useLoadingBar();
        loadingBar.start();
        */

        // ========================================
        // 方式4: 原生实现（示例）
        // ========================================
        const loadingDiv = document.createElement('div');
        loadingDiv.id = 'global-loading';
        loadingDiv.innerHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
      ">
        <div style="
          background: white;
          padding: 20px 40px;
          border-radius: 8px;
          font-size: 16px;
        ">
          加载中...
        </div>
      </div>
    `;
        document.body.appendChild(loadingDiv);
    }

    /**
     * 实际隐藏 Loading
     */
    private hideLoading(): void {
        // ========================================
        // 方式1: Element Plus
        // ========================================
        /*
        this.loadingInstance?.close();
        this.loadingInstance = null;
        */

        // ========================================
        // 方式2: Ant Design Vue
        // ========================================
        /*
        this.loadingInstance?.();
        this.loadingInstance = null;
        */

        // ========================================
        // 方式3: Naive UI
        // ========================================
        /*
        const loadingBar = useLoadingBar();
        loadingBar.finish();
        */

        // ========================================
        // 方式4: 原生实现
        // ========================================
        const loadingDiv = document.getElementById('global-loading');
        if (loadingDiv) {
            loadingDiv.remove();
        }
    }
}

// --------------------------------------------------------------------------
// 使用示例
// --------------------------------------------------------------------------

/*
// 1. 创建 LoadingManager 实例
const loadingManager = new LoadingManager();

// 2. 在请求拦截器中显示 Loading
axios.interceptors.request.use((config) => {
  // 检查是否需要显示 Loading
  if (config.showLoading !== false) {
    loadingManager.show();
  }
  return config;
});

// 3. 在响应拦截器中隐藏 Loading
axios.interceptors.response.use(
  (response) => {
    if (response.config.showLoading !== false) {
      loadingManager.hide();
    }
    return response;
  },
  (error) => {
    if (error.config?.showLoading !== false) {
      loadingManager.hide();
    }
    return Promise.reject(error);
  }
);

// 4. 页面跳转时清除 Loading
router.beforeEach((to, from, next) => {
  loadingManager.clear();
  next();
});

// 5. 某些请求不需要 Loading
const getData = async () => {
  // showLoading: false 表示不显示 Loading
  const data = await http.get('/api/data', {
    showLoading: false,
  });
};
*/

// --------------------------------------------------------------------------
// 问题场景演示
// --------------------------------------------------------------------------

/*
❌ 没有 LoadingManager 的情况：

时间线：
0ms:  请求1发起 → 显示 Loading
100ms: 请求2发起 → 显示 Loading（重复显示）
200ms: 请求1完成 → 隐藏 Loading
300ms: 请求2完成 → 隐藏 Loading（重复隐藏）

问题：Loading 闪烁，用户体验差

---

✅ 有 LoadingManager 的情况：

时间线：
0ms:  请求1发起 → count=0→1 → 显示 Loading
100ms: 请求2发起 → count=1→2 → 不显示（已经显示）
200ms: 请求1完成 → count=2→1 → 不隐藏（还有请求）
300ms: 请求2完成 → count=1→0 → 隐藏 Loading

结果：Loading 只显示/隐藏一次，体验流畅
*/
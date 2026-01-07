/**
 * ============================================================================
 * 文件名：errorHandler.ts
 * 位置：src/utils/http/errorHandler.ts
 * 作用：统一处理各种错误
 * 为什么需要：
 *   1. 根据错误类型显示不同的提示
 *   2. 处理特殊错误（如 Token 过期、权限不足）
 *   3. 记录错误日志
 * ============================================================================
 */

import { AxiosError } from 'axios';
import {
    BusinessCode, ApiError,
    // type ApiResponse, HttpStatus 
} from './types';
// import { BusinessCode, HttpStatus, ApiError } from './types';
import { toast } from '@/utils/toast'
import { logger } from '../../utils/logger'
/**
 * 错误处理器类
 */
export class ErrorHandler {
    /**
     * 处理错误
     * 
     * @param error - 错误对象
     * @returns 是否已处理该错误
     */
    handle(error: any): boolean {
        logger.group('🔴 错误处理');
        logger.error('原始错误:', error);
        // 1. 判断是不是 Axios 错误
        if (error instanceof AxiosError) {
            return this.handleAxiosError(error);
        }

        // 2. 判断是不是自定义的 API 错误
        if (error instanceof ApiError) {
            return this.handleApiError(error);
        }

        // 3. 其他错误
        return this.handleUnknownError(error);
    }

    // --------------------------------------------------------------------------
    // 1. 处理 Axios 错误
    // --------------------------------------------------------------------------

    /**
     * 处理 Axios 错误
     * 
     * Axios 错误包括：
     * - 网络错误（断网、超时）
     * - HTTP 状态码错误（401, 403, 404, 500...）
     */
    private handleAxiosError(error: AxiosError): boolean {
        // 如果没有响应，说明是网络错误
        if (!error.response) {
            this.handleNetworkError(error);
            logger.groupEnd();
            return true;
        }

        // 如果有响应，根据 HTTP 状态码处理
        const status = error.response.status;
        logger.log('HTTP 状态码:', status);
        // const responseData = error.response.data as ApiResponse
        // const message = responseData?.message || null


        // 按照状态码返回错误类型，以后可能会需要
        // this.handleHttpStatusError(status, message);
        logger.groupEnd();
        return true;
    }

    // --------------------------------------------------------------------------
    // 2. 处理网络错误
    // --------------------------------------------------------------------------

    /**
     * 处理网络错误
     * 
     * 网络错误包括：
     * - 断网
     * - 请求超时
     * - 服务器无响应
     */
    private handleNetworkError(error: AxiosError): void {
        logger.error('网络错误:', error.message);

        // 判断具体的网络错误类型
        if (error.code === 'ECONNABORTED') {
            // 请求超时
            this.showError('请求超时，请检查网络连接');
        } else if (error.message.includes('Network Error')) {
            // 网络错误
            this.showError('网络连接失败，请检查网络设置');
        } else {
            // 其他网络错误
            this.showError('网络错误，请稍后重试');
        }
    }

    // --------------------------------------------------------------------------
    // 3. 处理 HTTP 状态码错误
    // --------------------------------------------------------------------------

    /**
     * 处理 HTTP 状态码错误
     * 
     * @param status - HTTP 状态码
     * @param error - 错误对象
     */
    // private handleHttpStatusError(status: number, message: string | null): void {
    //     if (message) {
    //         this.showError(message);
    //         return;  // ✅ 提前退出，不再执行 switch
    //     }

    //     switch (status) {
    //         // ========================================
    //         // 400 - 参数错误
    //         // ========================================
    //         case HttpStatus.BAD_REQUEST:
    //             logger.error('参数错误');
    //             this.showError('请求参数错误');
    //             break;

    //         // ========================================
    //         // 401 - 未授权（未登录）
    //         // ========================================
    //         case HttpStatus.UNAUTHORIZED:
    //             logger.error('未授权，需要登录');
    //             this.showError('登录已过期，请重新登录');
    //             // 跳转到登录页
    //             this.redirectToLogin();
    //             break;

    //         // ========================================
    //         // 403 - 禁止访问（无权限）
    //         // ========================================
    //         case HttpStatus.FORBIDDEN:
    //             logger.error('权限不足');
    //             this.showError('权限不足，无法访问该资源');
    //             break;

    //         // ========================================
    //         // 404 - 资源不存在
    //         // ========================================
    //         case HttpStatus.NOT_FOUND:
    //             logger.error('资源不存在');
    //             this.showError('请求的资源不存在');
    //             break;

    //         // ========================================
    //         // 408 - 请求超时
    //         // ========================================
    //         case HttpStatus.REQUEST_TIMEOUT:
    //             logger.error('请求超时');
    //             this.showError('请求超时，请稍后重试');
    //             break;

    //         // ========================================
    //         // 429 - 请求过于频繁
    //         // ========================================
    //         case HttpStatus.TOO_MANY_REQUESTS:
    //             logger.error('请求过于频繁');
    //             this.showError('请求过于频繁，请稍后再试');
    //             break;

    //         // ========================================
    //         // 500 - 服务器内部错误
    //         // ========================================
    //         case HttpStatus.INTERNAL_SERVER_ERROR:
    //             logger.error('服务器内部错误');
    //             this.showError('服务器错误，请稍后重试');
    //             break;

    //         // ========================================
    //         // 502 - 错误网关
    //         // ========================================
    //         case HttpStatus.BAD_GATEWAY:
    //             logger.error('网关错误');
    //             this.showError('网关错误，请稍后重试');
    //             break;

    //         // ========================================
    //         // 503 - 服务不可用
    //         // ========================================
    //         case HttpStatus.SERVICE_UNAVAILABLE:
    //             logger.error('服务不可用');
    //             this.showError('服务暂时不可用，请稍后重试');
    //             break;

    //         // ========================================
    //         // 504 - 网关超时
    //         // ========================================
    //         case HttpStatus.GATEWAY_TIMEOUT:
    //             logger.error('网关超时');
    //             this.showError('网关超时，请稍后重试');
    //             break;

    //         // ========================================
    //         // 其他错误
    //         // ========================================
    //         default:
    //             logger.error('未知的 HTTP 错误:', status);
    //             const message = '未知错误，请求失败，请稍后重试';
    //             this.showError(message);
    //     }
    // }

    // --------------------------------------------------------------------------
    // 4. 处理自定义 API 错误
    // --------------------------------------------------------------------------

    /**
     * 处理自定义 API 错误
     * 
     * @param error - API 错误对象
     */
    private handleApiError(error: ApiError): boolean {
        logger.log('业务错误码:', error.code);
        logger.log('错误信息:', error.message);
        logger.log('链路追踪 ID:', error.traceId);

        switch (error.code) {
            // ========================================
            // Token 过期
            // ========================================
            case BusinessCode.TOKEN_EXPIRED:
                logger.warn('Token 过期，需要刷新');
                // 这个错误通常在响应拦截器中处理，这里只是记录
                break;

            // ========================================
            // Token 无效
            // ========================================
            case BusinessCode.TOKEN_INVALID:
                logger.error('Token 无效');
                this.showError('登录信息无效，请重新登录');
                this.redirectToLogin();
                break;

            // ========================================
            // 权限不足
            // ========================================
            case BusinessCode.PERMISSION_DENIED:
                logger.error('权限不足');
                this.showError('权限不足，无法执行该操作');
                break;

            // ========================================
            // 请求过于频繁
            // ========================================
            case BusinessCode.FREQUENT_REQUESTS:
                logger.warn('请求过于频繁');
                this.showError('操作过于频繁，请稍后再试');
                break;

            // ========================================
            // 其他业务错误
            // ========================================
            default:
                logger.error('业务错误:', error.message);
                this.showError(error.message);
        }

        logger.groupEnd();
        return true;
    }

    // --------------------------------------------------------------------------
    // 5. 处理未知错误
    // --------------------------------------------------------------------------

    /**
     * 处理未知错误
     */
    private handleUnknownError(error: any): boolean {
        logger.error('未知错误:', error);
        this.showError('发生未知错误，请稍后重试');
        logger.groupEnd();
        return true;
    }

    // --------------------------------------------------------------------------
    // 6. 显示错误提示
    // --------------------------------------------------------------------------

    /**
     * 显示错误提示
     * 
     * 这里的实现取决于你使用的 UI 框架：
     * - Element Plus: ElMessage.error()
     * - Ant Design Vue: message.error()
     * - Naive UI: useMessage()
     */
    private showError(message: string): void {
        // ========================================
        // 方式1: Element Plus
        // ========================================
        /*
        import { ElMessage } from 'element-plus';
        
        ElMessage.error({
          message,
          duration: 3000,
          showClose: true,
        });
        */

        // ========================================
        // 方式2: Ant Design Vue
        // ========================================
        /*
        import { message } from 'ant-design-vue';
        
        message.error(message);
        */

        // ========================================
        // 方式3: Naive UI
        // ========================================
        /*
        import { useMessage } from 'naive-ui';
        
        const message = useMessage();
        message.error(message);
        */

        // ========================================
        // 方式4: 原生实现（示例）
        // ========================================
        logger.error('❌', message);
        toast.error(message)
    }

    // --------------------------------------------------------------------------
    // 7. 跳转到登录页
    // --------------------------------------------------------------------------

    /**
     * 跳转到登录页
     *
     * 保存当前页面路径，登录后可以跳回来
     */
    private redirectToLogin(): void {
        const currentPath = window.location.pathname;
        const loginUrl = '/login';

        // 如果当前就是登录页，不需要跳转
        if (currentPath === loginUrl) {
            return;
        }

        // 保存当前路径到 URL 参数，登录后跳回来
        window.location.href = `${loginUrl}?redirect=${encodeURIComponent(currentPath)}`;
    }

    /**
     * 带倒计时的跳转到登录页
     *
     * @param seconds - 倒计时秒数（默认 5 秒）
     */
    redirectToLoginWithCountdown(seconds: number = 5): void {
        const initialPath = window.location.pathname;
        const loginUrl = '/login';

        // 如果当前就是登录页，不需要跳转
        if (initialPath === loginUrl) {
            return;
        }

        let remainingSeconds = seconds;
        let isCancelled = false;

        // 创建一个 DOM 元素来显示倒计时
        const countdownElement = document.createElement('div');
        countdownElement.style.cssText = `
            position: fixed;
            top: 70px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 10000;
            background: #faad14;
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            font-size: 14px;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 10px;
            animation: slideDown 0.3s ease;
        `;

        // 添加动画样式
        if (!document.getElementById('countdown-animation-style')) {
            const style = document.createElement('style');
            style.id = 'countdown-animation-style';
            style.textContent = `
                @keyframes slideDown {
                    from {
                        opacity: 0;
                        transform: translateX(-50%) translateY(-20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(-50%) translateY(0);
                    }
                }
            `;
            document.head.appendChild(style);
        }

        // 清理函数
        const cleanup = () => {
            isCancelled = true;
            clearInterval(timer);
            window.removeEventListener('popstate', onRouteChange);
            if (countdownElement.parentNode) {
                countdownElement.remove();
            }
        };

        // 路由变化监听
        const onRouteChange = () => {
            // 路由发生变化，取消跳转
            cleanup();
            logger.log('路由已变化，取消自动跳转到登录页');
        };

        // 监听浏览器前进/后退
        window.addEventListener('popstate', onRouteChange);

        // 更新倒计时文本的函数
        const updateCountdown = () => {
            countdownElement.innerHTML = `
                <span style="font-size: 18px;">⚠</span>
                <span>未登录，<strong style="font-size: 16px; color: #fff;">${remainingSeconds}</strong> 秒后跳转到登录页...</span>
            `;
        };

        // 显示初始倒计时
        updateCountdown();
        document.body.appendChild(countdownElement);

        // 每秒更新倒计时
        const timer = setInterval(() => {
            // 检查路由是否已变化
            if (isCancelled || window.location.pathname !== initialPath) {
                cleanup();
                return;
            }

            remainingSeconds--;

            if (remainingSeconds > 0) {
                updateCountdown();
            } else {
                cleanup();
                // 跳转到登录页
                window.location.href = `${loginUrl}?redirect=${encodeURIComponent(initialPath)}`;
            }
        }, 1000);
    }
}

// --------------------------------------------------------------------------
// 使用示例
// --------------------------------------------------------------------------

/*
// 1. 创建错误处理器实例
const errorHandler = new ErrorHandler();

// 2. 在响应拦截器中使用
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    // 处理错误
    errorHandler.handle(error);
    
    return Promise.reject(error);
  }
);

// 3. 在组件中使用
const fetchData = async () => {
  try {
    const data = await http.get('/api/data');
  } catch (error) {
    // 错误已经被错误处理器处理了
    // 这里可以做一些额外的处理
    logger.log('额外的错误处理');
  }
};
*/
const isDev = import.meta.env.DEV;

/**
 * 日志工具类
 * 生产环境只输出 error，开发环境输出所有日志
 */
export const logger = {
  log: (...args: any[]) => {
    if (isDev) {
      console.log('[LOG]', ...args);
    }
  },

  warn: (...args: any[]) => {
    if (isDev) {
      console.warn('[WARN]', ...args);
    }
  },

  error: (...args: any[]) => {
    console.error('[ERROR]', ...args);
  },

  info: (...args: any[]) => {
    if (isDev) {
      console.info('[INFO]', ...args);
    }
  },

  debug: (...args: any[]) => {
    if (isDev) {
      console.debug('[DEBUG]', ...args);
    }
  },

  // 分组相关
  group: (...args: any[]) => {
    if (isDev) {
      console.group(...args);
    }
  },

  groupCollapsed: (...args: any[]) => {
    if (isDev) {
      console.groupCollapsed(...args);
    }
  },

  groupEnd: () => {
    if (isDev) {
      console.groupEnd();
    }
  },

  // 表格输出
  table: (data: any, columns?: string[]) => {
    if (isDev) {
      console.table(data, columns);
    }
  },

  // 计时相关
  time: (label: string) => {
    if (isDev) {
      console.time(label);
    }
  },

  timeEnd: (label: string) => {
    if (isDev) {
      console.timeEnd(label);
    }
  },

  timeLog: (label: string, ...args: any[]) => {
    if (isDev) {
      console.timeLog(label, ...args);
    }
  },

  // 计数
  count: (label?: string) => {
    if (isDev) {
      console.count(label);
    }
  },

  countReset: (label?: string) => {
    if (isDev) {
      console.countReset(label);
    }
  },

  // 清空控制台
  clear: () => {
    if (isDev) {
      console.clear();
    }
  },

  // 断言
  assert: (condition: boolean, ...args: any[]) => {
    if (isDev) {
      console.assert(condition, ...args);
    }
  },

  // 堆栈追踪
  trace: (...args: any[]) => {
    if (isDev) {
      console.trace(...args);
    }
  },

  // 目录树形式展示对象
  dir: (obj: any, options?: any) => {
    if (isDev) {
      console.dir(obj, options);
    }
  },

  dirxml: (obj: any) => {
    if (isDev) {
      console.dirxml(obj);
    }
  },
};

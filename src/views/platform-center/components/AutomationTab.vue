<script setup lang="ts">
/**
 * 自动化脚本 Tab 组件
 *
 * 功能：
 * 1. 创建/管理自动化任务
 * 2. 任务列表显示
 * 3. 任务物品列表
 * 4. 运行日志
 */

import { ref } from 'vue'
import { PlatformType } from '@/config/platform.config'

// Props
interface Props {
  platform: PlatformType
}

const props = defineProps<Props>()

// 状态
const showCreateTaskModal = ref(false)
const activeView = ref<'tasks' | 'logs'>('tasks')

// 写死的示例数据 - 任务列表
const tasks = ref([
  {
    id: '1',
    name: 'AK47自动上架任务',
    keepQuantity: 5,
    buyTimeMinutes: 10,
    profitIncreasePercent: 2,
    smartPricing: true,
    status: 'running',
    items: [
      {
        id: '1',
        image: 'https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpot7HxfDhjxszJemkV09-5lpKKqPrxN7LEmyVQ7MEpiLuSrYmnjQO3-UdsZGrzIYeRJlU2N1nU-Ae_xOnsjF7p6c_OnyRh6D5iuyhKpOjVQg',
        name: 'AK-47 | Head Shot (Battle-Scarred)',
        nameZh: 'AK-47 | 一发入魂 (战痕累累)',
        buffPrice: 206.16,
        youyouPrice: 209,
        youyouProfit: -25.18,
        youyouProfitRate: -5,
        marketPrice: 34.893,
        marketPriceUsd: 34.893,
        yourPrice: 34.893,
        lowestPrice: 34.644,
        costPrice: 205,
        profitRate: 6,
        profit: 13.33,
        updatedAt: '8秒前刷新'
      },
      {
        id: '2',
        image: 'https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpot7HxfDhjxszJemkV092lnYmGmOHLP7LWnn8fsMYl2rvFo9Sj2VG1qRU_ZD30LNLAdA45ZFjT-gO6l-a8jJ-7uJnKzXQ16yQr7S3D30vgtChfOXo',
        name: 'M4A1-S | Decimator (Field-Tested)',
        nameZh: 'M4A1 消音型 | 毁灭者 (久经沙场)',
        buffPrice: 158.50,
        youyouPrice: 162,
        youyouProfit: -18.50,
        youyouProfitRate: -4,
        marketPrice: 28.50,
        marketPriceUsd: 28.50,
        yourPrice: 28.50,
        lowestPrice: 28.20,
        costPrice: 155,
        profitRate: 8,
        profit: 12.40,
        updatedAt: '15秒前刷新'
      }
    ]
  },
  {
    id: '2',
    name: 'AWP高价值监控',
    keepQuantity: 3,
    buyTimeMinutes: 5,
    profitIncreasePercent: 3,
    smartPricing: false,
    status: 'paused',
    items: []
  }
])

// 写死的示例数据 - 日志
const logs = ref([
  { id: '1', timestamp: Date.now() - 5000, level: 'info', message: '任务 "AK47自动上架任务" 开始运行' },
  { id: '2', timestamp: Date.now() - 3000, level: 'info', message: '检测到价格变动: AK-47 | Head Shot 市场价 34.893$' },
  { id: '3', timestamp: Date.now() - 1000, level: 'warn', message: '利润率低于阈值: M4A1-S | Decimator 当前利润率 8%' }
])

// 新任务表单
const newTask = ref({
  name: '',
  keepQuantity: 5,
  buyTimeMinutes: 10,
  profitIncreasePercent: 2,
  smartPricing: true
})

/**
 * 打开创建任务弹窗
 */
function openCreateTaskModal() {
  showCreateTaskModal.value = true
}

/**
 * 关闭创建任务弹窗
 */
function closeCreateTaskModal() {
  showCreateTaskModal.value = false
}

/**
 * 创建任务（示例）
 */
function handleCreateTask() {
  console.log('创建任务:', newTask.value)
  showCreateTaskModal.value = false
}

/**
 * 切换视图
 */
function switchView(view: 'tasks' | 'logs') {
  activeView.value = view
}

/**
 * 格式化日志时间
 */
function formatLogTime(timestamp: number): string {
  const date = new Date(timestamp)
  const time = date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
  const ms = String(date.getMilliseconds()).padStart(3, '0')
  return `${time}.${ms}`
}

/**
 * 获取任务状态文字
 */
function getStatusText(status: string): string {
  switch (status) {
    case 'running': return '运行中'
    case 'paused': return '已暂停'
    case 'stopped': return '已停止'
    default: return '未知'
  }
}

/**
 * 获取任务状态样式
 */
function getStatusClass(status: string): string {
  switch (status) {
    case 'running': return 'status-running'
    case 'paused': return 'status-paused'
    case 'stopped': return 'status-stopped'
    default: return ''
  }
}
</script>

<template>
  <div class="automation-tab">
    <!-- 顶部操作栏 -->
    <div class="tab-header">
      <div class="header-left">
        <h3 class="tab-title">自动化任务</h3>
        <span class="platform-badge">{{ platform }}</span>
      </div>

      <div class="header-right">
        <button class="btn btn-primary" @click="openCreateTaskModal">
          <span class="btn-icon">+</span>
          创建任务
        </button>
      </div>
    </div>

    <!-- 主内容区 -->
    <div class="tab-content">
      <!-- 左侧：任务列表 -->
      <div class="content-left">
        <!-- 视图切换 -->
        <div class="view-tabs">
          <button
            class="view-tab"
            :class="{ active: activeView === 'tasks' }"
            @click="switchView('tasks')"
          >
            任务列表
            <span class="tab-count">{{ tasks.length }}</span>
          </button>
          <button
            class="view-tab"
            :class="{ active: activeView === 'logs' }"
            @click="switchView('logs')"
          >
            运行日志
            <span class="tab-count">{{ logs.length }}</span>
          </button>
        </div>

        <!-- 任务列表视图 -->
        <div v-if="activeView === 'tasks'" class="tasks-container">
          <div v-for="task in tasks" :key="task.id" class="task-card">
            <!-- 任务头部 -->
            <div class="task-header">
              <div class="task-info">
                <h4 class="task-name">{{ task.name }}</h4>
                <span class="task-status" :class="getStatusClass(task.status)">
                  {{ getStatusText(task.status) }}
                </span>
              </div>
              <div class="task-actions">
                <button class="action-btn" title="编辑">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                </button>
                <button class="action-btn danger" title="删除">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                </button>
              </div>
            </div>

            <!-- 任务配置参数 -->
            <div class="task-params">
              <div class="param-item">
                <span class="param-label">保持上架</span>
                <span class="param-value">{{ task.keepQuantity }} 件</span>
              </div>
              <div class="param-item">
                <span class="param-label">被买时间</span>
                <span class="param-value">{{ task.buyTimeMinutes }} 分钟</span>
              </div>
              <div class="param-item">
                <span class="param-label">利润增加</span>
                <span class="param-value">+{{ task.profitIncreasePercent }}%</span>
              </div>
              <div class="param-item">
                <span class="param-label">智能改价</span>
                <span class="param-value" :class="task.smartPricing ? 'text-success' : 'text-muted'">
                  {{ task.smartPricing ? '已开启' : '已关闭' }}
                </span>
              </div>
            </div>

            <!-- 任务物品列表 -->
            <div v-if="task.items.length > 0" class="task-items">
              <div class="items-header">
                <span>物品列表 ({{ task.items.length }})</span>
              </div>

              <div class="items-list">
                <div v-for="item in task.items" :key="item.id" class="item-card">
                  <!-- 物品信息区域 -->
                  <div class="item-information">
                    <!-- 英文名称 - 独占一行，在最上方 -->
                    <p class="item-name-en">{{ item.name }}</p>

                    <!-- 下方内容：图片 + 价格信息 + 按钮 -->
                    <div class="item-content">
                      <!-- 物品图片 -->
                      <div class="item-image">
                        <img :src="item.image" :alt="item.name" />
                      </div>

                      <!-- 价格信息 -->
                      <div class="item-prices">
                        <!-- 中文名称 -->
                        <p class="item-name-zh">{{ item.nameZh }}</p>

                        <!-- Buff 价格行 -->
                        <div class="price-row">
                          <span class="price-platform buff">buff:</span>
                          <span class="price-value">{{ item.buffPrice }}¥</span>
                          <span class="price-label">利润:{{ item.profit.toFixed(2) }}</span>
                          <span class="price-label">利润率:{{ item.profitRate }}%</span>
                        </div>

                        <!-- 悠悠价格行 -->
                        <div class="price-row">
                          <span class="price-platform youyou">悠:</span>
                          <span class="price-value">{{ item.youyouPrice }}¥</span>
                          <span class="price-profit negative">搬砖利润{{ item.youyouProfit }}</span>
                          <span class="price-rate negative">利润率{{ item.youyouProfitRate }}%</span>
                        </div>

                        <!-- Market 价格行 -->
                        <div class="price-row">
                          <span class="price-platform market">market:</span>
                          <span class="price-value">{{ item.marketPriceUsd }}$</span>
                          <span class="price-label">你的售价:{{ item.yourPrice }}$</span>
                        </div>

                        <!-- 底部信息行 -->
                        <div class="price-row summary-row">
                          <span class="price-lowest">最底价:{{ item.lowestPrice }}$</span>
                          <span class="price-cost">成本:{{ item.costPrice }}</span>
                          <span class="update-time">{{ item.updatedAt }}</span>
                        </div>
                      </div>

                      <!-- 操作按钮 -->
                      <div class="item-actions">
                        <button class="item-btn edit">修改</button>
                        <button class="item-btn cancel">取消</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 无物品提示 -->
            <div v-else class="task-empty">
              <span>暂无物品，请从库存中添加</span>
              <button class="btn btn-sm btn-outline">去添加</button>
            </div>
          </div>

          <!-- 无任务提示 -->
          <div v-if="tasks.length === 0" class="no-tasks">
            <div class="empty-icon">📋</div>
            <p>暂无自动化任务</p>
            <button class="btn btn-primary" @click="openCreateTaskModal">创建第一个任务</button>
          </div>
        </div>

        <!-- 日志视图 -->
        <div v-else class="logs-container">
          <div class="logs-list">
            <div
              v-for="log in logs"
              :key="log.id"
              class="log-item"
              :class="'log-' + log.level"
            >
              <span class="log-time">{{ formatLogTime(log.timestamp) }}</span>
              <span class="log-level">{{ log.level.toUpperCase() }}</span>
              <span class="log-message">{{ log.message }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 创建任务弹窗 -->
    <Teleport to="body">
      <div v-if="showCreateTaskModal" class="modal-overlay" @click.self="closeCreateTaskModal">
        <div class="modal-content create-task-modal">
          <!-- 弹窗头部 -->
          <div class="modal-header">
            <h3>创建自动化任务</h3>
            <button class="close-btn" @click="closeCreateTaskModal">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <!-- 弹窗内容 -->
          <div class="modal-body">
            <!-- 任务名称 -->
            <div class="form-group">
              <label class="form-label">任务名称</label>
              <input
                v-model="newTask.name"
                type="text"
                class="form-input"
                placeholder="例如：AK47自动上架任务"
              />
            </div>

            <!-- 保持上架数量 -->
            <div class="form-group">
              <label class="form-label">保持上架数量</label>
              <div class="input-with-unit">
                <input
                  v-model.number="newTask.keepQuantity"
                  type="number"
                  class="form-input"
                  min="1"
                  placeholder="5"
                />
                <span class="input-unit">件</span>
              </div>
              <p class="form-hint">当库存中该物品上架数量低于此值时，自动补充上架</p>
            </div>

            <!-- 被买时间 -->
            <div class="form-group">
              <label class="form-label">上架后被买时间</label>
              <div class="input-with-unit">
                <input
                  v-model.number="newTask.buyTimeMinutes"
                  type="number"
                  class="form-input"
                  min="1"
                  placeholder="10"
                />
                <span class="input-unit">分钟</span>
              </div>
              <p class="form-hint">如果物品在此时间内被买走，则触发利润率增加</p>
            </div>

            <!-- 利润率增加 -->
            <div class="form-group">
              <label class="form-label">目标利润率增加</label>
              <div class="input-with-unit">
                <input
                  v-model.number="newTask.profitIncreasePercent"
                  type="number"
                  class="form-input"
                  min="0"
                  step="0.5"
                  placeholder="2"
                />
                <span class="input-unit">%</span>
              </div>
              <p class="form-hint">被快速买走后，下次上架时利润率增加的百分比</p>
            </div>

            <!-- 智能改价开关 -->
            <div class="form-group">
              <div class="switch-row">
                <label class="form-label">开启智能改价</label>
                <label class="switch">
                  <input type="checkbox" v-model="newTask.smartPricing" />
                  <span class="slider"></span>
                </label>
              </div>
              <p class="form-hint">开启后，系统将根据市场价格自动调整你的售价</p>
            </div>
          </div>

          <!-- 弹窗底部 -->
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="closeCreateTaskModal">取消</button>
            <button class="btn btn-primary" @click="handleCreateTask">创建任务</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.automation-tab {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 20px;
  background-color: #f5f5f5;
}

/* ===== 顶部操作栏 ===== */
.tab-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.tab-title {
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.platform-badge {
  padding: 4px 12px;
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  color: white;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 500;
}

.header-right {
  display: flex;
  gap: 12px;
}

/* ===== 按钮 ===== */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.btn-secondary {
  background-color: #e5e7eb;
  color: #374151;
}

.btn-secondary:hover {
  background-color: #d1d5db;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 12px;
}

.btn-outline {
  background: transparent;
  border: 1px solid #3b82f6;
  color: #3b82f6;
}

.btn-icon {
  font-size: 18px;
  font-weight: 300;
}

/* ===== 主内容区 ===== */
.tab-content {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.content-left {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

/* ===== 视图切换 ===== */
.view-tabs {
  display: flex;
  border-bottom: 1px solid #e5e7eb;
  background: #fafafa;
}

.view-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 20px;
  background: none;
  border: none;
  font-size: 14px;
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
  border-bottom: 2px solid transparent;
}

.view-tab:hover {
  color: #3b82f6;
  background: #f0f7ff;
}

.view-tab.active {
  color: #3b82f6;
  background: white;
  border-bottom-color: #3b82f6;
}

.tab-count {
  padding: 2px 8px;
  background: #e5e7eb;
  color: #6b7280;
  border-radius: 10px;
  font-size: 11px;
}

.view-tab.active .tab-count {
  background: #3b82f6;
  color: white;
}

/* ===== 任务列表 ===== */
.tasks-container {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.task-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  margin-bottom: 16px;
  overflow: hidden;
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #fafafa;
  border-bottom: 1px solid #e5e7eb;
}

.task-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.task-name {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.task-status {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.status-running {
  background: #dcfce7;
  color: #16a34a;
}

.status-paused {
  background: #fef3c7;
  color: #d97706;
}

.status-stopped {
  background: #fee2e2;
  color: #dc2626;
}

.task-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  padding: 6px;
  background: none;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background: #f3f4f6;
  color: #3b82f6;
  border-color: #3b82f6;
}

.action-btn.danger:hover {
  background: #fef2f2;
  color: #dc2626;
  border-color: #dc2626;
}

/* ===== 任务参数 ===== */
.task-params {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  padding: 16px;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}

.param-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.param-label {
  font-size: 12px;
  color: #6b7280;
}

.param-value {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
}

.text-success {
  color: #16a34a;
}

.text-muted {
  color: #9ca3af;
}

/* ===== 任务物品列表 ===== */
.task-items {
  padding: 16px;
}

.items-header {
  font-size: 14px;
  font-weight: 500;
  color: #6b7280;
  margin-bottom: 12px;
}

.items-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* 物品卡片 - 参照 popup.html 的 li 结构 */
.item-card {
  background: #f4f4f4;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s, box-shadow 0.2s;
  overflow: hidden;
}

.item-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

/* 物品信息区域 - 包含英文名和下方内容 */
.item-information {
  width: 100%;
}

/* 英文名称 - 独占一行，在最上方 */
.item-name-en {
  display: block;
  width: 100%;
  padding: 10px 12px;
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  color: #2c3e50;
  background: #f4f4f4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 下方内容区：图片 + 价格信息 + 按钮 */
.item-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 0 0 10px;
}

/* 物品图片 */
.item-image {
  flex-shrink: 0;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 10px;
}

.item-image img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

/* 价格信息区域 */
.item-prices {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 14px;
  overflow: hidden;
}

/* 中文名称 */
.item-name-zh {
  font-size: 13px;
  color: #666;
  margin: 0 0 4px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 价格行 */
.price-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: nowrap;
  white-space: nowrap;
  margin: 0;
  font-size: 14px;
}

/* 平台标签 */
.price-platform {
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.price-platform.buff {
  background: #ff6b35;
  color: white;
}

.price-platform.youyou {
  background: #8b5cf6;
  color: white;
}

.price-platform.market {
  background: #10b981;
  color: white;
}

/* 价格值 */
.price-value {
  color: #2c3e50;
  font-weight: 500;
}

/* 标签文字 - 利润等 */
.price-label {
  color: #27ae60;
  font-weight: 500;
  margin-left: 8px;
}

/* 利润 - 负数红色 */
.price-profit {
  font-weight: 500;
}

.price-profit.positive {
  color: #27ae60;
}

.price-profit.negative {
  color: #e74c3c;
}

/* 利润率 */
.price-rate {
  font-weight: 500;
}

.price-rate.positive {
  color: #27ae60;
}

.price-rate.negative {
  color: #e74c3c;
}

/* 最低价 */
.price-lowest {
  color: #3498db;
  font-weight: 500;
}

/* 底部汇总行 */
.summary-row {
  display: flex;
  align-items: center;
  gap: 16px;
}

/* 成本价 */
.price-cost {
  color: #e74c3c;
  font-weight: 500;
}

/* 更新时间 */
.update-time {
  color: #95a5a6;
  font-size: 12px;
  margin-left: auto;
}

/* 操作按钮区域 - 参照 popup.html 的 editAndRemove */
.item-actions {
  display: flex;
  flex-direction: column;
  width: 45px;
  height: 100%;
  flex-shrink: 0;
}

.item-btn {
  border: none;
  width: 45px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
  padding: 0;
  margin: 0;
}

.item-btn.edit {
  background-color: #f17b1b;
  color: white;
  height: 40px;
  border-radius: 0;
}

.item-btn.edit:hover {
  background-color: #a55310;
}

.item-btn.cancel {
  background: #e74c3c;
  color: white;
  height: 60px;
  border-radius: 0;
}

.item-btn.cancel:hover {
  background-color: #c0392b;
}

/* ===== 无物品提示 ===== */
.task-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 24px;
  color: #6b7280;
  font-size: 14px;
}

/* ===== 无任务提示 ===== */
.no-tasks {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.no-tasks p {
  color: #6b7280;
  margin-bottom: 16px;
}

/* ===== 日志 ===== */
.logs-container {
  flex: 1;
  overflow: hidden;
  padding: 16px;
}

.logs-list {
  height: 100%;
  overflow-y: auto;
  background: #1e1e1e;
  border-radius: 8px;
  padding: 12px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
}

.log-item {
  display: flex;
  gap: 12px;
  padding: 6px 0;
  color: #d4d4d4;
}

.log-time {
  color: #808080;
  min-width: 100px;
}

.log-level {
  min-width: 50px;
  font-weight: 600;
}

.log-info .log-level {
  color: #3b82f6;
}

.log-warn .log-level {
  color: #f59e0b;
}

.log-error .log-level {
  color: #ef4444;
}

.log-message {
  flex: 1;
}

/* ===== 模态框 ===== */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.close-btn {
  padding: 4px;
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #f3f4f6;
  color: #1f2937;
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
  max-height: calc(90vh - 160px);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
}

/* ===== 表单 ===== */
.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 8px;
}

.form-input {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  color: #1f2937;
  transition: all 0.2s;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-input::placeholder {
  color: #9ca3af;
}

.input-with-unit {
  display: flex;
  align-items: center;
  gap: 8px;
}

.input-with-unit .form-input {
  flex: 1;
}

.input-unit {
  font-size: 14px;
  color: #6b7280;
  white-space: nowrap;
}

.form-hint {
  font-size: 12px;
  color: #6b7280;
  margin-top: 6px;
}

/* ===== 开关 ===== */
.switch-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.switch {
  position: relative;
  display: inline-block;
  width: 48px;
  height: 26px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #d1d5db;
  transition: 0.3s;
  border-radius: 26px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 20px;
  width: 20px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.3s;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

input:checked + .slider {
  background-color: #3b82f6;
}

input:checked + .slider:before {
  transform: translateX(22px);
}

/* ===== 响应式 ===== */
@media (max-width: 768px) {
  .task-params {
    grid-template-columns: repeat(2, 1fr);
  }

  .item-card {
    flex-direction: column;
  }

  .item-image {
    width: 100%;
    height: 120px;
  }

  .item-actions {
    flex-direction: row;
  }
}
</style>
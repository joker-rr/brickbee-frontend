<script setup lang="ts">
import { ref } from 'vue'
import { BaseButton, BaseCard, BaseInput, BaseModal } from '@/components/base'
import { toast } from '@/utils/toast'

// Modal 状态
const showModal = ref(false)
const confirmLoading = ref(false)

// Input 示例
const inputValue = ref('')
const passwordValue = ref('')
const emailValue = ref('')
const inputError = ref('')

// 模拟确认操作
const handleConfirm = () => {
  confirmLoading.value = true
  setTimeout(() => {
    confirmLoading.value = false
    showModal.value = false
    toast.success('操作成功！')
  }, 2000)
}

// 测试按钮点击
const handleClick = (type: string) => {
  toast.info(`你点击了 ${type} 按钮`)
}

// 输入验证示例
const validateEmail = () => {
  if (emailValue.value && !emailValue.value.includes('@')) {
    inputError.value = '请输入有效的邮箱地址'
  } else {
    inputError.value = ''
  }
}
</script>

<template>
  <div class="demo-page">
    <div class="demo-container">
      <h1 class="page-title">基础组件库演示</h1>

      <!-- Button 组件演示 -->
      <BaseCard class="demo-section">
        <template #header>
          <h2>Button 按钮组件</h2>
        </template>

        <div class="demo-block">
          <h3>基础按钮</h3>
          <div class="button-group">
            <BaseButton type="primary" @click="handleClick('primary')">Primary</BaseButton>
            <BaseButton type="success" @click="handleClick('success')">Success</BaseButton>
            <BaseButton type="warning" @click="handleClick('warning')">Warning</BaseButton>
            <BaseButton type="danger" @click="handleClick('danger')">Danger</BaseButton>
            <BaseButton type="info" @click="handleClick('info')">Info</BaseButton>
            <BaseButton type="secondary" @click="handleClick('secondary')">Secondary</BaseButton>
          </div>
        </div>

        <div class="demo-block">
          <h3>朴素按钮</h3>
          <div class="button-group">
            <BaseButton type="primary" plain>Primary</BaseButton>
            <BaseButton type="success" plain>Success</BaseButton>
            <BaseButton type="warning" plain>Warning</BaseButton>
            <BaseButton type="danger" plain>Danger</BaseButton>
          </div>
        </div>

        <div class="demo-block">
          <h3>圆角按钮</h3>
          <div class="button-group">
            <BaseButton type="primary" round>Primary</BaseButton>
            <BaseButton type="success" round>Success</BaseButton>
            <BaseButton type="warning" round>Warning</BaseButton>
          </div>
        </div>

        <div class="demo-block">
          <h3>不同尺寸</h3>
          <div class="button-group">
            <BaseButton type="primary" size="small">Small</BaseButton>
            <BaseButton type="primary" size="medium">Medium</BaseButton>
            <BaseButton type="primary" size="large">Large</BaseButton>
          </div>
        </div>

        <div class="demo-block">
          <h3>图标按钮</h3>
          <div class="button-group">
            <BaseButton type="primary" icon="🔍">搜索</BaseButton>
            <BaseButton type="success" icon="✓">确认</BaseButton>
            <BaseButton type="danger" icon="✕">删除</BaseButton>
          </div>
        </div>

        <div class="demo-block">
          <h3>加载 & 禁用状态</h3>
          <div class="button-group">
            <BaseButton type="primary" loading>Loading</BaseButton>
            <BaseButton type="primary" disabled>Disabled</BaseButton>
          </div>
        </div>

        <div class="demo-block">
          <h3>块级按钮</h3>
          <BaseButton type="primary" block>Block Button</BaseButton>
        </div>
      </BaseCard>

      <!-- Card 组件演示 -->
      <BaseCard class="demo-section">
        <template #header>
          <h2>Card 卡片组件</h2>
        </template>

        <div class="demo-block">
          <h3>基础卡片</h3>
          <div class="card-grid">
            <BaseCard shadow="always">
              <template #header>Always Shadow</template>
              这是一个始终显示阴影的卡片
            </BaseCard>

            <BaseCard shadow="hover">
              <template #header>Hover Shadow</template>
              鼠标悬浮时显示阴影
            </BaseCard>

            <BaseCard shadow="never" bordered>
              <template #header>No Shadow</template>
              没有阴影，但有边框
            </BaseCard>
          </div>
        </div>

        <div class="demo-block">
          <h3>可悬浮卡片</h3>
          <div class="card-grid">
            <BaseCard hoverable shadow="hover">
              <template #header>可点击卡片 1</template>
              悬浮时会有缩放效果
              <template #footer>底部信息</template>
            </BaseCard>

            <BaseCard hoverable shadow="hover">
              <template #header>可点击卡片 2</template>
              这是卡片内容
              <template #footer>2024-01-01</template>
            </BaseCard>
          </div>
        </div>
      </BaseCard>

      <!-- Input 组件演示 -->
      <BaseCard class="demo-section">
        <template #header>
          <h2>Input 输入框组件</h2>
        </template>

        <div class="demo-block">
          <h3>基础输入框</h3>
          <div class="input-grid">
            <BaseInput v-model="inputValue" placeholder="请输入内容" />
            <BaseInput v-model="inputValue" placeholder="小尺寸" size="small" />
            <BaseInput v-model="inputValue" placeholder="大尺寸" size="large" />
          </div>
        </div>

        <div class="demo-block">
          <h3>可清空输入框</h3>
          <BaseInput v-model="inputValue" placeholder="可清空" clearable />
        </div>

        <div class="demo-block">
          <h3>密码输入框</h3>
          <BaseInput v-model="passwordValue" type="password" placeholder="请输入密码" show-password />
        </div>

        <div class="demo-block">
          <h3>带图标输入框</h3>
          <div class="input-grid">
            <BaseInput v-model="inputValue" placeholder="前缀图标" prefix="🔍" />
            <BaseInput v-model="inputValue" placeholder="后缀图标" suffix="📧" />
          </div>
        </div>

        <div class="demo-block">
          <h3>错误状态</h3>
          <BaseInput
            v-model="emailValue"
            type="email"
            placeholder="请输入邮箱"
            :error="inputError"
            @blur="validateEmail"
          />
        </div>

        <div class="demo-block">
          <h3>禁用状态</h3>
          <BaseInput v-model="inputValue" placeholder="禁用状态" disabled />
        </div>
      </BaseCard>

      <!-- Modal 组件演示 -->
      <BaseCard class="demo-section">
        <template #header>
          <h2>Modal 模态框组件</h2>
        </template>

        <div class="demo-block">
          <BaseButton type="primary" @click="showModal = true">打开模态框</BaseButton>

          <BaseModal
            v-model="showModal"
            title="这是一个模态框"
            :confirm-loading="confirmLoading"
            @confirm="handleConfirm"
            @cancel="showModal = false"
          >
            <p>这是模态框的内容</p>
            <p>你可以在这里放置任何内容</p>
            <p>点击确定按钮会触发 2 秒的加载状态</p>
          </BaseModal>
        </div>
      </BaseCard>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.demo-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 40px 20px;
}

.demo-container {
  max-width: 1200px;
  margin: 0 auto;
}

.page-title {
  font-size: 32px;
  font-weight: bold;
  color: #333;
  margin-bottom: 32px;
  text-align: center;
}

.demo-section {
  margin-bottom: 32px;

  h2 {
    font-size: 24px;
    font-weight: 600;
    color: #333;
    margin: 0;
  }
}

.demo-block {
  margin-bottom: 32px;

  &:last-child {
    margin-bottom: 0;
  }

  h3 {
    font-size: 16px;
    font-weight: 600;
    color: #666;
    margin-bottom: 16px;
  }
}

.button-group {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.input-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

@media (max-width: 768px) {
  .page-title {
    font-size: 24px;
  }

  .button-group {
    flex-direction: column;
  }

  .card-grid,
  .input-grid {
    grid-template-columns: 1fr;
  }
}
</style>

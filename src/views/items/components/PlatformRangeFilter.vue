<script setup lang="ts">
import { ref, computed, watch, type PropType } from 'vue'
// import { array, object } from 'zod'

// --------------------------------------------------------------------------
// 类型定义
// --------------------------------------------------------------------------

interface PlatformOption {
  id: string
  label: string
}

interface FilterCategory {
  id: string
  label: string
  platforms: PlatformOption[]
}

interface RangeValue {
  min: number | null
  max: number | null
}

interface FilterState {
  categoryId: string
  platformId: string
  range: RangeValue
}

// --------------------------------------------------------------------------
// Props & Emits
// --------------------------------------------------------------------------
const { platformRangeFilters } = defineProps({
  platformRangeFilters: {
    type: Array as PropType<FilterState[]>,
    default: () => []
  }
})

const emit = defineEmits<{
  'update:platformRangeFilters': [value: FilterState[]]
}>()


// --------------------------------------------------------------------------
// 筛选类别配置
// --------------------------------------------------------------------------

const filterCategories: FilterCategory[] = [
  {
    id: 'buyPrice',
    label: '在售平台价格',
    platforms: [
      { id: 'min', label: '最低价格平台' },
      { id: 'buff', label: 'BUFF' },
      { id: 'c5', label: 'C5' },
      { id: 'youpin', label: '悠悠有品' },
    ]
  },
  {
    id: 'sellPrice',
    label: '出售平台价格',
    platforms: [
      { id: 'market', label: 'MARKET' },
      { id: 'csgobuy', label: 'CSGOBUY' },
    ]
  },
  {
    id: 'sellWeeklySales',
    label: '出售平台周销量',
    platforms: [
      { id: 'market', label: 'MARKET' },
      { id: 'csgobuy', label: 'CSGOBUY' },
    ]
  },
  {
    id: 'sellProfit',
    label: '出售平台利润',
    platforms: [
      { id: 'market', label: 'MARKET' },
      { id: 'csgobuy', label: 'CSGOBUY' },
    ]
  },
  {
    id: 'sellProfitRate',
    label: '出售平台利润率',
    platforms: [
      { id: 'market', label: 'MARKET' },
      { id: 'csgobuy', label: 'CSGOBUY' },
    ]
  },

  {
    id: 'sellQuantity',
    label: '出售平台在售数量',
    platforms: [
      { id: 'market', label: 'MARKET' },
      { id: 'csgobuy', label: 'CSGOBUY' },
    ]
  },
]

// --------------------------------------------------------------------------
// 状态
// --------------------------------------------------------------------------

// 每个类别的选中平台
const selectedPlatforms = ref<Record<string, string>>(
  platformRangeFilters.reduce((acc: Record<string, string>, item: FilterState) => {
    acc[item.categoryId] = item.platformId
    return acc
  }, {} as Record<string, string>)
)

// 每个类别+平台的区间值
const rangeValues = ref<Record<string, RangeValue>>(
  platformRangeFilters.reduce((acc: Record<string, RangeValue>, item: FilterState) => {
    acc[`${item.categoryId}_${item.platformId}`] = item.range
    return acc
  }, {} as Record<string, RangeValue>)

)

// 展开的类别
const expandedCategories = ref<Set<string>>(new Set(

  platformRangeFilters.map((item: FilterState) => item.categoryId)



))


// 滑块范围配置（根据类别不同设置不同范围）
const sliderConfigs: Record<string, { min: number; max: number; step: number }> = {
  buyPrice: { min: 0, max: 100000, step: 100 },       // 价格范围 0-10000
  sellPrice: { min: 0, max: 100000, step: 100 },      // 价格范围 0-10000
  sellProfit: { min: -10000, max: 10000, step: 10 }, // 利润范围 -1000 到 10000（可能亏损）
  sellQuantity: { min: 0, max: 10000, step: 100 },   // 数量范围 0-10000
  sellProfitRate: { min: -1, max: 1, step: 0.01 }, // 利润率范围 1%-10000%
  sellWeeklySales: { min: 0, max: 4000, step: 10 } // 周销量范围 0-10000
}

// 获取某个类别的滑块配置
const getSliderConfig = (categoryId: string) => {
  return sliderConfigs[categoryId] || { min: 0, max: 10000, step: 1 }
}

// --------------------------------------------------------------------------
// 计算属性
// --------------------------------------------------------------------------

// 获取某个类别的当前范围键
const getRangeKey = (categoryId: string, platformId: string) => {
  return `${categoryId}_${platformId}`
}

// 获取当前区间值
const getCurrentRange = (categoryId: string): RangeValue => {
  const platformId = selectedPlatforms.value[categoryId]
  if (!platformId) return { min: null, max: null }
  const key = getRangeKey(categoryId, platformId)
  return rangeValues.value[key] || { min: null, max: null }
}


// 计算滑块左侧位置百分比
const getLeftPercent = (categoryId: string) => {
  const range = getCurrentRange(categoryId)
  const config = getSliderConfig(categoryId)
  const min = range.min ?? config.min

  if (min < config.min) return 0
  return ((min - config.min) / (config.max - config.min)) * 100
}

// 计算滑块右侧位置百分比
const getRightPercent = (categoryId: string) => {
  const range = getCurrentRange(categoryId)
  const config = getSliderConfig(categoryId)
  const max = range.max ?? config.max

  if (max > config.max) return ((config.max - config.min) / (config.max - config.min)) * 100
  return ((max - config.min) / (config.max - config.min)) * 100
}

// --------------------------------------------------------------------------
// 方法
// --------------------------------------------------------------------------



// 选择平台
const selectPlatform = (categoryId: string, platformId: string) => {
  const oldPlatformId = selectedPlatforms.value[categoryId]

  // 如果切换了平台，重置区间值
  if (oldPlatformId !== platformId) {
    selectedPlatforms.value[categoryId] = platformId
    const key = getRangeKey(categoryId, platformId)
    if (!rangeValues.value[key]) {
      rangeValues.value[key] = { min: null, max: null }
    }
  }

  // 确保类别展开
  expandedCategories.value.add(categoryId)

  emitFilterChange()
}



// 处理滑块拖动
const handleSliderInput = (categoryId: string, type: 'min' | 'max', event: Event) => {

  const target = event.target as HTMLInputElement

  if (!target.value) return

  const value = !isNaN(Number(target.value)) ? Number(target.value) : null

  const platformId = selectedPlatforms.value[categoryId]
  if (!platformId) return


  const key = getRangeKey(categoryId, platformId)
  if (!rangeValues.value[key]) {
    rangeValues.value[key] = { min: null, max: null }
  }


  const config = getSliderConfig(categoryId)
  if (value === config.min || value === config.max) {

    rangeValues.value[key][type] = null
    return
  }

  rangeValues.value[key][type] = value


  // 确保 min <= max
  const range = rangeValues.value[key]
  if (range.min !== null && range.max !== null && range.min > range.max) {
    if (type === 'min') {
      range.max = range.min
    } else {
      range.min = range.max
    }
  }

}




// 处理输入框变化
// const handleInputChange = (categoryId: string, type: 'min' | 'max', event: Event) => {
//   const target = event.target as HTMLInputElement
//   const value = target.value === '' ? null : Number(target.value)

//   if (!target.value) return

//   const value = !isNaN(Number(target.value)) ? Number(target.value) : null

//   const platformId = selectedPlatforms.value[categoryId]
//   if (!platformId) return

//   const key = getRangeKey(categoryId, platformId)
//   if (!rangeValues.value[key]) {
//     rangeValues.value[key] = { min: null, max: null }
//   }
//   rangeValues.value[key][type] = value


//   // 确保 min <= max
//   const range = rangeValues.value[key]
//   if (range.min !== null && range.max !== null && range.min > range.max) {
//     if (type === 'min') {
//       range.max = range.min
//     } else {
//       range.min = range.max
//     }
//   }



// }

// 重置某个类别的区间
const resetCategoryRange = (categoryId: string) => {
  const platformId = selectedPlatforms.value[categoryId]
  if (!platformId) return

  const key = getRangeKey(categoryId, platformId)
  rangeValues.value[key] = { min: null, max: null }

  emitFilterChange()
}

// 重置全部
const resetAll = () => {
  selectedPlatforms.value = {}
  rangeValues.value = {}
  expandedCategories.value.clear()
  emitFilterChange()
}

// 发送筛选变化事件
const emitFilterChange = () => {
  const filters: FilterState[] = []

  for (const categoryId of Object.keys(selectedPlatforms.value)) {
    const platformId = selectedPlatforms.value[categoryId]
    if (!platformId) continue

    const key = getRangeKey(categoryId, platformId)
    const range = rangeValues.value[key] || { min: null, max: null }

    // 只有当有实际范围值时才添加
    if (range.min !== null || range.max !== null) {
      filters.push({
        categoryId,
        platformId,
        range
      })
    }
  }

  emit('update:platformRangeFilters', filters)
}

// 获取输入框的实际值
const getInputValue = (categoryId: string, type: 'min' | 'max'): string => {
  const range = getCurrentRange(categoryId)
  // const config = getSliderConfig(categoryId)
  const value = range[type]
  if (value === null) return ''
  return value.toString()
}

// 获取滑块的实际值
const getSliderValue = (categoryId: string, type: 'min' | 'max'): number => {
  const range = getCurrentRange(categoryId)
  const config = getSliderConfig(categoryId)
  const value = range[type]
  if (value === null) {
    return type === 'min' ? config.min : config.max
  } else {

    if (value < config.min) {
      return config.min  // 或者不更新

    }
    if (value > config.max) {
      return config.max  // 或者不更新

    }

  }
  return value
}

defineExpose({
  resetAll
})

</script>

<template>
  <div class="platform-range-filter">
    <div class="filter-header">
      <h4 class="filter-title">平台区间筛选</h4>
      <button v-if="Object.keys(selectedPlatforms).length > 0" class="reset-all-btn" @click="resetAll">
        全部重置
      </button>
    </div>

    <div class="categories-container">
      <div v-for="category in filterCategories" :key="category.id" class="category-item"
        :class="{ expanded: expandedCategories.has(category.id) }">
        <!-- 类别头部：下拉选择 -->
        <div class="category-header">
          <div class="category-label">{{ category.label }}</div>
          <select class="platform-select" :value="selectedPlatforms[category.id] || ''"
            @change="selectPlatform(category.id, ($event.target as HTMLSelectElement).value)">
            <option value="" disabled>选择平台</option>
            <option v-for="platform in category.platforms" :key="platform.id" :value="platform.id">
              {{ platform.label }}
            </option>
          </select>
        </div>

        <!-- 区间滑块（选择平台后显示） -->
        <Transition name="expand">
          <div v-if="selectedPlatforms[category.id] && expandedCategories.has(category.id)"
            class="range-slider-container">
            <!-- 范围显示 -->
            <!-- <div class="range-display">
              <span class="range-value min">{{ getMinDisplayText(category.id) }}</span>
              <span class="range-separator">~</span>
              <span class="range-value max">{{ getMaxDisplayText(category.id) }}</span>
            </div> -->

            <!-- 双端点滑块 -->
            <div class="slider-track-container">
              <div class="slider-track">
                <div class="slider-range" :style="{
                  left: getLeftPercent(category.id) + '%',
                  width: (getRightPercent(category.id) - getLeftPercent(category.id)) + '%'
                }"></div>
              </div>
              <input type="range" class="slider-input slider-min" :min="getSliderConfig(category.id).min"
                :max="getSliderConfig(category.id).max" :step="getSliderConfig(category.id).step"
                :value="getSliderValue(category.id, 'min')" @input="handleSliderInput(category.id, 'min', $event)"
                @mouseup="emitFilterChange()" />
              <input type="range" class="slider-input slider-max" :min="getSliderConfig(category.id).min"
                :max="getSliderConfig(category.id).max" :step="getSliderConfig(category.id).step"
                :value="getSliderValue(category.id, 'max')" @input="handleSliderInput(category.id, 'max', $event)"
                @mouseup="emitFilterChange()" />
            </div>

            <!-- 数值输入框 -->
            <div class="input-row">
              <div class="input-group">
                <label>最小值</label>

                <input type="number" class="range-input" placeholder="-∞" :value="getInputValue(category.id, 'min')"
                  @blur="handleSliderInput(category.id, 'min', $event)"
                  @keyup.enter="($event.target as HTMLInputElement).blur()" />
              </div>
              <div class="input-group">
                <label>最大值</label>
                <input type="number" class="range-input" placeholder="+∞" :value="getInputValue(category.id, 'max')"
                  @blur="handleSliderInput(category.id, 'max', $event), emitFilterChange()"
                  @keyup.enter="($event.target as HTMLInputElement).blur(), emitFilterChange()" />
              </div>
            </div>

            <!-- 重置按钮 -->
            <button class="reset-btn" @click="resetCategoryRange(category.id)">
              重置
            </button>
          </div>
        </Transition>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.platform-range-filter {
  // CSS 变量定义
  --filter-title-size: 16px;
  --category-label-size: 14px;
  --select-height: 32px;
  --select-font-size: 13px;
  --input-height: 32px;
  --input-font-size: 13px;
  --btn-font-size: 13px;
  --category-padding: 12px;
  --gap-size: 12px;
  --slider-thumb-size: 16px;

  margin-bottom: 24px;
  background: #fafafa;
}

.filter-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.filter-title {
  margin: 0;
  font-size: var(--filter-title-size);
  font-weight: 600;
  color: #333;
}

.reset-all-btn {
  padding: 6px 12px;
  background: transparent;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  color: #666;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: #667eea;
    color: #667eea;
  }
}

.categories-container {
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: 16px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.category-item {
  padding: var(--category-padding);
  background: #fafafa;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  transition: all 0.2s;

  &.expanded {
    border-color: #667eea;
    background: #f8f9ff;
  }
}

.category-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--gap-size);
}

.category-label {
  font-size: var(--category-label-size);
  font-weight: 500;
  color: #333;
  white-space: nowrap;
}

.platform-select {
  flex: 1;
  max-width: 140px;
  height: var(--select-height);
  padding: 0 8px;
  background: #fff;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: var(--select-font-size);
  color: #333;
  cursor: pointer;
  outline: none;
  transition: all 0.2s;

  &:hover {
    border-color: #667eea;
  }

  &:focus {
    border-color: #667eea;
    box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
  }
}

.range-slider-container {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e8e8e8;
}

.range-display {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 12px;
  font-size: 14px;
  color: #333;
}

.range-value {
  min-width: 40px;
  padding: 4px 8px;
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  text-align: center;

  &.min {
    color: #667eea;
  }

  &.max {
    color: #764ba2;
  }
}

.range-separator {
  color: #999;
}

.slider-track-container {
  position: relative;
  height: 20px;
  margin: 16px 0;
}

.slider-track {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 4px;
  transform: translateY(-50%);
  background: #e0e0e0;
  border-radius: 2px;
}

.slider-range {
  position: absolute;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 2px;
}

.slider-input {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  background: transparent;
  pointer-events: none;
  -webkit-appearance: none;
  appearance: none;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 16px;
    height: 16px;
    background: #fff;
    border: 2px solid #667eea;
    border-radius: 50%;
    cursor: pointer;
    pointer-events: auto;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    transition: all 0.2s;

    &:hover {
      transform: scale(1.1);
      box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
    }
  }

  &::-moz-range-thumb {
    width: 16px;
    height: 16px;
    background: #fff;
    border: 2px solid #667eea;
    border-radius: 50%;
    cursor: pointer;
    pointer-events: auto;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  &.slider-max::-webkit-slider-thumb {
    border-color: #764ba2;
  }

  &.slider-max::-moz-range-thumb {
    border-color: #764ba2;
  }
}

.input-row {
  display: flex;
  gap: var(--gap-size);
  margin-bottom: 12px;
}

.input-group {
  flex: 1;

  label {
    display: block;
    margin-bottom: 4px;
    font-size: 12px;
    color: #666;
  }
}

.range-input {
  width: 100%;
  height: var(--input-height);
  padding: 0 8px;
  background: #fff;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: var(--input-font-size);
  color: #333;
  outline: none;
  transition: all 0.2s;

  &:hover {
    border-color: #667eea;
  }

  &:focus {
    border-color: #667eea;
    box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
  }

  &::placeholder {
    color: #bfbfbf;
  }

  /* 隐藏数字输入框的上下箭头 */
  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }


}

.reset-btn {
  width: 100%;
  height: var(--input-height);
  background: #f5f5f5;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  color: #666;
  font-size: var(--btn-font-size);
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #e8e8e8;
    border-color: #d0d0d0;
  }
}

// 展开动画
.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  max-height: 0;
  margin-top: 0;
  padding-top: 0;
}

.expand-enter-to,
.expand-leave-from {
  opacity: 1;
  max-height: 300px;
}

// --------------------------------------------------------------------------
// 响应式设计
// --------------------------------------------------------------------------

// 小屏幕 (≤ 480px)
@media (max-width: 480px) {
  .platform-range-filter {
    --filter-title-size: 14px;
    --category-label-size: 13px;
    --select-height: 28px;
    --select-font-size: 12px;
    --input-height: 28px;
    --input-font-size: 12px;
    --btn-font-size: 12px;
    --category-padding: 10px;
    --gap-size: 10px;
    --slider-thumb-size: 14px;
  }

  .filter-header {
    margin-bottom: 12px;
  }

  .reset-all-btn {
    padding: 4px 10px;
    font-size: 11px;
  }

  .categories-container {
    gap: 12px;
  }

  .range-slider-container {
    margin-top: 12px;
    padding-top: 12px;
  }

  .slider-track-container {
    margin: 12px 0;
  }

  .input-group label {
    font-size: 11px;
  }
}

// 超小屏幕 (≤ 410px)
@media (max-width: 410px) {
  .platform-range-filter {
    --filter-title-size: 13px;
    --category-label-size: 12px;
    --select-height: 26px;
    --select-font-size: 11px;
    --input-height: 26px;
    --input-font-size: 11px;
    --btn-font-size: 11px;
    --category-padding: 8px;
    --gap-size: 8px;
    --slider-thumb-size: 12px;
  }

  .filter-header {
    margin-bottom: 10px;
  }

  .reset-all-btn {
    padding: 3px 8px;
    font-size: 10px;
  }

  .categories-container {
    gap: 10px;
  }

  .range-slider-container {
    margin-top: 10px;
    padding-top: 10px;
  }

  .slider-track-container {
    margin: 10px 0;
    height: 16px;
  }

  .slider-track {
    height: 3px;
  }

  .input-group label {
    font-size: 10px;
    margin-bottom: 2px;
  }
}

// 极小屏幕 (≤ 360px)
@media (max-width: 360px) {
  .platform-range-filter {
    --filter-title-size: 12px;
    --category-label-size: 11px;
    --select-height: 24px;
    --select-font-size: 10px;
    --input-height: 24px;
    --input-font-size: 10px;
    --btn-font-size: 10px;
    --category-padding: 6px;
    --gap-size: 6px;
  }

  .platform-select {
    max-width: 100px;
  }
}
</style>
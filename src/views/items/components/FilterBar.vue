<script setup lang="ts">
import { ref, computed } from 'vue'
import type { FilterOption } from '@/api'
import PlatformRangeFilter from './PlatformRangeFilter.vue'

// --------------------------------------------------------------------------
// Props & Emits
// --------------------------------------------------------------------------

interface Props {
  /** 当前已激活的筛选项 */
  activeFilters?: FilterOption[]
}

const props = withDefaults(defineProps<Props>(), {
  activeFilters: () => [],
})

const emit = defineEmits<{
  'filter-change': [filters: FilterOption[]]
  'search': [keyword: string]
}>()

// --------------------------------------------------------------------------
// 状态
// --------------------------------------------------------------------------

const searchValue = ref('')
const showDrawer = ref(false)
const activeFilterCategory = ref('seo') // 当前选中的筛选类别，默认为枪械
const showMaxTip = ref(false) // 显示最大选择数量提示

// 计算属性：获取当前选中类别的内容
const currentCategoryContent = computed(() => {
  return optionsContent[activeFilterCategory.value as keyof typeof optionsContent] || null
})

// --------------------------------------------------------------------------
// 筛选配置：定义每个类别的选择模式和最大选择数量
// --------------------------------------------------------------------------
const MAX_MULTIPLE_SELECTION = 5 // 多选模式最多选择数量

const filterConfig: Record<string, { mode: 'single' | 'multiple' }> = {
  seo: { mode: 'multiple' },              // 枪械：多选
  rarity: { mode: 'multiple' },           // 品质：多选
  slot: { mode: 'multiple' },             // 类别：多选
  quality: { mode: 'multiple' },          // 外观：多选
  sorting: { mode: 'single' },            // 排序：单选
  showAllBuyPlantform: { mode: 'single' },  // 购买平台：单选
  showAllSellPlantform: { mode: 'single' }, // 出售平台：单选
  mySlot: { mode: 'single' },           // 我的筛选：单选
}



//先声明
/**
 * 存储平台区间筛选结果
 */
const platformRangeFilters = ref<Array<{
  categoryId: string
  platformId: string
  range: { min: number | null; max: number | null }
}>>([])





// 存储选中值（统一用数组）
const selectedFilters = ref<Record<string, any[]>>({
  seo: [],              // 枪械
  rarity: [],           // 品质
  slot: [],             // 类别
  quality: [],          // 外观
  sorting: [],          // 排序
  showAllBuyPlantform: [],  // 购买平台
  showAllSellPlantform: [], // 出售平台
  mySlot: [],           // 我的筛选     
  interzone: [],         // 价格区间
  search: [],            //搜索内容
})

// --------------------------------------------------------------------------
// 筛选选项配置
// --------------------------------------------------------------------------

interface DropdownOption {
  id: string
  label: string
  className?: string
  children?: DropdownOption[]
}

const optionsContent = {
  mySlot: {
    id: 'mySlot', label: '我的筛选', className: '', children: []
  },

  seo: {
    id: 'seo',
    label: '枪械',
    className: '',
    children: [
      {
        id: 'unlimited',
        label: '类型',
        className: '',
        children: [
          { id: 'unlimited', label: '不限', className: '' },
        ]
      },
      {
        id: 'Pistol',
        label: '手枪',
        className: '',
        children: [
          { id: 'Pistol-unlimited', label: '不限', className: '' },
          { id: 'CZ75-Auto', label: 'CZ75', className: '' },
          { id: 'Desert Eagle', label: '沙漠之鹰', className: '' },
          { id: 'Dual Berettas', label: '双持贝瑞塔', className: '' },
          { id: 'Five-SeveN', label: 'FN57', className: '' },
          { id: 'Glock-18', label: '格洛克 18 型', className: '' },
          { id: 'P2000', label: 'P2000', className: '' },
          { id: 'P250', label: 'P250', className: '' },
          { id: 'R8 Revolver', label: 'R8 左轮手枪', className: '' },
          { id: 'Tec-9', label: 'Tec-9', className: '' },
          { id: 'USP-S', label: 'USP 消音版', className: '' }
        ]
      },
      {
        id: 'Rifle',
        label: '步枪',
        className: '',
        children: [
          { id: 'Rifle-unlimited', label: '不限', className: '' },
          { id: 'AWP', label: 'AWP', className: '' },
          { id: 'AK-47', label: 'AK-47', className: '' },
          { id: 'M4A1-S', label: 'M4A1 消音型', className: '' },
          { id: 'M4A4', label: 'M4A4', className: '' },
          { id: 'SSG 08', label: 'SSG 08', className: '' },
          { id: 'FAMAS', label: '法玛斯', className: '' },
          { id: 'Galil AR', label: '加利尔 AR', className: '' },
          { id: 'AUG', label: 'AUG', className: '' },
          { id: 'SG 553', label: 'SG553', className: '' },
          { id: 'G3SG1', label: 'G3SG1', className: '' },
          { id: 'SCAR-20', label: 'SCAR-20', className: '' }
        ]
      },
      {
        id: 'SMG',
        label: '微型冲锋枪',
        className: '',
        children: [
          { id: 'SMG-unlimited', label: '不限', className: '' },
          { id: 'MAC-10', label: 'MAC-10', className: '' },
          { id: 'MP5-SD', label: 'MP5-SD', className: '' },
          { id: 'MP7', label: 'MP7', className: '' },
          { id: 'MP9', label: 'MP9', className: '' },
          { id: 'P90', label: 'P90', className: '' },
          { id: 'PP-Bizon', label: 'PP-野牛', className: '' },
          { id: 'UMP-45', label: 'UMP-45', className: '' }
        ]
      },
      {
        id: 'Machinegun',
        label: '机枪',
        className: '',
        children: [
          { id: 'Machinegun-unlimited', label: '不限', className: '' },
          { id: 'M249', label: 'M249', className: '' },
          { id: 'Negev', label: '内格夫', className: '' }
        ]
      },
      {
        id: 'Shotgun',
        label: '散弹枪',
        className: '',
        children: [
          { id: 'Shotgun-unlimited', label: '不限', className: '' },
          { id: 'MAG-7', label: 'MAG-7', className: '' },
          { id: 'Nova', label: '新星', className: '' },
          { id: 'Sawed-Off', label: '截短霰弹枪', className: '' },
          { id: 'XM1014', label: 'XM1014', className: '' }
        ]
      },
      {
        id: 'Knife',
        label: '匕首',
        className: '',
        children: [
          { id: 'Knife-unlimited', label: '不限', className: '' },
          { id: 'Bayonet', label: '刺刀', className: '' },
          { id: 'Bowie Knife', label: '鲍伊猎刀', className: '' },
          { id: 'Butterfly Knife', label: '蝴蝶刀', className: '' },
          { id: 'Classic Knife', label: '海豹短刀', className: '' },
          { id: 'Falchion Knife', label: '弯刀', className: '' },
          { id: 'Flip Knife', label: '折叠刀', className: '' },
          { id: 'Gut Knife', label: '穿肠刀', className: '' },
          { id: 'Huntsman Knife', label: '猎杀者匕首', className: '' },
          { id: 'Karambit', label: '爪子刀', className: '' },
          { id: 'Kukri Knife', label: '廓尔喀刀', className: '' },
          { id: 'M9 Bayonet', label: 'M9 刺刀', className: '' },
          { id: 'Navaja Knife', label: '折刀', className: '' },
          { id: 'Nomad Knife', label: '流浪者匕首', className: '' },
          { id: 'Paracord Knife', label: '系绳匕首', className: '' },
          { id: 'Shadow Daggers', label: '暗影双匕', className: '' },
          { id: 'Skeleton Knife', label: '骷髅匕首', className: '' },
          { id: 'Stiletto Knife', label: '短剑', className: '' },
          { id: 'Survival Knife', label: '求生匕首', className: '' },
          { id: 'Talon Knife', label: '锯齿爪刀', className: '' },
          { id: 'Ursus Knife', label: '熊刀', className: '' }
        ]
      },
      {
        id: 'Gloves',
        label: '手套',
        className: '',
        children: [
          { id: 'Gloves-unlimited', label: '不限', className: '' },
          { id: 'Bloodhound Gloves', label: '血猎手套', className: '' },
          { id: 'Broken Fang Gloves', label: '狂牙手套', className: '' },
          { id: 'Driver Gloves', label: '驾驶手套', className: '' },
          { id: 'Hand Wraps', label: '裹手', className: '' },
          { id: 'Hydra Gloves', label: '九头蛇手套', className: '' },
          { id: 'Moto Gloves', label: '摩托手套', className: '' },
          { id: 'Specialist Gloves', label: '专业手套', className: '' },
          { id: 'Sport Gloves', label: '运动手套', className: '' }
        ]
      },
      {
        id: 'Other',
        label: '其他',
        className: '',
        children: [
          // { id: 'Other-unlimited', label: '不限', className: '' },
          { id: 'Charm', label: '挂件', className: '' },
          { id: 'Agent', label: '探员', className: '' },
          { id: 'Key', label: '钥匙', className: '' },
          { id: 'Patch', label: '布章', className: '' },
          { id: 'Graffiti', label: '涂鸦', className: '' },
          { id: 'Music Kit', label: '音乐盒', className: '' },
          { id: 'Pass', label: '通行证', className: '' },
          { id: 'Equipment', label: '电击枪', className: '' },
          { id: 'Sticker', label: '印花', className: '' },
          { id: 'Container', label: '武器箱', className: '' },
          { id: 'Collectible', label: '胸章', className: '' },
          { id: 'Tag', label: '名称标签', className: '' },
          { id: 'Tool', label: '工具', className: '' }
        ]
      }
    ]
  },


  rarity: {
    id: 'rarity',
    label: '品质',
    className: '',
    children: [
      { id: 'unlimited', label: '不限', className: '' },
      { id: 'Contraband', label: '违禁', className: 'orange' },
      { id: 'Covert', label: '隐秘', className: 'orange' },
      { id: 'Classified', label: '保密', className: 'purple' },
      { id: 'Restricted', label: '受限', className: 'purple' },
      { id: 'Mil-Spec Grade', label: '军规级', className: 'blue' },
      { id: 'Industrial Grade', label: '工业级', className: 'blue' },
      { id: 'Consumer Grade', label: '消费级', className: 'gray' },
      { id: 'Superior', label: '非凡', className: 'pink' },
      { id: 'Remarkable', label: '卓越', className: 'red' },
      { id: 'Exotic', label: '奇异', className: 'gold' },
      { id: 'High Grade', label: '高级', className: 'orange' },
      { id: 'Base Grade', label: '普通级', className: 'gray' },
    ]
  },




  slot: {
    id: 'slot',
    label: '类别',
    className: '',
    children: [
      { id: 'unlimited', label: '不限', className: '' },
      { id: 'Normal', label: '普通', className: '' },
      { id: 'Souvenir', label: '纪念品', className: 'gold' },
      { id: 'StatTrak™', label: 'StatTrak™', className: 'orange' },
      { id: '★', label: '★', className: 'gold' },
      { id: '★ StatTrak™', label: '★ StatTrak™', className: 'purple' }

    ]
  },


  quality: {
    id: 'quality',
    label: '外观',
    className: '',
    children: [
      { id: 'unlimited', label: '不限', className: '' },
      { id: 'FN', label: '崭新出厂', className: 'green' },
      { id: 'MW', label: '略有磨损', className: 'green' },
      { id: 'FT', label: '久经沙场', className: 'orange' },
      { id: 'WW', label: '破损不堪', className: 'red' },
      { id: 'BS', label: '战痕累累', className: 'red' },
      { id: 'NULL', label: '无涂装', className: 'gray' }

    ]
  },

  interzone: {
    id: 'interzone',
    label: '区间',
    className: '',
    children: []
  },

  sorting: {
    id: 'sorting',
    label: '排序',
    className: '',
    children: [
      { id: 'MARKETpopularity', label: '(默认)MARKET周销量⬇', className: '' },
      { id: 'CSGOBUYpopularity', label: 'CSGOBUY周销量 ⬇', className: '' },
      { id: 'MARKETprofit', label: 'MARKET利润 ⬇', className: '' },
      { id: 'MARKETprofitRate', label: 'MARKET利润率 ⬇', className: '' },
      { id: 'custom', label: '自定义（暂未启用）', className: '' },

    ]
  },


  showAllBuyPlantform: {
    id: 'showAllBuyPlantform',
    label: '购买平台',
    className: '',
    children: [
      { id: 'show-min', label: '显示最低平台', className: '' },
      { id: 'show-buff', label: '总显示BUFF', className: '' },
      { id: 'show-youpin', label: '总显示悠悠有品', className: '' },
      { id: 'show-c5', label: '总显示C5GAME', className: '' },

    ]
  },


  showAllSellPlantform: {
    id: 'showAllSellPlantform',
    label: '出售平台',
    className: '',
    children: [
      { id: 'show-all', label: '显示全部出售平台', className: '' },
      { id: 'show-MARKET', label: '仅显示MARKET', className: '' },
      { id: 'show-CSGOBUY', label: '仅显示CSGOBUY', className: '' },
    ]
  },

}







// --------------------------------------------------------------------------
// 方法
// --------------------------------------------------------------------------



/**
 * 处理搜索
 */
const handleSearch = () => {
  if (!searchValue.value.trim()) return
  const isChinese = containsChinese(searchValue.value.trim())
  const textLanguage = isChinese ? 'Cn' : 'En'
  // 如果有搜索关键词，添加到筛选条件中


  selectedFilters.value.search = [textLanguage]

    // 让输入框失去焦点，收起键盘，恢复 iOS 视口
    ; (document.activeElement as HTMLElement)?.blur()

  handleConfirm()
};


// 判断中文或者英文
function containsChinese(str: string) {
  // 匹配中文字符的正则
  return /[\u4e00-\u9fa5]/.test(str);
}




/**
 * 统一的选择函数
 * 根据 filterConfig 中定义的模式处理单选/多选
 * 处理"不限"与其他选项的互斥逻辑
 */
const selectOption = (category: string, optionId: string) => {
  const config = filterConfig[category] || { mode: 'multiple' }
  const currentSelection = selectedFilters.value[category] || []

  // 判断是否是"不限"选项
  const isUnlimited = optionId === 'unlimited' || optionId.endsWith('-unlimited')

  // ========== 单选模式 ==========
  if (config.mode === 'single') {
    if (currentSelection.includes(optionId)) {
      // 点击已选中的 → 取消选择
      selectedFilters.value[category] = []
    } else {
      // 选择新的（替换）
      selectedFilters.value[category] = [optionId]
    }
    return
  }

  // ========== 多选模式 ==========

  // 情况A：点击的是"不限"
  if (isUnlimited) {
    if (currentSelection.includes(optionId)) {
      // 已选中 → 取消
      selectedFilters.value[category] = currentSelection.filter(id => id !== optionId)
    } else {
      // 未选中 → 清空同组，只保留这个"不限"
      if (optionId === 'unlimited') {
        // 顶级不限：清空全部，只留 unlimited
        selectedFilters.value[category] = ['unlimited']
      } else {
        // 子级不限（如 Pistol-unlimited）：只清空同组
        const prefix = optionId.replace('-unlimited', '') // 如 'Pistol'
        type OptionKey = 'seo'
        const groupItem = optionsContent[category as OptionKey].children
          .find(item => item.id === prefix)

        const ids = groupItem?.children.map(item => item.id)
        // 检查是否有 children
        // if (groupItem && 'children' in groupItem) {
        //   const ids = groupItem.children as Array<{ id: string; label: string; className: string }>
        //   .map(item => item.id)
        // }

        selectedFilters.value[category] = currentSelection
          .filter(id => {
            // 移除顶级不限
            if (id === 'unlimited') return false
            // 移除同组的选项（以相同前缀开头的）
            if (id.startsWith(prefix + '-') || id === prefix) return false
            // 检查是否是同组的非前缀选项（如 CZ75-Auto 属于 Pistol 组）
            if (ids && ids.includes(id)) return false
            // 这里需要根据数据结构判断，暂时保留其他组的选项
            return true
          })
          .concat(optionId)
      }
    }
    return
  }

  // 情况B：点击的是普通选项
  // 先移除相关的"不限"
  let newSelection = currentSelection.filter(id => {
    // 移除顶级不限
    if (id === 'unlimited') return false
    // 移除同组的子级不限
    // 需要判断当前选项属于哪个组
    const optionPrefix = getOptionGroup(optionId)
    if (optionPrefix && id === `${optionPrefix}-unlimited`) return false
    return true
  })

  // 添加或移除当前选项
  if (newSelection.includes(optionId)) {
    newSelection = newSelection.filter(id => id !== optionId)
  } else {
    // 检查是否超过最大选择数量
    if (newSelection.length >= MAX_MULTIPLE_SELECTION) {
      // 已达到上限，显示提示
      showMaxTip.value = true
      setTimeout(() => {
        showMaxTip.value = false
      }, 2000)
      return
    }
    newSelection.push(optionId)
  }

  selectedFilters.value[category] = newSelection
}

/**
 * 获取选项所属的组（用于判断子级不限）
 * 例如：CZ75-Auto -> Pistol, AWP -> Rifle
 */
const getOptionGroup = (optionId: string): string | null => {
  // 遍历 seo 的 children 找到选项所属的组
  const seoContent = optionsContent.seo
  for (const group of seoContent.children) {
    if (group.children) {
      const found = group.children.find(item => item.id === optionId)
      if (found) {
        return group.id
      }
    }
  }
  return null
}

/**
 * 检查选项是否被选中
 */
const isOptionSelected = (category: string, optionId: string): boolean => {
  return selectedFilters.value[category]?.includes(optionId) || false
}

/**
 * 重置筛选
 */
const handleReset = () => {
  Object.keys(selectedFilters.value).forEach(key => {
    selectedFilters.value[key] = []
  })

  // 重置平台区间筛选器状态
  platformRangeFilters.value = []
  platformFilterRef.value?.resetAll()
}

/**
 * 根据选项ID查找选项信息
 */
// const findOptionById = (category: string, optionId: string): { label: string; className: string } | null => {
//   const categoryContent = optionsContent[category as keyof typeof optionsContent]

//   if (!categoryContent) return null

//   // 对于 seo（枪械），需要遍历二级结构
//   if (category === 'seo') {
//     for (const group of categoryContent.children) {
//       // 检查是否是组本身
//       if (group.id === optionId) {
//         return { label: group.label, className: group.className || '' }
//       }
//       // 检查子选项（需要类型断言）
//       const groupWithChildren = group as DropdownOption
//       if (groupWithChildren.children) {
//         const found = groupWithChildren.children.find((item: DropdownOption) => item.id === optionId)
//         if (found) {
//           return { label: found.label, className: found.className || '' }
//         }
//       }
//     }
//     return null
//   }

//   return null
// }

/**
 * 确认筛选
 */
const handleConfirm = () => {

  // 转换为 FilterOption 格式
  const filters: FilterOption[] = []

  // 遍历所有类别的选中项
  Object.entries(selectedFilters.value).forEach(([category, selectedIds]) => {


    //单独调整搜索
    if (category === 'search') {
      // 只有当有搜索内容时才添加搜索 filter
      if (!selectedIds.length || !searchValue.value.trim()) {
        return
      }

      filters.push({
        filterId: category,
        optionIds: selectedIds,
        optionLabel: searchValue.value.trim(),
      })

      return
    }

    //单独调整价格区间的添加
    if (category === 'interzone') {
      if (!platformRangeFilters.value.length) return
      platformRangeFilters.value.forEach(zone => {

        filters.push({
          filterId: zone.categoryId,
          optionIds: [zone.platformId],
          zone: { ...zone.range }
        })

      })


      return
    }

    if (!selectedIds.length) return

    if (category === 'seo') {

      const options = selectedIds
        .filter(id => id.includes('-unlimited'))
        .map(id => id.replace('-unlimited', '')) //剩余 如 'Pistol'
      // .filter(id => id !== 'Other');
      const types = selectedIds.filter(id => !id.includes('-unlimited'))

      const groupItem = optionsContent[category as 'seo'].children
        .find(item => item.id === 'Other')
      const seoOtherIds = groupItem?.children.map(item => item.id)

      // 3. 分离 types 中属于 Other 和不属于 Other 的
      const otherTypeIds = types.filter(id => seoOtherIds?.includes(id))  // Other 分类的枪
      const normalTypeIds = types.filter(id => !seoOtherIds?.includes(id))  // 其他分类的枪

      if (otherTypeIds.length > 0) {
        options.push(...otherTypeIds)
      }

      // if (selectedIds.includes('Other') && seoOtherIds) options.push(...seoOtherIds)

      filters.push({
        filterId: category,
        optionIds: options,
        types: normalTypeIds
      })
      return
    }


    // 跳过空数组和"不限"选项
    if (selectedIds.includes('unlimited')) {
      return
    }

    filters.push({
      filterId: category,
      optionIds: selectedIds,
    })

  })





  emit('filter-change', filters)
  showDrawer.value = false
}


/**
 * 打开筛选抽屉
 */
const openDrawer = () => {
  showDrawer.value = true
}

/**
 * 关闭筛选抽屉
 */
const closeDrawer = () => {
  showDrawer.value = false
}

const platformFilterRef = ref<InstanceType<typeof PlatformRangeFilter> | null>(null)



</script>

<template>
  <div class="filter-bar">
    <!-- 搜索栏 -->
    <div class="search-container">
      <input v-model="searchValue" type="text" placeholder="搜索饰品名称" class="search-input" @keyup.enter="handleSearch" />
      <button class="search-btn" @click="handleSearch">
        🔍
      </button>
    </div>

    <!-- 筛选按钮 -->
    <button class="filter-trigger-btn" @click="openDrawer">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="4" y1="6" x2="20" y2="6"></line>
        <line x1="4" y1="12" x2="20" y2="12"></line>
        <line x1="4" y1="18" x2="20" y2="18"></line>
      </svg>
      <span>筛选</span>
    </button>

    <!-- 遮罩层 -->
    <Transition name="fade">
      <div v-if="showDrawer" class="drawer-overlay" @click="closeDrawer"></div>
    </Transition>

    <!-- 最大选择数量提示 -->
    <Transition name="tip-fade">
      <div v-if="showMaxTip" class="max-tip">
        最多只能选择 {{ MAX_MULTIPLE_SELECTION }} 个选项
      </div>
    </Transition>

    <!-- 右侧抽屉 - 白色背景 -->
    <Transition name="slide">
      <div v-if="showDrawer" class="filter-drawer">
        <!-- 抽屉头部 -->
        <div class="drawer-header">
          <h3>筛选</h3>
          <button class="close-btn" @click="closeDrawer">×</button>
        </div>

        <!-- 抽屉内容 -->
        <div class="drawer-content">


          <div class="options-content">
            <!-- 当前选中类别的内容 -->
            <template v-if="currentCategoryContent">
              <!-- 枪械类型：有二级分类结构 -->
              <template v-if="activeFilterCategory === 'seo'">
                <div v-for="weaponCategory in currentCategoryContent.children" :key="weaponCategory.id"
                  class="filter-section">
                  <h4 class="section-title">{{ weaponCategory.label }}</h4>
                  <div class="options-grid">
                    <div v-for="weaponItem in (weaponCategory as DropdownOption).children || []" :key="weaponItem.id"
                      class="option-item"
                      :class="[weaponItem.className, { active: isOptionSelected('seo', weaponItem.id) }]"
                      @click="selectOption('seo', weaponItem.id)">
                      {{ weaponItem.label }}
                    </div>
                  </div>
                </div>
              </template>

              <!-- 区间筛选：平台区间筛选器 -->
              <template v-else-if="activeFilterCategory === 'interzone'">
                <PlatformRangeFilter ref="platformFilterRef" v-model:platformRangeFilters="platformRangeFilters" />
              </template>

              <!-- 其他类别：扁平结构 -->
              <template v-else>
                <div class="filter-section">
                  <h4 class="section-title">{{ currentCategoryContent.label }}</h4>
                  <div class="options-grid">
                    <div v-for="optionItem in currentCategoryContent.children" :key="optionItem.id" class="option-item"
                      :class="[optionItem.className, { active: isOptionSelected(activeFilterCategory, optionItem.id) }]"
                      @click="selectOption(activeFilterCategory, optionItem.id)">
                      {{ optionItem.label }}
                    </div>
                  </div>
                </div>
              </template>
            </template>
          </div>


          <div class="filter-options">
            <div v-for="category in optionsContent" :key="category.id" class="options"
              :class="{ active: activeFilterCategory === category.id }" @click="activeFilterCategory = category.id">
              <span>{{ category.label }}</span>
            </div>
          </div>

        </div>

        <!-- 抽屉底部操作栏 -->
        <div class="drawer-footer">
          <button class="footer-btn secondary" @click="handleReset">重置</button>
          <button class="footer-btn primary" @click="handleConfirm">确定</button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style lang="scss" scoped>
// --------------------------------------------------------------------------
// CSS 变量定义
// --------------------------------------------------------------------------
.filter-drawer {
  // 抽屉整体变量
  --drawer-header-padding: 20px 24px;
  --drawer-header-title-size: 20px;
  --drawer-close-btn-size: 32px;
  --drawer-footer-padding: 20px 24px;
  --drawer-footer-btn-height: 44px;
  --drawer-footer-btn-font-size: 15px;

  // 侧边筛选选项变量
  --filter-options-width: 140px;
  --filter-options-padding-top: 20px;
  --filter-option-font-size: 15px;
  --filter-option-height: 56px;

  // 内容区域变量
  --content-padding: 20px 24px;
  --section-title-size: 16px;
  --section-margin-bottom: 32px;
  --options-grid-gap: 12px;
  --option-item-padding: 12px 16px;
  --option-item-font-size: 14px;
}

.filter-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

// --------------------------------------------------------------------------
// 搜索栏
// --------------------------------------------------------------------------

.search-container {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;

  .search-input {
    flex: 1;
    height: 40px;
    padding: 0 50px 0 16px;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    font-size: 16px; // 16px 防止 iOS 自动缩放
    outline: none;
    transition: all 0.2s;

    &:focus {
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    &::placeholder {
      color: #999;
    }
  }

  .search-btn {
    position: absolute;
    right: 0px;
    height: 100%;
    padding: 0 12px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: none;
    border-radius: 0 6px 6px 0;
    color: white;
    font-size: 16px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      transform: scale(1.05);
    }

    &:active {
      transform: scale(0.95);
    }
  }
}

// --------------------------------------------------------------------------
// 筛选按钮
// --------------------------------------------------------------------------

.filter-trigger-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 40px;
  padding: 0 16px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  color: #666;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;

  &:hover {
    border-color: #667eea;
    color: #667eea;
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(102, 126, 234, 0.15);
  }

  svg {
    width: 20px;
    height: 20px;
  }
}

// --------------------------------------------------------------------------
// 遮罩层
// --------------------------------------------------------------------------

.drawer-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 9998;
}

// 最大选择数量提示
.max-tip {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  padding: 12px 24px;
  background: rgba(0, 0, 0, 0.8);
  color: #fff;
  font-size: 14px;
  border-radius: 8px;
  z-index: 10001;
  white-space: nowrap;
}

.tip-fade-enter-active,
.tip-fade-leave-active {
  transition: opacity 0.3s;
}

.tip-fade-enter-from,
.tip-fade-leave-to {
  opacity: 0;
}

// --------------------------------------------------------------------------
// 抽屉 - 白色背景，类似 ItemCard
// --------------------------------------------------------------------------

.filter-drawer {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 90%;
  max-width: 600px;
  background: #ffffff;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  box-shadow: -4px 0 20px rgba(0, 0, 0, 0.15);
}

// 抽屉头部
.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--drawer-header-padding);
  border-bottom: 1px solid #e0e0e0;
  background: #fff;

  h3 {
    margin: 0;
    font-size: var(--drawer-header-title-size);
    font-weight: 600;
    color: #333;
  }

  .close-btn {
    width: var(--drawer-close-btn-size);
    height: var(--drawer-close-btn-size);
    padding: 0;
    background: transparent;
    border: none;
    border-radius: 6px;
    color: #666;
    font-size: var(--drawer-close-btn-size);
    line-height: 1;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background: #f5f5f5;
      color: #333;
    }
  }
}

// 抽屉内容
.drawer-content {
  flex: 1;
  display: flex;
  justify-content: space-between;
  overflow: hidden; // 改成 hidden，让子元素各自滚动
  padding-right: 0;
  background: #fafafa;


  /* 滚动条样式 */
  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f1f1;
  }

  &::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 4px;

    &:hover {
      background: #555;
    }
  }
}

.filter-options {
  width: var(--filter-options-width);

  padding: 0;
  padding-top: var(--filter-options-padding-top);
  overflow-y: auto;
  background-color: #e8e6e6;
  flex-shrink: 0;

  // 滚动条样式
  &::-webkit-scrollbar {
    width: 2px;
  }

  &::-webkit-scrollbar-thumb {
    background: #ccc;
    border-radius: 2px;
  }
}

.options {
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;

  span {
    position: relative;
    font-size: var(--filter-option-font-size);
    font-weight: 500;
    display: flex;
    justify-content: center;
    align-items: center;
    height: var(--filter-option-height);
    color: #666;
    transition: all 0.2s ease;
  }

  // 悬浮效果
  &:hover {
    background-color: #d9d7d7;

    span {
      color: #333;
    }
  }

  // 选中状态 - 与 options-content 背景匹配
  &.active {
    background-color: #fafafa;
    position: relative;

    span {
      color: #667eea;
      font-weight: 600;
    }

    // 左侧选中指示条
    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 3px;
      height: 24px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 0 2px 2px 0;
    }
  }

  // 分隔线 - 使用更柔和的颜色
  &:not(:last-child)::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 40%;
    height: 1px;
    background-color: #d0d0d0;
  }

  // 选中项不显示底部分隔线
  &.active::after {
    display: none;
  }
}

.options-content {
  flex: 1;
  overflow-y: auto;
  padding: var(--content-padding);

  // 滚动条样式
  &::-webkit-scrollbar {
    width: 3px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: #dddddd;
    border-radius: 3px;

    &:hover {
      background: #999;
    }
  }
}

// 筛选区块
.filter-section {
  margin-bottom: var(--section-margin-bottom);

  &:last-child {
    margin-bottom: 0;
  }

  .section-title {
    margin: 0 0 16px 0;
    font-size: var(--section-title-size);
    font-weight: 600;
    color: #333;
  }
}

// 选项网格
.options-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--options-grid-gap);

  &.single-column {
    grid-template-columns: 1fr;
  }
}

// 选项项 - 白色背景风格
.option-item {
  position: relative;
  padding: var(--option-item-padding);
  background: #ffffff;
  border: 1.5px solid #e0e0e0;
  border-radius: 8px;
  color: #666;
  font-size: var(--option-item-font-size);
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;

  &:hover {
    border-color: #667eea;
    background: #f8f9ff;
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(102, 126, 234, 0.1);
  }

  &.active {
    border-color: #667eea;
    background: rgba(102, 126, 234, 0.1);
    color: #667eea;
    font-weight: 600;
  }

  &.has-submenu {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-right: 12px;
  }

  // 颜色类 - 更明亮的配色
  &.orange {
    color: #ed8936;

    &.active {
      border-color: #ed8936;
      background: rgba(237, 137, 54, 0.1);
      color: #ed8936;
    }
  }

  &.purple {
    color: #9f7aea;

    &.active {
      border-color: #9f7aea;
      background: rgba(159, 122, 234, 0.1);
      color: #9f7aea;
    }
  }

  &.blue {
    color: #4299e1;

    &.active {
      border-color: #4299e1;
      background: rgba(66, 153, 225, 0.1);
      color: #4299e1;
    }
  }

  &.pink {
    color: #ed64a6;

    &.active {
      border-color: #ed64a6;
      background: rgba(237, 100, 166, 0.1);
      color: #ed64a6;
    }
  }

  &.red {
    color: #f56565;

    &.active {
      border-color: #f56565;
      background: rgba(245, 101, 101, 0.1);
      color: #f56565;
    }
  }

  &.gold {
    color: #ecc94b;

    &.active {
      border-color: #ecc94b;
      background: rgba(236, 201, 75, 0.1);
      color: #ecc94b;
    }
  }

  &.green {
    color: #48bb78;

    &.active {
      border-color: #48bb78;
      background: rgba(72, 187, 120, 0.1);
      color: #48bb78;
    }
  }

  &.gray {
    color: #718096;

    &.active {
      border-color: #718096;
      background: rgba(113, 128, 150, 0.1);
      color: #718096;
    }
  }

  .submenu-arrow {
    transition: transform 0.2s;
    flex-shrink: 0;

    &.expanded {
      transform: rotate(180deg);
    }
  }
}

// 二级菜单
.submenu {
  margin-top: 12px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

.submenu-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

// 抽屉底部
.drawer-footer {
  display: flex;
  gap: 12px;
  padding: var(--drawer-footer-padding);
  border-top: 1px solid #e0e0e0;
  background: #fff;
}

.footer-btn {
  flex: 1;
  height: var(--drawer-footer-btn-height);
  border: none;
  border-radius: 8px;
  font-size: var(--drawer-footer-btn-font-size);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &.secondary {
    background: #f5f5f5;
    color: #666;
    border: 1px solid #e0e0e0;

    &:hover {
      background: #e8e8e8;
      border-color: #d0d0d0;
    }
  }

  &.primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    }

    &:active {
      transform: translateY(0);
    }
  }
}

// --------------------------------------------------------------------------
// 动画
// --------------------------------------------------------------------------

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}

.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  max-height: 0;
}

.expand-enter-to,
.expand-leave-from {
  opacity: 1;
  max-height: 1000px;
}

// --------------------------------------------------------------------------
// 响应式
// --------------------------------------------------------------------------

@media (max-width: 768px) {
  .filter-drawer {
    width: 90%;
  }

  .options-grid {
    grid-template-columns: 1fr;
  }
}

// 小屏幕 (≤ 480px)
@media (max-width: 480px) {
  .filter-bar {
    gap: 8px;
  }

  .search-container {
    .search-input {
      height: 36px;
      padding: 0 42px 0 12px;
      font-size: 16px; // 保持 16px 防止 iOS 缩放
      border-radius: 6px;
    }

    .search-btn {
      padding: 0 10px;
      font-size: 14px;
    }
  }

  .filter-trigger-btn {
    height: 36px;
    padding: 0 12px;
    gap: 4px;
    font-size: 13px;
    border-radius: 6px;

    svg {
      width: 16px;
      height: 16px;
    }
  }

  // 抽屉响应式变量
  .filter-drawer {
    --drawer-header-padding: 16px 20px;
    --drawer-header-title-size: 18px;
    --drawer-close-btn-size: 28px;
    --drawer-footer-padding: 16px 20px;
    --drawer-footer-btn-height: 40px;
    --drawer-footer-btn-font-size: 14px;

    --filter-options-width: 110px;
    --filter-options-padding-top: 16px;
    --filter-option-font-size: 13px;
    --filter-option-height: 48px;

    --content-padding: 16px 18px;
    --section-title-size: 14px;
    --section-margin-bottom: 24px;
    --options-grid-gap: 10px;
    --option-item-padding: 10px 12px;
    --option-item-font-size: 13px;
  }
}

// 超小屏幕 (≤ 410px)
@media (max-width: 410px) {
  .filter-bar {
    gap: 6px;
  }

  .search-container {
    .search-input {
      height: 32px;
      padding: 0 36px 0 10px;
      font-size: 16px; // 保持 16px 防止 iOS 缩放
    }

    .search-btn {
      padding: 0 8px;
      font-size: 12px;
    }
  }

  .filter-trigger-btn {
    height: 32px;
    padding: 0 8px;
    gap: 3px;
    font-size: 12px;

    svg {
      width: 14px;
      height: 14px;
    }

    span {
      display: none; // 超小屏幕隐藏文字，只显示图标
    }
  }

  // 抽屉响应式变量
  .filter-drawer {
    --drawer-header-padding: 14px 16px;
    --drawer-header-title-size: 16px;
    --drawer-close-btn-size: 26px;
    --drawer-footer-padding: 14px 16px;
    --drawer-footer-btn-height: 36px;
    --drawer-footer-btn-font-size: 13px;

    --filter-options-width: 90px;
    --filter-options-padding-top: 14px;
    --filter-option-font-size: 12px;
    --filter-option-height: 42px;

    --content-padding: 14px 14px;
    --section-title-size: 13px;
    --section-margin-bottom: 20px;
    --options-grid-gap: 8px;
    --option-item-padding: 8px 10px;
    --option-item-font-size: 12px;
  }
}

// 极小屏幕 (≤ 360px)
@media (max-width: 360px) {
  .filter-drawer {
    --drawer-header-padding: 12px 14px;
    --drawer-header-title-size: 15px;
    --drawer-close-btn-size: 24px;
    --drawer-footer-padding: 12px 14px;
    --drawer-footer-btn-height: 34px;
    --drawer-footer-btn-font-size: 12px;

    --filter-options-width: 80px;
    --filter-options-padding-top: 12px;
    --filter-option-font-size: 11px;
    --filter-option-height: 38px;

    --content-padding: 12px 12px;
    --section-title-size: 12px;
    --section-margin-bottom: 18px;
    --options-grid-gap: 6px;
    --option-item-padding: 6px 8px;
    --option-item-font-size: 11px;
  }
}
</style>

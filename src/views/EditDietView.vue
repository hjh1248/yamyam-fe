<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import axios from 'axios'
import AppHeader from '@/components/AppHeader.vue'

const router = useRouter()
const route = useRoute()

// 식단 계획 정보
const dietPlan = ref(null)
const selectedDate = ref(null)
const selectedMealType = ref('breakfast')

// 현재 선택된 날짜의 daily diet 정보
const dailyDiet = ref(null)
const description = ref('')

// 식사별 음식 데이터
const meals = ref({
  breakfast: [],
  lunch: [],
  dinner: [],
  snack: []
})

// UI 상태
const isLoading = ref(true)
const isSaving = ref(false)
const networkError = ref(false)
const errorMessage = ref('')
const showToast = ref(false)
const toastMessage = ref('')
const isEditMode = ref(false) // 등록/수정 모드 상태

// 자동완성 관련
const searchResults = ref([])
const activeFoodIndex = ref(null)
const showAutocomplete = ref(false)
let searchTimeout = null
let isSelecting = false

// 단위 옵션
const unitOptions = ['g', 'ml']

// 날짜 배열 생성 (시작일 ~ 종료일)
const dateList = computed(() => {
  if (!dietPlan.value) return []

  const dates = []
  const start = new Date(dietPlan.value.startDate)
  const end = new Date(dietPlan.value.endDate)

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    dates.push(new Date(d))
  }

  return dates
})

// 현재 선택된 식사 타입의 음식 목록
const currentMealFoods = computed(() => {
  return meals.value[selectedMealType.value] || []
})

// 날짜 포맷팅 함수
const formatDate = (date) => {
  if (!date) return ''
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const formatDateDisplay = (date) => {
  if (!date) return ''
  const d = new Date(date)
  const month = d.getMonth() + 1
  const day = d.getDate()
  return `${month}/${day}`
}

const formatDateFull = (date) => {
  if (!date) return ''
  const d = new Date(date)
  const year = d.getFullYear()
  const month = d.getMonth() + 1
  const day = d.getDate()
  const weekdays = ['일', '월', '화', '수', '목', '금', '토']
  const weekday = weekdays[d.getDay()]
  return `${year}년 ${month}월 ${day}일 (${weekday})`
}

// 식단 계획 정보 조회
const fetchDietPlan = async () => {
  const dietPlanId = route.query.id
  if (!dietPlanId) {
    router.push('/diet')
    return
  }

  try {
    const response = await axios.get(`http://localhost:8080/api/diet-plans/${dietPlanId}`)
    dietPlan.value = {
      id: response.data.dietPlanId,
      title: response.data.title,
      content: response.data.content,
      startDate: response.data.startDate,
      endDate: response.data.endDate
    }

    // 첫 번째 날짜를 기본 선택
    if (dateList.value.length > 0) {
      selectDate(dateList.value[0])
    }
  } catch (error) {
    console.error('식단 계획 조회 실패:', error)
    networkError.value = true
    errorMessage.value = '식단 계획을 불러올 수 없습니다'
  } finally {
    isLoading.value = false
  }
}

// 특정 날짜의 daily diet 조회
const fetchDailyDiet = async (date) => {
  if (!dietPlan.value) return

  try {
    const dateStr = formatDate(date)
    const response = await axios.get(
      `http://localhost:8080/api/diet-plans/${dietPlan.value.id}/daily-diets`,
      { params: { date: dateStr } }
    )

    // isEmpty가 true이거나 dailyDietId가 없으면 생성 모드
    if (response.data.isEmpty || !response.data.dailyDietId) {
      console.log('📭 빈 데이터 - 생성 모드로 전환')
      dailyDiet.value = null
      description.value = ''
      meals.value.breakfast = []
      meals.value.lunch = []
      meals.value.dinner = []
      meals.value.snack = []
    } else {
      // 데이터 있음 → 수정 모드
      console.log('📥 데이터 로드:', response.data)
      dailyDiet.value = response.data
      description.value = response.data.description || ''
      console.log('📝 description 설정:', description.value)
      console.log('📦 dailyDiet.description:', dailyDiet.value.description)

      // 식사 데이터 로드 (unit을 소문자로 변환)
      const convertMealData = (mealFoods) => {
        return (mealFoods || []).map(food => ({
          ...food,
          unit: String(food.unit).toLowerCase()
        }))
      }

      meals.value.breakfast = convertMealData(response.data.breakfast)
      meals.value.lunch = convertMealData(response.data.lunch)
      meals.value.dinner = convertMealData(response.data.dinner)
      meals.value.snack = convertMealData(response.data.snack)
    }

  } catch (error) {
    console.error('Daily diet 조회:', error)

    // 404는 정상 (아직 생성 안됨) → 생성 모드
    if (error.response?.status === 404) {
      console.log('📭 404 에러 - 생성 모드로 전환')
      dailyDiet.value = null
      description.value = ''
      meals.value.breakfast = []
      meals.value.lunch = []
      meals.value.dinner = []
      meals.value.snack = []
      console.log('📭 dailyDiet.value 설정:', dailyDiet.value)
    } else {
      // 그 외 에러
      networkError.value = true
      errorMessage.value = '데이터를 불러올 수 없습니다'

      setTimeout(() => {
        networkError.value = false
      }, 3000)
    }
  }
}

// 날짜 선택
const selectDate = (date) => {
  selectedDate.value = date
  isEditMode.value = false // 날짜 변경시 폼 닫기
  fetchDailyDiet(date)
}

// 등록 모드 시작
const startCreate = () => {
  isEditMode.value = true
  description.value = ''
  meals.value.breakfast = []
  meals.value.lunch = []
  meals.value.dinner = []
  meals.value.snack = []
}

// 수정 모드 시작
const startEdit = () => {
  isEditMode.value = true
}

// 취소
const handleCancel = () => {
  isEditMode.value = false
  // 원래 데이터로 복원
  if (dailyDiet.value) {
    description.value = dailyDiet.value.description || ''
    const convertMealData = (mealFoods) => {
      return (mealFoods || []).map(food => ({
        ...food,
        unit: String(food.unit).toLowerCase()
      }))
    }
    meals.value.breakfast = convertMealData(dailyDiet.value.breakfast)
    meals.value.lunch = convertMealData(dailyDiet.value.lunch)
    meals.value.dinner = convertMealData(dailyDiet.value.dinner)
    meals.value.snack = convertMealData(dailyDiet.value.snack)
  } else {
    description.value = ''
    meals.value.breakfast = []
    meals.value.lunch = []
    meals.value.dinner = []
    meals.value.snack = []
  }
}

// 음식 추가
const addFood = () => {
  meals.value[selectedMealType.value].push({
    foodId: null,
    name: '',
    amount: 100,
    unit: 'g',
    caloriePerG: 0,
    caloriePerMl: 0
  })
}

// 음식 제거
const removeFood = (index) => {
  meals.value[selectedMealType.value].splice(index, 1)
  if (activeFoodIndex.value === index) {
    showAutocomplete.value = false
    activeFoodIndex.value = null
  }
}

// 칼로리 계산
const calculateCalorie = (food) => {
  if (!food.amount || food.amount <= 0) return 0
  const unit = String(food.unit || '').toLowerCase()
  if (unit === 'g' && food.caloriePerG) {
    return (food.amount / 100) * food.caloriePerG
  } else if (unit === 'ml' && food.caloriePerMl) {
    return (food.amount / 100) * food.caloriePerMl
  }
  return 0
}

// 식사별 총 칼로리 계산
const calculateMealTotalCalorie = (foods) => {
  if (!foods || foods.length === 0) return 0
  return foods.reduce((total, food) => total + calculateCalorie(food), 0)
}

// 하루 총 칼로리 계산
const calculateDailyTotalCalorie = computed(() => {
  if (!dailyDiet.value) return 0

  const breakfastTotal = calculateMealTotalCalorie(dailyDiet.value.breakfast)
  const lunchTotal = calculateMealTotalCalorie(dailyDiet.value.lunch)
  const dinnerTotal = calculateMealTotalCalorie(dailyDiet.value.dinner)
  const snackTotal = calculateMealTotalCalorie(dailyDiet.value.snack)

  return breakfastTotal + lunchTotal + dinnerTotal + snackTotal
})

// 음식 검색
const searchFood = async (query, index) => {
  if (!query || query.trim() === '') {
    searchResults.value = []
    showAutocomplete.value = false
    return
  }

  try {
    const response = await axios.get(`http://localhost:8080/api/foods/search`, {
      params: { name: query }
    })
    searchResults.value = response.data
    activeFoodIndex.value = index
    showAutocomplete.value = searchResults.value.length > 0
  } catch (error) {
    console.error('음식 검색 실패:', error)
    searchResults.value = []
    showAutocomplete.value = false
  }
}

// 음식명 입력 핸들러
const handleFoodNameInput = (event, index) => {
  if (isSelecting) return
  const query = event.target.value
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  searchTimeout = setTimeout(() => {
    searchFood(query, index)
  }, 300)
}

// 자동완성에서 음식 선택
const selectFood = (food, index) => {
  isSelecting = true
  const foods = meals.value[selectedMealType.value]

  foods[index].foodId = food.foodId
  foods[index].name = food.name
  foods[index].category = food.category

  // amount가 없거나 0이면 기본값 100 설정
  if (!foods[index].amount || foods[index].amount <= 0) {
    foods[index].amount = 100
  }

  // 백엔드에서 caloriePerG, caloriePerMl을 직접 보내줌
  foods[index].caloriePerG = food.caloriePerG || 0
  foods[index].caloriePerMl = food.caloriePerMl || 0

  // caloriePerG가 0보다 크면 g 단위, caloriePerMl이 0보다 크면 ml 단위
  if (food.caloriePerG > 0) {
    foods[index].unit = 'g'
  } else if (food.caloriePerMl > 0) {
    foods[index].unit = 'ml'
  } else {
    // 둘 다 0이면 기본값 g
    foods[index].unit = 'g'
  }

  showAutocomplete.value = false
  searchResults.value = []
  activeFoodIndex.value = null

  setTimeout(() => {
    isSelecting = false
  }, 100)
}

// input focus 핸들러
const handleFoodNameFocus = (index) => {
  activeFoodIndex.value = index
  const foods = currentMealFoods.value
  if (foods[index] && foods[index].name && searchResults.value.length > 0) {
    showAutocomplete.value = true
  }
}

// 외부 클릭 감지
const handleClickOutside = (event) => {
  const target = event.target
  if (!target.closest('.autocomplete-wrapper')) {
    showAutocomplete.value = false
    activeFoodIndex.value = null
  }
}

// 토스트 메시지
const displayToast = (message) => {
  toastMessage.value = message
  showToast.value = true
  setTimeout(() => {
    showToast.value = false
  }, 3000)
}

// 식단 계획 삭제
const handleDelete = async () => {
  if (!confirm('정말 이 식단 계획을 삭제하시겠습니까?')) {
    return
  }

  try {
    await axios.delete(`http://localhost:8080/api/diet-plans/${dietPlan.value.id}`)
    displayToast('식단 계획이 삭제되었습니다')

    // 0.5초 후 목록 페이지로 이동
    setTimeout(() => {
      router.push('/diet')
    }, 500)
  } catch (error) {
    console.error('삭제 실패:', error)
    networkError.value = true
    errorMessage.value = error.response?.data?.message || '삭제에 실패했습니다'

    setTimeout(() => {
      networkError.value = false
    }, 3000)
  }
}

// 저장
const handleSave = async () => {
  if (!selectedDate.value) {
    displayToast('날짜를 선택해주세요')
    return
  }

  isSaving.value = true
  networkError.value = false

  try {
    // 식사별 음식 데이터 변환 (foodId, amount만 추출)
    const convertMealData = (mealFoods) => {
      return mealFoods
        .filter(food => food.foodId && food.name)
        .map(food => ({
          foodId: food.foodId,
          amount: Number(food.amount)
        }))
    }

    const dateStr = formatDate(selectedDate.value)
    const requestData = {
      date: dateStr,
      description: description.value,
      breakfast: convertMealData(meals.value.breakfast),
      lunch: convertMealData(meals.value.lunch),
      dinner: convertMealData(meals.value.dinner),
      snack: convertMealData(meals.value.snack)
    }

    if (dailyDiet.value) {
      // 수정 모드 - PATCH
      await axios.patch(
        `http://localhost:8080/api/diet-plans/${dietPlan.value.id}/daily-diets`,
        requestData
      )
      displayToast('수정되었습니다!')
    } else {
      // 생성 모드 - POST
      await axios.post(
        `http://localhost:8080/api/diet-plans/${dietPlan.value.id}/daily-diets`,
        requestData
      )
      displayToast('등록되었습니다!')
    }

    // 저장 후 폼 닫기 및 최신 데이터로 갱신
    isEditMode.value = false
    await fetchDailyDiet(selectedDate.value)

  } catch (error) {
    console.error('저장 실패:', error)
    networkError.value = true
    errorMessage.value = error.response?.data?.message || '저장에 실패했습니다'

    setTimeout(() => {
      networkError.value = false
    }, 3000)
  } finally {
    isSaving.value = false
  }
}

// 뒤로 가기
const handleBack = () => {
  router.push('/diet')
}

onMounted(() => {
  fetchDietPlan()
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div class="diet-plan-detail-container">
    <AppHeader active-page="diet" />

    <!-- 메인 콘텐츠 -->
    <main class="main-content">
      <div v-if="isLoading" class="loading-message">로딩 중...</div>

      <div v-else-if="dietPlan" class="content-wrapper">
        <!-- 헤더 -->
        <div class="page-header">
          <div>
            <h1 class="page-title">{{ dietPlan.title }}</h1>
            <p class="page-subtitle">{{ dietPlan.content }}</p>
            <p class="page-period">
              {{ formatDateFull(new Date(dietPlan.startDate)) }} ~ {{ formatDateFull(new Date(dietPlan.endDate)) }}
            </p>
          </div>
          <div class="header-actions">
            <button class="delete-btn" @click="handleDelete">삭제</button>
            <button class="back-btn" @click="handleBack">목록으로</button>
          </div>
        </div>

        <div class="detail-content">
          <!-- 달력 영역 -->
          <div class="calendar-section">
            <h2 class="section-title">날짜 선택</h2>
            <div class="calendar-grid">
              <button
                v-for="date in dateList"
                :key="date.getTime()"
                :class="['calendar-date', {
                  active: selectedDate && formatDate(selectedDate) === formatDate(date)
                }]"
                @click="selectDate(date)"
              >
                {{ formatDateDisplay(date) }}
              </button>
            </div>
          </div>

          <!-- 식단 조회/입력 영역 -->
          <div v-if="selectedDate" class="diet-section">
            <!-- 네트워크 오류 메시지 -->
            <div v-if="networkError" class="network-error">
              {{ errorMessage }}
            </div>

            <div class="section-header">
              <h2 class="section-title">{{ formatDateFull(selectedDate) }}</h2>
              <div class="action-buttons">
                <button
                  v-if="!isEditMode && !dailyDiet"
                  class="create-btn"
                  @click="startCreate"
                >
                  등록
                </button>
                <button
                  v-if="!isEditMode && dailyDiet"
                  class="edit-btn"
                  @click="startEdit"
                >
                  수정
                </button>
                <button
                  v-if="isEditMode"
                  class="cancel-btn"
                  @click="handleCancel"
                  :disabled="isSaving"
                >
                  취소
                </button>
                <button
                  v-if="isEditMode"
                  class="save-btn"
                  @click="handleSave"
                  :disabled="isSaving"
                >
                  {{ isSaving ? '저장 중...' : '저장' }}
                </button>
              </div>
            </div>

            <!-- 조회 모드 -->
            <div v-if="!isEditMode && dailyDiet">
              <!-- 메모 표시 -->
              <div v-if="dailyDiet.description && dailyDiet.description.trim()" class="view-section">
                <h3 class="view-label">메모</h3>
                <p class="view-content">{{ dailyDiet.description }}</p>
              </div>

              <!-- 하루 총 칼로리 -->
              <div class="total-calorie-card">
                <div class="total-calorie-label">오늘의 총 섭취 칼로리</div>
                <div class="total-calorie-value">{{ calculateDailyTotalCalorie }}<span class="calorie-unit-large">kcal</span></div>
              </div>

              <!-- 식사 정보 표시 -->
              <div class="view-section">
                <h3 class="view-label">식사 정보</h3>

                <div v-if="dailyDiet.breakfast && dailyDiet.breakfast.length > 0" class="meal-view">
                  <div class="meal-view-header">
                    <h4 class="meal-view-title">아침</h4>
                    <span class="meal-total-calorie">{{ calculateMealTotalCalorie(dailyDiet.breakfast) }}kcal</span>
                  </div>
                  <div class="food-view-list">
                    <div v-for="(food, index) in dailyDiet.breakfast" :key="index" class="food-view-item">
                      <span class="food-view-name">{{ food.name }}</span>
                      <span class="food-view-amount">{{ food.amount }}{{ food.unit }}</span>
                      <span class="food-view-calorie">{{ calculateCalorie(food) }}kcal</span>
                    </div>
                  </div>
                </div>

                <div v-if="dailyDiet.lunch && dailyDiet.lunch.length > 0" class="meal-view">
                  <div class="meal-view-header">
                    <h4 class="meal-view-title">점심</h4>
                    <span class="meal-total-calorie">{{ calculateMealTotalCalorie(dailyDiet.lunch) }}kcal</span>
                  </div>
                  <div class="food-view-list">
                    <div v-for="(food, index) in dailyDiet.lunch" :key="index" class="food-view-item">
                      <span class="food-view-name">{{ food.name }}</span>
                      <span class="food-view-amount">{{ food.amount }}{{ food.unit }}</span>
                      <span class="food-view-calorie">{{ calculateCalorie(food) }}kcal</span>
                    </div>
                  </div>
                </div>

                <div v-if="dailyDiet.dinner && dailyDiet.dinner.length > 0" class="meal-view">
                  <div class="meal-view-header">
                    <h4 class="meal-view-title">저녁</h4>
                    <span class="meal-total-calorie">{{ calculateMealTotalCalorie(dailyDiet.dinner) }}kcal</span>
                  </div>
                  <div class="food-view-list">
                    <div v-for="(food, index) in dailyDiet.dinner" :key="index" class="food-view-item">
                      <span class="food-view-name">{{ food.name }}</span>
                      <span class="food-view-amount">{{ food.amount }}{{ food.unit }}</span>
                      <span class="food-view-calorie">{{ calculateCalorie(food) }}kcal</span>
                    </div>
                  </div>
                </div>

                <div v-if="dailyDiet.snack && dailyDiet.snack.length > 0" class="meal-view">
                  <div class="meal-view-header">
                    <h4 class="meal-view-title">간식</h4>
                    <span class="meal-total-calorie">{{ calculateMealTotalCalorie(dailyDiet.snack) }}kcal</span>
                  </div>
                  <div class="food-view-list">
                    <div v-for="(food, index) in dailyDiet.snack" :key="index" class="food-view-item">
                      <span class="food-view-name">{{ food.name }}</span>
                      <span class="food-view-amount">{{ food.amount }}{{ food.unit }}</span>
                      <span class="food-view-calorie">{{ calculateCalorie(food) }}kcal</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 등록/수정 모드 폼 -->
            <div v-if="isEditMode">
              <!-- 메모 입력 -->
              <div class="form-section">
                <label class="form-label">메모</label>
                <textarea
                  v-model="description"
                  placeholder="오늘의 식단 메모를 입력하세요"
                  class="form-textarea"
                  rows="3"
                ></textarea>
              </div>

              <!-- 식사 타입 탭 -->
              <div class="form-section">
                <label class="form-label">식사 정보</label>
                <div class="meal-type-tabs">
                <button
                  type="button"
                  :class="['meal-tab', { active: selectedMealType === 'breakfast' }]"
                  @click="selectedMealType = 'breakfast'"
                >
                  아침
                </button>
                <button
                  type="button"
                  :class="['meal-tab', { active: selectedMealType === 'lunch' }]"
                  @click="selectedMealType = 'lunch'"
                >
                  점심
                </button>
                <button
                  type="button"
                  :class="['meal-tab', { active: selectedMealType === 'dinner' }]"
                  @click="selectedMealType = 'dinner'"
                >
                  저녁
                </button>
                <button
                  type="button"
                  :class="['meal-tab', { active: selectedMealType === 'snack' }]"
                  @click="selectedMealType = 'snack'"
                >
                  간식
                </button>
              </div>

              <!-- 음식 목록 -->
              <div class="section-header" style="margin-top: 20px;">
                <span class="section-label">음식 정보</span>
                <button type="button" class="add-food-btn" @click="addFood">
                  + 음식 추가
                </button>
              </div>

              <div v-if="currentMealFoods.length > 0" class="food-list">
                <div v-for="(food, index) in currentMealFoods" :key="index" class="food-row">
                  <div class="food-input-group autocomplete-wrapper">
                    <input
                      v-model="food.name"
                      type="text"
                      placeholder="음식명 (예: 현미밥)"
                      class="food-input"
                      @input="handleFoodNameInput($event, index)"
                      @focus="handleFoodNameFocus(index)"
                    />
                    <!-- 자동완성 드롭다운 -->
                    <div
                      v-if="showAutocomplete && activeFoodIndex === index"
                      class="autocomplete-dropdown"
                    >
                      <div
                        v-for="(result, idx) in searchResults"
                        :key="idx"
                        class="autocomplete-item"
                        @mousedown="selectFood(result, index)"
                      >
                        <div class="food-name">{{ result.name }}</div>
                        <div class="food-calorie-info">
                          <span v-if="result.energyPer100">{{ result.energyPer100 }}kcal/100{{ result.baseUnit }}</span>
                        </div>
                      </div>
                      <div v-if="searchResults.length === 0" class="no-results">
                        검색 결과가 없습니다
                      </div>
                    </div>
                  </div>
                  <div class="food-input-group amount-input-group">
                    <input
                      v-model.number="food.amount"
                      type="number"
                      placeholder="양"
                      class="food-input amount-input"
                      min="0"
                    />
                    <select
                      v-model="food.unit"
                      class="unit-select"
                    >
                      <option
                        v-for="unit in unitOptions"
                        :key="unit"
                        :value="unit"
                        :disabled="(unit === 'g' && !food.caloriePerG) || (unit === 'ml' && !food.caloriePerMl)"
                      >
                        {{ unit }}
                      </option>
                    </select>
                  </div>
                  <div class="food-input-group calorie-input-group">
                    <input
                      :value="calculateCalorie(food)"
                      type="number"
                      placeholder="칼로리"
                      class="food-input calorie-input"
                      readonly
                    />
                    <span class="calorie-unit">kcal</span>
                  </div>
                  <button
                    type="button"
                    class="remove-btn"
                    @click="removeFood(index)"
                  >
                    ✕
                  </button>
                </div>
              </div>

                <div v-else class="empty-meal-info">
                  음식 추가 버튼을 눌러 식사 정보를 입력하세요
                </div>
              </div>
            </div>

            <!-- 빈 상태 메시지 (등록 전) -->
            <div v-if="!isEditMode && !dailyDiet" class="empty-state">
              등록 버튼을 눌러 식단을 입력하세요
            </div>
          </div>

          <div v-else class="empty-state">
            날짜를 선택하여 식단을 확인하세요
          </div>
        </div>
      </div>
    </main>

    <!-- 토스트 메시지 -->
    <div v-if="showToast" class="toast-message">
      <div class="toast-icon">✓</div>
      <span class="toast-text">{{ toastMessage }}</span>
    </div>
  </div>
</template>

<style scoped>
.diet-plan-detail-container {
  min-height: 100vh;
  background-color: #F5F7FA;
}

/* 메인 콘텐츠 */
.main-content {
  padding: 40px;
}

.content-wrapper {
  max-width: 1200px;
  margin: 0 auto;
}

.loading-message {
  text-align: center;
  padding: 60px 20px;
  font-size: 18px;
  color: #666666;
}

/* 페이지 헤더 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 32px;
}

.page-title {
  font-size: 32px;
  font-weight: 700;
  color: #333333;
  margin-bottom: 8px;
}

.page-subtitle {
  font-size: 16px;
  color: #666666;
  margin-bottom: 4px;
}

.page-period {
  font-size: 14px;
  color: #999999;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.back-btn {
  padding: 12px 24px;
  background: #FFFFFF;
  border: 1px solid #E0E0E0;
  border-radius: 8px;
  color: #666666;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.back-btn:hover {
  border-color: #4CAF50;
  color: #4CAF50;
}

.delete-btn {
  padding: 12px 24px;
  background: #FFFFFF;
  border: 1px solid #F44336;
  border-radius: 8px;
  color: #F44336;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.delete-btn:hover {
  background: #F44336;
  color: #FFFFFF;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(244, 67, 54, 0.3);
}

/* 메인 컨텐츠 영역 */
.detail-content {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 24px;
}

/* 달력 섹션 */
.calendar-section {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  height: fit-content;
  position: sticky;
  top: 100px;
}

.section-title {
  font-size: 18px;
  font-weight: 700;
  color: #333333;
  margin-bottom: 16px;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.calendar-date {
  padding: 12px 8px;
  background: #F8F9FA;
  border: 2px solid #E0E0E0;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #666666;
  cursor: pointer;
  transition: all 0.3s ease;
}

.calendar-date:hover {
  border-color: #4CAF50;
  background: #E8F5E9;
  color: #4CAF50;
}

.calendar-date.active {
  background: #4CAF50;
  border-color: #4CAF50;
  color: #FFFFFF;
}

/* 식단 섹션 */
.diet-section {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.section-label {
  font-size: 14px;
  font-weight: 600;
  color: #666666;
}

/* 액션 버튼들 */
.action-buttons {
  display: flex;
  gap: 12px;
}

.create-btn,
.edit-btn,
.save-btn,
.cancel-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.create-btn,
.save-btn {
  background: #4CAF50;
  color: #FFFFFF;
}

.create-btn:hover:not(:disabled),
.save-btn:hover:not(:disabled) {
  background: #45A049;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
}

.create-btn:disabled,
.save-btn:disabled {
  background: #CCCCCC;
  cursor: not-allowed;
  transform: none;
}

.edit-btn {
  background: #2196F3;
  color: #FFFFFF;
}

.edit-btn:hover {
  background: #1976D2;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);
}

.cancel-btn {
  background: #FFFFFF;
  color: #666666;
  border: 1px solid #E0E0E0;
}

.cancel-btn:hover:not(:disabled) {
  border-color: #333333;
  color: #333333;
}

.cancel-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 조회 모드 스타일 */
.view-section {
  margin-bottom: 32px;
}

.view-label {
  font-size: 16px;
  font-weight: 700;
  color: #333333;
  margin-bottom: 12px;
}

.view-content {
  font-size: 15px;
  color: #666666;
  line-height: 1.6;
  padding: 14px 16px;
  background: #F8F9FA;
  border-radius: 8px;
}

/* 총 칼로리 카드 */
.total-calorie-card {
  background: linear-gradient(135deg, #4CAF50 0%, #45A049 100%);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 32px;
  text-align: center;
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
}

.total-calorie-label {
  font-size: 14px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.total-calorie-value {
  font-size: 36px;
  font-weight: 700;
  color: #FFFFFF;
}

.calorie-unit-large {
  font-size: 20px;
  font-weight: 600;
  margin-left: 8px;
}

.meal-view {
  margin-bottom: 24px;
}

.meal-view-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 2px solid #E8F5E9;
}

.meal-view-title {
  font-size: 15px;
  font-weight: 600;
  color: #4CAF50;
  margin: 0;
}

.meal-total-calorie {
  font-size: 14px;
  font-weight: 700;
  color: #4CAF50;
  background: #E8F5E9;
  padding: 4px 12px;
  border-radius: 12px;
}

.food-view-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.food-view-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #F8F9FA;
  border-radius: 8px;
  transition: background 0.2s ease;
}

.food-view-item:hover {
  background: #E8F5E9;
}

.food-view-name {
  flex: 2;
  font-size: 15px;
  font-weight: 500;
  color: #333333;
}

.food-view-amount {
  flex: 1;
  font-size: 14px;
  color: #666666;
  text-align: center;
}

.food-view-calorie {
  flex: 1;
  font-size: 14px;
  font-weight: 600;
  color: #4CAF50;
  text-align: right;
}

/* 네트워크 오류 메시지 */
.network-error {
  background: #FFEBEE;
  color: #D32F2F;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 24px;
  font-size: 14px;
  font-weight: 600;
  text-align: center;
  border: 1px solid #FFCDD2;
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    transform: translateY(-10px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* 폼 요소 */
.form-section {
  margin-bottom: 32px;
}

.form-label {
  display: block;
  font-size: 16px;
  font-weight: 700;
  color: #333333;
  margin-bottom: 12px;
}

.form-textarea {
  width: 100%;
  padding: 14px 16px;
  border: 1px solid #E0E0E0;
  border-radius: 8px;
  font-size: 15px;
  color: #333333;
  background: #FFFFFF;
  transition: border-color 0.3s ease;
  font-family: inherit;
  resize: vertical;
}

.form-textarea:focus {
  outline: none;
  border-color: #4CAF50;
}

.form-textarea::placeholder {
  color: #AAAAAA;
}

/* 식사 타입 탭 */
.meal-type-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.meal-tab {
  flex: 1;
  padding: 12px;
  background: #F8F9FA;
  border: 2px solid #E0E0E0;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  color: #666666;
  cursor: pointer;
  transition: all 0.3s ease;
}

.meal-tab:hover {
  border-color: #4CAF50;
  color: #4CAF50;
}

.meal-tab.active {
  background: #E8F5E9;
  border-color: #4CAF50;
  color: #4CAF50;
}

/* 음식 추가 버튼 */
.add-food-btn {
  padding: 8px 16px;
  background: #4CAF50;
  color: #FFFFFF;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.3s ease;
}

.add-food-btn:hover {
  background: #45A049;
}

/* 음식 목록 */
.food-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.food-row {
  display: grid;
  grid-template-columns: 2fr 1.5fr 1fr auto;
  gap: 12px;
  align-items: center;
}

.food-input-group {
  display: flex;
  flex-direction: column;
}

.amount-input-group {
  display: flex;
  flex-direction: row;
  gap: 8px;
}

.amount-input {
  flex: 1;
}

.unit-select {
  padding: 12px 8px;
  border: 1px solid #E0E0E0;
  border-radius: 8px;
  font-size: 15px;
  color: #333333;
  background: #FFFFFF;
  cursor: pointer;
  transition: border-color 0.3s ease;
  min-width: 60px;
}

.unit-select:focus {
  outline: none;
  border-color: #4CAF50;
}

.unit-select option:disabled {
  color: #CCCCCC;
  background: #F5F5F5;
}

.calorie-input-group {
  display: flex;
  flex-direction: row;
  gap: 8px;
  align-items: center;
}

.calorie-input {
  flex: 1;
}

.calorie-unit {
  font-size: 14px;
  color: #666666;
  font-weight: 600;
  min-width: 40px;
}

.autocomplete-wrapper {
  position: relative;
}

.food-input {
  padding: 12px 16px;
  border: 1px solid #E0E0E0;
  border-radius: 8px;
  font-size: 15px;
  color: #333333;
  background: #FFFFFF;
  transition: border-color 0.3s ease;
  width: 100%;
}

.food-input:focus {
  outline: none;
  border-color: #4CAF50;
}

.food-input::placeholder {
  color: #AAAAAA;
}

/* 자동완성 드롭다운 */
.autocomplete-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  max-height: 250px;
  overflow-y: auto;
  background: #FFFFFF;
  border: 1px solid #E0E0E0;
  border-radius: 8px;
  margin-top: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 1000;
}

.autocomplete-item {
  padding: 12px 16px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: background 0.2s ease;
  border-bottom: 1px solid #F5F5F5;
}

.autocomplete-item:last-child {
  border-bottom: none;
}

.autocomplete-item:hover {
  background: #F5F7FA;
}

.food-name {
  font-size: 15px;
  color: #333333;
  font-weight: 500;
}

.food-calorie-info {
  font-size: 12px;
  color: #4CAF50;
  font-weight: 600;
  white-space: nowrap;
}

.no-results {
  padding: 16px;
  text-align: center;
  color: #999999;
  font-size: 14px;
}

.remove-btn {
  width: 36px;
  height: 36px;
  background: #FFE0E0;
  color: #F44336;
  border: none;
  border-radius: 6px;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.remove-btn:hover {
  background: #F44336;
  color: #FFFFFF;
}

.empty-meal-info {
  padding: 40px;
  text-align: center;
  color: #999999;
  font-size: 14px;
  background: #F8F9FA;
  border-radius: 8px;
  border: 2px dashed #E0E0E0;
}

.empty-state {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 80px 40px;
  text-align: center;
  color: #999999;
  font-size: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

/* 토스트 메시지 */
.toast-message {
  position: fixed;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 24px;
  background: #FFFFFF;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    transform: translateX(-50%) translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateX(-50%) translateY(0);
    opacity: 1;
  }
}

.toast-icon {
  width: 24px;
  height: 24px;
  background: #4CAF50;
  color: #FFFFFF;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 700;
}

.toast-text {
  font-size: 15px;
  color: #333333;
  font-weight: 600;
}

/* 반응형 */
@media (max-width: 1024px) {
  .detail-content {
    grid-template-columns: 1fr;
  }

  .calendar-section {
    position: static;
  }

  .calendar-grid {
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  }
}

@media (max-width: 768px) {
  .main-content {
    padding: 20px;
  }

  .page-header {
    flex-direction: column;
    gap: 16px;
  }

  .back-btn {
    width: 100%;
  }

  .diet-section {
    padding: 20px;
  }

  .food-row {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .remove-btn {
    width: 100%;
  }

  .meal-type-tabs {
    grid-template-columns: repeat(2, 1fr);
  }

  .toast-message {
    bottom: 20px;
    max-width: 90%;
  }
}
</style>

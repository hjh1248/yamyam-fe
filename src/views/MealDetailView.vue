<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import { dailyDietApi, mealApi, foodApi } from '@/api'

const router = useRouter()
const route = useRoute()

// 라우트 파라미터
const dietPlanId = ref(route.query.dietPlanId)
const dailyDietId = ref(route.query.dailyDietId)
const mealType = ref(route.query.mealType)
const mealId = ref(route.query.mealId || null)
const returnDate = ref(route.query.returnDate || null)

// 식사 타입 라벨
const MEAL_TYPE_LABELS = {
  BREAKFAST: '아침',
  LUNCH: '점심',
  DINNER: '저녁',
  SNACK: '간식'
}

// UI 상태
const isLoading = ref(true)
const isSaving = ref(false)
const networkError = ref(false)
const errorMessage = ref('')
const showToast = ref(false)
const toastMessage = ref('')
const isEditMode = ref(false)

// 식사 데이터
const initialMealFoods = ref([])
const mealFoods = ref([])

// 자동완성 관련
const foodSearchResults = ref([])
const showAutocomplete = ref(false)
const activeFoodIndex = ref(null)
let searchTimeout = null

// 계산된 값
const totalNutrients = computed(() => {
  const totals = {
    calorie: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    sugar: 0,
    sodium: 0
  }

  mealFoods.value.forEach(food => {
    const quantity = Number(food.quantity)
    if (food.foodId && quantity > 0) {
      const multiplier = quantity / 100
      totals.calorie += (food.caloriePer100 || 0) * multiplier
      totals.protein += (food.proteinPer100 || 0) * multiplier
      totals.carbs += (food.carbohydratePer100 || 0) * multiplier
      totals.fat += (food.fatPer100 || 0) * multiplier
      totals.sugar += (food.sugarPer100 || 0) * multiplier
      totals.sodium += (food.sodiumPer100 || 0) * multiplier
    }
  })

  return {
    calorie: Math.round(totals.calorie),
    protein: Math.round(totals.protein * 10) / 10,
    carbs: Math.round(totals.carbs * 10) / 10,
    fat: Math.round(totals.fat * 10) / 10,
    sugar: Math.round(totals.sugar * 10) / 10,
    sodium: Math.round(totals.sodium)
  }
})

// 각 음식별 영양소 데이터 (표용)
const foodNutritionDetails = computed(() => {
  return mealFoods.value.map(food => {
    const quantity = Number(food.quantity)
    if (!food.foodId || quantity <= 0) {
      return {
        foodName: food.foodName || '미선택',
        quantity: `${quantity || 0}${food.unit || 'g'}`,
        nutrition: {
          calorie: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          sugar: 0,
          sodium: 0
        }
      }
    }

    const multiplier = quantity / 100
    return {
      foodName: food.foodName,
      quantity: `${quantity}${food.unit}`,
      nutrition: {
        calorie: Math.round((food.caloriePer100 || 0) * multiplier),
        protein: Math.round((food.proteinPer100 || 0) * multiplier * 10) / 10,
        carbs: Math.round((food.carbohydratePer100 || 0) * multiplier * 10) / 10,
        fat: Math.round((food.fatPer100 || 0) * multiplier * 10) / 10,
        sugar: Math.round((food.sugarPer100 || 0) * multiplier * 10) / 10,
        sodium: Math.round((food.sodiumPer100 || 0) * multiplier * 10) / 10
      }
    }
  })
})

// 영양소 단위 매핑
const NUTRIENT_UNITS = {
  calorie: 'kcal',
  protein: 'g',
  carbs: 'g',
  fat: 'g',
  sugar: 'g',
  sodium: 'mg'
}

// 토스트 메시지 표시
const displayToast = (message) => {
  toastMessage.value = message
  showToast.value = true
  setTimeout(() => showToast.value = false, 3000)
}

// 기존 식사 데이터 로드
const loadMealData = async () => {
  if (!mealId.value) {
    isEditMode.value = true
    isLoading.value = false
    if (mealFoods.value.length === 0) addFoodRow()
    return
  }

  try {
    const response = await mealApi.getById(dietPlanId.value, dailyDietId.value, mealId.value)
    
    if (response.data && response.data.mealFoods) {
      const loadedFoods = response.data.mealFoods.map(food => ({
        foodId: food.foodId,
        foodName: food.foodName,
        mealFoodId: food.mealFoodId,
        quantity: food.quantity,
        unit: food.baseUnit || 'g',
        caloriePer100: food.caloriePer100 || 0,
        proteinPer100: food.proteinPer100 || 0,
        carbohydratePer100: food.carbohydratePer100 || 0,
        fatPer100: food.fatPer100 || 0,
        sugarPer100: food.sugarPer100 || 0,
        sodiumPer100: food.sodiumPer100 || 0
      }))
      mealFoods.value = loadedFoods
      initialMealFoods.value = JSON.parse(JSON.stringify(loadedFoods))
    }
    isEditMode.value = false
  } catch (error) {
    console.error('식사 데이터 로드 실패:', error)
    networkError.value = true
    errorMessage.value = error.response?.data?.message || '데이터를 불러올 수 없습니다'
    setTimeout(() => networkError.value = false, 3000)
  } finally {
    isLoading.value = false
  }
}

const addFoodRow = () => {
  mealFoods.value.push({
    foodId: null,
    foodName: '',
    quantity: '',
    unit: 'g',
    caloriePer100: 0,
    proteinPer100: 0,
    carbohydratePer100: 0,
    fatPer100: 0,
    sugarPer100: 0,
    sodiumPer100: 0
  })
}

const removeFoodRow = (index) => {
  mealFoods.value.splice(index, 1)
}

const searchFood = async (query, index) => {
  if (!query || query.trim().length < 1) {
    foodSearchResults.value = []
    showAutocomplete.value = false
    return
  }

  try {
    const response = await foodApi.search(query.trim())
    foodSearchResults.value = response.data || []
    if (activeFoodIndex.value === index) {
      showAutocomplete.value = true
    }
  } catch (error) {
    console.error('음식 검색 실패:', error)
    foodSearchResults.value = []
    if (activeFoodIndex.value === index) {
      showAutocomplete.value = false
    }
  }
}

const selectFood = (food, index) => {
  mealFoods.value[index] = {
    foodId: food.foodId,
    foodName: food.name,
    mealFoodId: null,
    quantity: mealFoods.value[index].quantity || 100,
    unit: food.baseUnit || 'g',
    caloriePer100: food.caloriePer100 || 0,
    proteinPer100: food.proteinPer100 || 0,
    carbohydratePer100: food.carbohydratePer100 || 0,
    fatPer100: food.fatPer100 || 0,
    sugarPer100: food.sugarPer100 || 0,
    sodiumPer100: food.sodiumPer100 || 0
  }

  showAutocomplete.value = false
  activeFoodIndex.value = null
  foodSearchResults.value = []
}

const onFoodNameChange = (value, index) => {
  mealFoods.value[index].foodName = value
  activeFoodIndex.value = index

  if (mealFoods.value[index].foodId) {
    mealFoods.value[index].foodId = null
    mealFoods.value[index].caloriePer100 = 0
    mealFoods.value[index].proteinPer100 = 0
    mealFoods.value[index].carbohydratePer100 = 0
  }

  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => searchFood(value, index), 300)
}

const handleClickOutside = (event) => {
  if (!event.target.closest('.autocomplete-wrapper')) {
    showAutocomplete.value = false
    activeFoodIndex.value = null
  }
}

const saveMeal = async () => {
  const validFoods = mealFoods.value.filter(food => food.foodId && Number(food.quantity) > 0)

  if (validFoods.length === 0) {
    displayToast('최소 한 개의 음식을 추가하고 섭취량을 입력해주세요')
    return
  }

  isSaving.value = true

  try {
    const foodList = validFoods.map(food => ({
      foodId: food.foodId,
      amount: Number(food.quantity)
    }))

    if (mealId.value) {
      const updateRequestData = { mealType: mealType.value, mealFoodUpdateRequests: foodList }
      await mealApi.update(dietPlanId.value, dailyDietId.value, mealId.value, updateRequestData)
      displayToast(`${MEAL_TYPE_LABELS[mealType.value]}이 수정되었습니다`)
    } else {
      const createRequestData = { mealType: mealType.value, mealFoodRequests: foodList }
      const response = await mealApi.create(dietPlanId.value, dailyDietId.value, createRequestData)
      mealId.value = response.data.mealId || mealId.value
      displayToast(`${MEAL_TYPE_LABELS[mealType.value]}이 등록되었습니다`)
    }

    setTimeout(() => {
      router.push({
        name: 'diet-plan-detail',
        query: { id: dietPlanId.value, returnDate: returnDate.value }
      })
    }, 500)
  } catch (error) {
    console.error('식사 저장 실패:', error)
    networkError.value = true
    errorMessage.value = error.response?.data?.message || '저장에 실패했습니다'
    setTimeout(() => networkError.value = false, 3000)
  } finally {
    isSaving.value = false
  }
}

const enterEditMode = () => {
  isEditMode.value = true
  if (mealFoods.value.length === 0 && initialMealFoods.value.length === 0) {
    addFoodRow()
  }
}

const cancelEdit = () => {
  if (mealId.value) {
    mealFoods.value = JSON.parse(JSON.stringify(initialMealFoods.value))
    isEditMode.value = false
  }
  router.push({
    name: 'diet-plan-detail',
    query: { id: dietPlanId.value, returnDate: returnDate.value }
  })
}

const handleCancel = () => {
  router.push({
    name: 'diet-plan-detail',
    query: { id: dietPlanId.value, returnDate: returnDate.value }
  })
}

onMounted(() => {
  loadMealData()
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div class="meal-detail-container">
    <AppHeader active-page="diet" />

    <main class="main-content">
      <div class="content-wrapper">
        <div v-if="networkError" class="network-error">{{ errorMessage }}</div>

        <div class="page-header">
          <h1 class="page-title">
            {{ MEAL_TYPE_LABELS[mealType] }}
            {{ !mealId ? '추가' : (isEditMode ? '수정' : '상세') }}
          </h1>
        </div>

        <div v-if="!isLoading" class="form-card">
          <div class="nutrient-summary">
            <div class="summary-item calorie">
              <span class="summary-label">총 칼로리</span>
              <span class="summary-value">{{ totalNutrients.calorie }} kcal</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">탄수화물</span>
              <span class="summary-value">{{ totalNutrients.carbs }} g</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">단백질</span>
              <span class="summary-value">{{ totalNutrients.protein }} g</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">지방</span>
              <span class="summary-value">{{ totalNutrients.fat }} g</span>
            </div>
          </div>

          <div class="food-list-section">
            <div class="section-header">
              <h2 class="section-label">음식 목록</h2>
              <button v-if="isEditMode" class="add-food-btn" @click="addFoodRow">+ 음식 추가</button>
            </div>

            <div v-if="isEditMode" class="food-list-edit">
              <div v-for="(food, index) in mealFoods" :key="index" class="food-row">
                <div class="food-input-group autocomplete-wrapper">
                  <label class="input-label">음식 이름</label>
                  <input
                    type="text"
                    :value="food.foodName"
                    @input="onFoodNameChange($event.target.value, index)"
                    placeholder="음식 이름을 검색하세요"
                    class="food-input"
                    @focus="activeFoodIndex = index"
                  />
                  <div v-if="showAutocomplete && activeFoodIndex === index" class="autocomplete-dropdown">
                    <div v-for="result in foodSearchResults" :key="result.foodId" class="autocomplete-item" @click="selectFood(result, index)">
                      <div class="food-name-result">{{ result.name }}</div>
                      <div class="food-calorie-result">{{ result.caloriePer100 }}kcal/100{{ result.baseUnit }}</div>
                    </div>
                    <div v-if="foodSearchResults.length === 0 && mealFoods[index].foodName && mealFoods[index].foodName.length > 0" class="no-results">
                      검색 결과가 없습니다
                    </div>
                  </div>
                </div>

                <div class="food-input-group">
                  <label class="input-label">섭취량 및 단위</label>
                  <div class="amount-inputs">
                    <input
                      v-model.number="food.quantity"
                      type="number"
                      placeholder="100"
                      class="food-input amount-input"
                      min="0"
                      step="1"
                    />
                    <select v-model="food.unit" class="unit-select">
                      <option value="g">g</option>
                      <option value="ml">ml</option>
                      <option value="개">개</option>
                      <option value="인분">인분</option>
                    </select>
                  </div>
                </div>

                <div class="food-input-group">
                  <label class="input-label">칼로리</label>
                  <div class="calorie-input-group">
                    <input
                      :value="food.foodId && food.quantity && food.caloriePer100 ? Math.round(food.caloriePer100 * Number(food.quantity) / 100) : 0"
                      type="text"
                      readonly
                      class="food-input calorie-input"
                    />
                    <span class="calorie-unit">kcal</span>
                  </div>
                </div>

                <button
                  class="remove-btn"
                  @click="removeFoodRow(index)"
                  title="삭제"
                  :disabled="mealFoods.length === 1 && !mealId"
                >×</button>
              </div>
              <div v-if="mealFoods.length === 0" class="empty-food-list">음식을 추가해주세요</div>
            </div>

            <div v-else class="food-list-view">
              <div v-for="(food, index) in mealFoods" :key="index" class="food-item-view">
                <div class="food-name-view">{{ food.foodName }}</div>
                <div class="food-details-view">
                  <span class="food-quantity-view">{{ food.quantity }}{{ food.unit }}</span>
                  <span class="food-calorie-badge">
                    {{ Math.round(food.caloriePer100 * food.quantity / 100) }} kcal
                  </span>
                </div>
              </div>
              <div v-if="mealFoods.length === 0" class="empty-food-list">등록된 음식이 없습니다</div>
            </div>
          </div>

          <!-- 각 음식별 영양소 상세 표 -->
          <div v-if="foodNutritionDetails.length > 0" class="nutrition-table-section">
            <h2 class="section-label">각 음식별 영양소</h2>
            <div class="table-container">
              <table class="nutrition-table">
                <thead>
                  <tr>
                    <th>음식</th>
                    <th>섭취량</th>
                    <th>칼로리</th>
                    <th>단백질</th>
                    <th>탄수화물</th>
                    <th>지방</th>
                    <th>당류</th>
                    <th>나트륨</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(foodData, index) in foodNutritionDetails" :key="index" :class="{ 'no-data': !foodData.foodName || foodData.foodName === '미선택' }">
                    <td class="food-name">{{ foodData.foodName || '-' }}</td>
                    <td class="quantity">{{ foodData.quantity }}</td>
                    <td class="calorie">{{ foodData.nutrition.calorie }} {{ NUTRIENT_UNITS.calorie }}</td>
                    <td>{{ foodData.nutrition.protein }} {{ NUTRIENT_UNITS.protein }}</td>
                    <td>{{ foodData.nutrition.carbs }} {{ NUTRIENT_UNITS.carbs }}</td>
                    <td>{{ foodData.nutrition.fat }} {{ NUTRIENT_UNITS.fat }}</td>
                    <td>{{ foodData.nutrition.sugar }} {{ NUTRIENT_UNITS.sugar }}</td>
                    <td>{{ foodData.nutrition.sodium }} {{ NUTRIENT_UNITS.sodium }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

                    <div v-if="mealFoods.length > 0 && totalNutrients.calorie === 0" class="nutrition-table-section no-data-section">
            <h2 class="section-label">각 음식별 영양소</h2>
            <p class="chart-message">선택된 음식에 영양소 정보가 없어 표를 표시할 수 없습니다.</p>
          </div>

          <div v-if="isEditMode" class="form-actions">
            <button type="button" class="cancel-btn" @click="cancelEdit" :disabled="isSaving">취소</button>
            <button
              type="button"
              class="submit-btn"
              @click="saveMeal"
              :disabled="isSaving || mealFoods.filter(f => f.foodId && Number(f.quantity) > 0).length === 0"
              :class="{ disabled: isSaving || mealFoods.filter(f => f.foodId && Number(f.quantity) > 0).length === 0 }"
            >
              {{ isSaving ? '저장 중...' : (mealId ? '수정' : '등록') }}
            </button>
          </div>

          <div v-else class="form-actions">
            <button type="button" class="cancel-btn" @click="handleCancel">목록으로</button>
            <button type="button" class="edit-mode-btn" @click="enterEditMode">수정</button>
          </div>
        </div>

        <div v-else class="loading-state">데이터를 불러오는 중...</div>
      </div>
    </main>

    <div v-if="showToast" class="toast-message">
      <div class="toast-icon">✓</div>
      <span class="toast-text">{{ toastMessage }}</span>
    </div>
  </div>
</template>

<style scoped>
.meal-detail-container {
  min-height: 100vh;
  background-color: #F5F7FA;
}

.main-content { padding: 40px; }
.content-wrapper { max-width: 1000px; margin: 0 auto; }

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
  from { transform: translateY(-10px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.page-header { margin-bottom: 32px; }
.page-title {
  font-size: 32px;
  font-weight: 700;
  color: #333333;
}

.form-card {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 40px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.nutrient-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 20px;
  background: linear-gradient(135deg, #4CAF50 0%, #45A049 100%);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 32px;
  color: #FFFFFF;
}

.summary-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.summary-item.calorie {
  grid-column: 1 / -1; /* 칼로리 항목이 전체 너비를 차지하도록 설정 */
  font-size: 28px;
  font-weight: 700;
  padding-bottom: 20px;
  margin-bottom: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.summary-label {
  font-size: 14px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}

.summary-value {
  font-size: 22px;
  font-weight: 700;
}

.summary-item.calorie .summary-label {
  font-size: 16px;
  margin-bottom: 12px;
}

.summary-item.calorie .summary-value {
  font-size: 36px;
}

/* 영양소 표 스타일 */
.nutrition-table-section {
  margin-bottom: 32px;
  background: #fdfdfd;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.05);
}

.nutrition-table-section.no-data-section {
  padding: 30px;
  text-align: center;
  border: 1px solid #f0f0f0;
}

.nutrition-table-section .section-label {
  margin-bottom: 20px;
  color: #4CAF50;
  font-size: 18px;
  font-weight: 700;
}

.table-container {
  overflow-x: auto;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.nutrition-table {
  width: 100%;
  border-collapse: collapse;
  background: #FFFFFF;
  min-width: 800px;
}

.nutrition-table th {
  background: linear-gradient(135deg, #4CAF50 0%, #45A049 100%);
  color: #FFFFFF;
  padding: 16px 12px;
  text-align: left;
  font-weight: 600;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.nutrition-table td {
  padding: 16px 12px;
  border-bottom: 1px solid #f0f0f0;
  font-size: 14px;
}

.nutrition-table tr:hover {
  background: #F8F9FA;
}

.nutrition-table .food-name {
  font-weight: 600;
  color: #333333;
  min-width: 200px;
}

.nutrition-table .quantity {
  font-weight: 500;
  color: #666666;
}

.nutrition-table .calorie {
  font-weight: 700;
  color: #4CAF50;
}

.nutrition-table .no-data {
  opacity: 0.5;
  background: #f8f9fa;
}

.nutrition-table .no-data td {
  color: #999999;
}

/* 기존 스타일들 유지 (간략화) */
.food-list-section { margin-bottom: 32px; }
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-label {
  font-size: 18px;
  font-weight: 700;
  color: #333333;
  margin: 0;
}

.add-food-btn {
  padding: 10px 20px;
  background: #4CAF50;
  color: #FFFFFF;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.add-food-btn:hover { background: #45A049; }

.food-list-edit { display: flex; flex-direction: column; gap: 20px; }

.food-row {
  display: grid;
  grid-template-columns: 2.5fr 2fr 1.5fr auto;
  gap: 16px;
  align-items: flex-end;
  padding: 20px;
  background: #FFFFFF;
  border-radius: 12px;
  border: 2px solid #E8E8E8;
  transition: all 0.3s ease;
}

.food-row:hover {
  border-color: #4CAF50;
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.1);
}

.food-input-group { display: flex; flex-direction: column; gap: 8px; }

.input-label {
  font-size: 13px;
  font-weight: 700;
  color: #4CAF50;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 2px;
}

.amount-inputs { display: flex; gap: 8px; align-items: stretch; }
.amount-input { flex: 1; min-width: 0; }

.unit-select {
  padding: 12px 16px;
  border: 2px solid #E0E0E0;
  border-radius: 8px;
  font-size: 15px;
  color: #333333;
  background: #FFFFFF;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 90px;
  font-weight: 600;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23333' d='M6%209L1%204h10z'/%3E%3C/path%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 36px;
}

.unit-select:focus {
  outline: none;
  border-color: #4CAF50;
  box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1);
}

.unit-select:hover { border-color: #4CAF50; }

.calorie-input-group { display: flex; gap: 8px; align-items: center; }
.calorie-input { flex: 1; }
.calorie-unit {
  font-size: 15px;
  color: #666666;
  font-weight: 600;
  min-width: 45px;
}

.autocomplete-wrapper { position: relative; }

.food-input {
  padding: 14px 18px;
  border: 1px solid #E0E0E0;
  border-radius: 8px;
  font-size: 16px;
  color: #333333;
  background: #FFFFFF;
  transition: border-color 0.3s ease;
  width: 100%;
  min-height: 48px;
}

.food-input:focus { outline: none; border-color: #4CAF50; }
.food-input::placeholder { color: #AAAAAA; }
.food-input:read-only { background: #F5F5F5; cursor: not-allowed; }

.autocomplete-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: #FFFFFF;
  border: 1px solid #E0E0E0;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  max-height: 300px;
  overflow-y: auto;
  z-index: 100;
}

.autocomplete-item {
  padding: 12px 16px;
  cursor: pointer;
  transition: background 0.2s ease;
  border-bottom: 1px solid #F0F0F0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.autocomplete-item:last-child { border-bottom: none; }
.autocomplete-item:hover { background: #F5F5F5; }

.food-name-result { font-size: 15px; color: #333333; font-weight: 500; }
.food-calorie-result { font-size: 13px; color: #4CAF50; font-weight: 600; }

.no-results {
  padding: 16px;
  text-align: center;
  color: #999999;
  font-size: 14px;
}

.remove-btn {
  width: 44px;
  height: 48px;
  background: #FFE0E0;
  color: #F44336;
  border: none;
  border-radius: 8px;
  font-size: 20px;
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

.remove-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.empty-food-list {
  padding: 40px;
  text-align: center;
  color: #999999;
  font-size: 14px;
  background: #F8F9FA;
  border-radius: 8px;
  border: 2px dashed #E0E0E0;
}

.food-list-view { display: flex; flex-direction: column; gap: 16px; }

.food-item-view {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #FFFFFF;
  border-radius: 12px;
  padding: 20px;
  border: 2px solid #E8E8E8;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
  gap: 16px;
}

.food-item-view:hover {
  border-color: #4CAF50;
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.12);
  transform: translateY(-2px);
}

.food-name-view {
  font-size: 17px;
  font-weight: 600;
  color: #333333;
  flex: 1;
}

.food-details-view {
  display: flex;
  align-items: center;
  gap: 16px;
  white-space: nowrap;
}

.food-quantity-view {
  font-size: 15px;
  color: #666666;
  font-weight: 600;
}

.food-calorie-badge {
  background: linear-gradient(135deg, #4CAF50 0%, #45A049 100%);
  color: #FFFFFF;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 700;
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.25);
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 40px;
}

.chart-message {
  color: #777;
  font-size: 14px;
  margin-top: 10px;
}

.cancel-btn, .submit-btn {
  padding: 14px 32px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.cancel-btn {
  background: transparent;
  border: 1px solid #E0E0E0;
  color: #666666;
}

.cancel-btn:hover:not(:disabled) {
  border-color: #333333;
  color: #333333;
}

.cancel-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.submit-btn {
  background: #4CAF50;
  border: none;
  color: #FFFFFF;
}

.submit-btn:hover:not(:disabled) {
  background: #45A049;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
}

.submit-btn.disabled {
  background: #CCCCCC;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.edit-mode-btn {
  background: #4CAF50;
  border: none;
  color: #FFFFFF;
  padding: 14px 32px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.edit-mode-btn:hover {
  background: #45A049;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
}

.loading-state {
  padding: 60px;
  text-align: center;
  color: #999999;
  font-size: 16px;
}

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
  from { transform: translateX(-50%) translateY(20px); opacity: 0; }
  to { transform: translateX(-50%) translateY(0); opacity: 1; }
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
  .food-row { grid-template-columns: 2fr 1.5fr 1fr auto; gap: 12px; }
  .food-input { font-size: 15px; padding: 12px 16px; }
}

@media (max-width: 768px) {
  .main-content { padding: 20px; }
  .page-title { font-size: 24px; }
  .form-card { padding: 24px; }
  .calorie-summary {
    flex-direction: column;
    gap: 8px;
    text-align: center;
    padding: 16px 20px;
  }
  .calorie-label { font-size: 14px; }
  .calorie-value { font-size: 24px; }
  .section-label { font-size: 16px; }
  .add-food-btn { font-size: 14px; padding: 8px 16px; }
  .food-row { grid-template-columns: 1fr; gap: 12px; padding: 16px; }
  .food-input { font-size: 15px; }
  .input-label { font-size: 12px; }
  .unit-select { font-size: 14px; min-width: 80px; }
  .remove-btn { width: 100%; height: 44px; }
  .food-item-view {
    padding: 16px;
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  .food-details-view { width: 100%; justify-content: space-between; }
  .form-actions { flex-direction: column; gap: 10px; }
  .cancel-btn, .submit-btn, .edit-mode-btn { width: 100%; }
  .toast-message { bottom: 20px; max-width: 90%; padding: 12px 20px; }
  .nutrition-table { font-size: 13px; }
  .nutrition-table th, .nutrition-table td { padding: 12px 8px; }
}

@media (max-width: 480px) {
  .main-content { padding: 16px; }
  .page-title { font-size: 20px; }
  .form-card { padding: 20px; }
  .nutrition-table { min-width: 600px; }
}
</style>

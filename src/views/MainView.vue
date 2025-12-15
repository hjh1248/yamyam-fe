<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import { dietPlanApi, dailyDietApi } from '@/api/diet.js'
import { formatDate } from '@/utils/date.js'
import { calculateDailyTotalCalorie } from '@/utils/nutrition.js' // Import from nutrition.js

const router = useRouter()

// - todayMeals는 API로부터 가져온 데이터로 채워집니다.
const todayMeals = ref([])
const currentDietPlanId = ref(null) // 현재 대표 식단 계획 ID
const currentDailyDietId = ref(null) // 현재 일일 식단 ID
const hasDailyDiet = ref(false) // 오늘 등록된 일일 식단이 있는지 여부
const hasPrimaryDietPlan = ref(false) // 대표 식단이 있는지 여부

// --- Helper Functions ---
const mealTypeToKorean = {
  breakfast: '아침',
  lunch: '점심',
  dinner: '저녁',
  snack: '간식'
}

const mealTypeToEnglishUpperCase = {
  breakfast: 'BREAKFAST',
  lunch: 'LUNCH',
  dinner: 'DINNER',
  snack: 'SNACK'
}

const mealTypeColorClass = (mealType) => {
  switch (mealType) {
    case '아침': return 'meal-type-breakfast';
    case '점심': return 'meal-type-lunch';
    case '저녁': return 'meal-type-dinner';
    case '간식': return 'meal-type-snack';
    default: return '';
  }
}

const calculateTotalCalories = (mealFoods) => {
  if (!mealFoods || mealFoods.length === 0) {
    return 0
  }
  return Math.round(
    mealFoods.reduce((total, food) => {
      const calories = (food.quantity / 100) * food.energyPer100
      return total + (calories || 0)
    }, 0)
  )
}

const transformDailyDiet = (dailyDiet, dietPlanId, dailyDietId) => {
  if (!dailyDiet) return []

  const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack']
  return mealTypes.map((mealType) => {
    let mealContent = dailyDiet[mealType] // Can be array, object, or null
    let foods = []
    let calorie = 0
    let mealId = null

    if (mealContent) {
      if (Array.isArray(mealContent)) {
        // If it's directly an array of foods (as per API doc)
        foods = mealContent.map((food) => food.foodName)
        calorie = calculateTotalCalories(mealContent)
        // No mealId available at this level if it's just an array of foods
      } else if (typeof mealContent === 'object') {
        // If it's an object containing meal details (as per console log's breakfast:{...})
        mealId = mealContent.mealId
        const mealFoodsArray = mealContent.mealFoods || []
        foods = mealFoodsArray.map((food) => food.foodName)
        calorie = calculateTotalCalories(mealFoodsArray)
      }
    }

    return {
      type: mealTypeToKorean[mealType],
      rawType: mealTypeToEnglishUpperCase[mealType],
      foods,
      calorie,
      dietPlanId: dietPlanId,
      dailyDietId: dailyDietId,
      mealId: mealId // Add mealId to the returned object
    }
  })
}

// --- Data Fetching ---
const fetchTodayMeals = async () => {
  try {
    // 1. 대표 식단 계획 ID 가져오기
    const primaryPlanResponse = await dietPlanApi.getPrimary()
    console.log('primaryPlanResponse:', primaryPlanResponse)
    const primaryPlanId = primaryPlanResponse.data?.dietPlanId
    console.log('primaryPlanId:', primaryPlanId)

    if (!primaryPlanId) {
      console.warn('대표 식단 계획을 찾을 수 없습니다.')
      hasPrimaryDietPlan.value = false // Set ref to false if no primary plan
      todayMeals.value = [
        { type: '아침', foods: [], calorie: 0 },
        { type: '점심', foods: [], calorie: 0 },
        { type: '저녁', foods: [], calorie: 0 },
        { type: '간식', foods: [], calorie: 0 } // 간식 추가
      ]
      hasDailyDiet.value = false // 대표 식단이 없으므로 일일 식단도 없음
      currentDailyDietId.value = null
      return
    }

    // If primaryPlanId exists
    hasPrimaryDietPlan.value = true // Set ref to true if primary plan exists
    currentDietPlanId.value = primaryPlanId

    // 2. 오늘 날짜로 일일 식단 가져오기
    const today = formatDate(new Date())
    console.log('today (formatted date):', today)
    const dailyDietResponse = await dailyDietApi.getByDate(primaryPlanId, today)
    console.log('dailyDietResponse:', dailyDietResponse)
    const dailyDiet = dailyDietResponse.data
    console.log('dailyDietResponse.data:', dailyDiet)

    if (dailyDiet?.dailyDietId) {
      hasDailyDiet.value = true
      currentDailyDietId.value = dailyDiet.dailyDietId
      // 3. 데이터 변환 및 상태 업데이트
      todayMeals.value = transformDailyDiet(dailyDiet, primaryPlanId, dailyDiet.dailyDietId)
      console.log('todayMeals.value after transformation:', todayMeals.value)
    } else {
      hasDailyDiet.value = false // 일일 식단이 없으므로
      todayMeals.value = [
        { type: '아침', foods: [], calorie: 0 },
        { type: '점심', foods: [], calorie: 0 },
        { type: '저녁', foods: [], calorie: 0 },
        { type: '간식', foods: [], calorie: 0 } // 간식 추가
      ]
      // 일일 식단이 없는 경우 dailyDietId를 null로 설정
      currentDailyDietId.value = null
    }
  } catch (error) {
    console.error('오늘의 식단을 가져오는 데 실패했습니다:', error)
    hasDailyDiet.value = false // 에러 발생 시 일일 식단 없음
    todayMeals.value = [
        { type: '아침', foods: [], calorie: 0 },
        { type: '점심', foods: [], calorie: 0 },
        { type: '저녁', foods: [], calorie: 0 },
        { type: '간식', foods: [], calorie: 0 } // 간식 추가
    ]
    currentDailyDietId.value = null
  }
}

onMounted(() => {
  fetchTodayMeals()
})

const nutritionAnalysis = ref({
  totalCalorie: 830,
  targetCalorie: 2000,
  protein: 45,
  carbs: 120,
  fat: 25
})

const aiComment = ref('오늘 아침과 점심 식단이 균형잡혀 있어요! 저녁에는 단백질과 채소 위주로 드시는 것을 추천합니다.')

const challenges = ref([
  { title: '30일 저탄수화물 챌린지', progress: 60, daysLeft: 12 },
  { title: '매일 채소 5가지 먹기', progress: 85, daysLeft: 5 },
])

const recentPosts = ref([
  { title: '다이어트 식단 공유합니다!', author: '건강러버', likes: 24 },
  { title: '저염식 레시피 추천', author: '요리왕', likes: 18 },
  { title: '간헐적 단식 후기', author: '다이어터', likes: 32 },
])
</script>

<template>
  <div class="main-container">
    <!-- 상단 네비게이션 -->
    <AppHeader active-page="main" />

    <!-- 메인 콘텐츠 -->
    <main class="main-content">
      <div class="content-wrapper">
        <!-- 환영 메시지 -->
        <div class="welcome-section">
          <h1 class="welcome-title">안녕하세요, 홍길동님! 👋</h1>
          <p class="welcome-subtitle">오늘도 건강한 하루 되세요</p>
        </div>

        <!-- 그리드 레이아웃 -->
        <div class="grid-container">
          <!-- 오늘의 식단 -->
          <div class="card large-card">
            <div class="card-header">
              <h2 class="card-title">오늘의 식단</h2>
              <button
                class="diet-detail-edit-btn"
                @click="router.push({
                  name: 'diet-plan-detail', // Changed from 'edit-diet'
                  query: {
                    id: currentDietPlanId
                  }
                })"
                :disabled="!currentDietPlanId"
              >
                식단 상세
              </button>
            </div>
            <div v-if="hasPrimaryDietPlan">
              <div v-if="hasDailyDiet" class="meals-list">
                <div v-for="meal in todayMeals" :key="meal.type" class="meal-item">
                  <div class="meal-header">
                    <span :class="['meal-type', mealTypeColorClass(meal.type)]">{{ meal.type }}</span>
                    <span class="meal-calorie">{{ meal.calorie }}kcal</span>
                  </div>
                                  <div class="meal-foods">
                                    <div
                                      v-if="meal.foods.length > 0"
                                      class="meal-actions"
                                    >
                                      <div class="food-list-container">
                                        <span v-for="(foodName, index) in meal.foods" :key="index" class="food-item-display">
                                          {{ foodName }}
                                        </span>
                                      </div>
                                    
                                    </div>
                                    <div v-else class="empty-meal-container">
                                      <button
                                        class="meal-add-btn"
                                        @click="router.push({
                                          name: 'meal-detail',
                                          query: {
                                            dietPlanId: currentDietPlanId,
                                            dailyDietId: currentDailyDietId,
                                            mealType: meal.rawType
                                          }
                                        })"
                                      >+ 식단 추가</button>
                                    </div>
                                  </div>
                </div>
              </div>
              <div v-else class="no-daily-diet-message">
                오늘 등록된 식단이 없습니다.
              </div>
            </div>
            <div v-else class="empty-primary-diet-plan">
              <p class="empty-message">대표 식단 계획이 설정되지 않았습니다.</p>
              <button class="create-diet-plan-btn" @click="router.push('/diet/add')">
                식단 생성하러 가기
              </button>
            </div>
          </div>

          <!-- AI 영양 분석 -->
          <div class="card">
            <div class="card-header">
              <h2 class="card-title">AI 영양 분석</h2>
            </div>
            <div class="nutrition-stats">
              <div class="calorie-progress">
                <div class="progress-circle">
                  <svg width="140" height="140" viewBox="0 0 140 140">
                    <circle cx="70" cy="70" r="60" fill="none" stroke="#E8F5E9" stroke-width="12"/>
                    <circle cx="70" cy="70" r="60" fill="none" stroke="#4CAF50" stroke-width="12"
                      :stroke-dasharray="`${nutritionAnalysis.totalCalorie / nutritionAnalysis.targetCalorie * 377} 377`"
                      stroke-linecap="round" transform="rotate(-90 70 70)"/>
                  </svg>
                  <div class="progress-text">
                    <div class="calorie-info">
                      <div class="calorie-current">{{ nutritionAnalysis.totalCalorie }}</div>
                      <div class="calorie-divider">kcal</div>
                    </div>
                    <div class="calorie-target">목표 {{ nutritionAnalysis.targetCalorie }}kcal</div>
                    <div class="calorie-percent">{{ Math.round(nutritionAnalysis.totalCalorie / nutritionAnalysis.targetCalorie * 100) }}%</div>
                  </div>
                </div>
              </div>

              <div class="nutrition-details">
                <div class="nutrition-item">
                  <span class="nutrition-label">단백질</span>
                  <span class="nutrition-value">{{ nutritionAnalysis.protein }}g</span>
                </div>
                <div class="nutrition-item">
                  <span class="nutrition-label">탄수화물</span>
                  <span class="nutrition-value">{{ nutritionAnalysis.carbs }}g</span>
                </div>
                <div class="nutrition-item">
                  <span class="nutrition-label">지방</span>
                  <span class="nutrition-value">{{ nutritionAnalysis.fat }}g</span>
                </div>
              </div>

              <div class="ai-comment">
                <div class="ai-icon">🤖</div>
                <p class="ai-text">{{ aiComment }}</p>
              </div>
            </div>
          </div>

          <!-- 진행 중인 챌린지 -->
          <div class="card">
            <div class="card-header">
              <h2 class="card-title">진행 중인 챌린지</h2>
              <router-link to="/challenge" class="view-all">전체보기</router-link>
            </div>
            <div class="challenge-list">
              <div v-for="challenge in challenges" :key="challenge.title" class="challenge-item">
                <div class="challenge-info">
                  <h3 class="challenge-title">{{ challenge.title }}</h3>
                  <p class="challenge-days">{{ challenge.daysLeft }}일 남음</p>
                </div>
                <div class="challenge-progress">
                  <div class="progress-bar">
                    <div class="progress-fill" :style="{ width: challenge.progress + '%' }"></div>
                  </div>
                  <span class="progress-percentage">{{ challenge.progress }}%</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 최근 게시글 -->
          <div class="card">
            <div class="card-header">
              <h2 class="card-title">커뮤니티 최근 글</h2>
              <router-link to="/board" class="view-all">전체보기</router-link>
            </div>
            <div class="post-list">
              <div v-for="post in recentPosts" :key="post.title" class="post-item">
                <div class="post-content">
                  <h3 class="post-title">{{ post.title }}</h3>
                  <p class="post-author">{{ post.author }}</p>
                </div>
                <div class="post-likes">
                  <span class="like-icon">❤️</span>
                  <span class="like-count">{{ post.likes }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.main-container {
  min-height: 100vh;
  background-color: #F5F7FA;
}

/* 메인 콘텐츠 */
.main-content {
  padding: 40px;
}

.content-wrapper {
  max-width: 1400px;
  margin: 0 auto;
}

.welcome-section {
  margin-bottom: 40px;
}

.welcome-title {
  font-size: 32px;
  font-weight: 700;
  color: #333333;
  margin-bottom: 8px;
}

.welcome-subtitle {
  font-size: 16px;
  color: #888888;
}

/* 그리드 */
.grid-container {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}

/* 카드 */
.card {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: box-shadow 0.3s ease;
}

.card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.large-card {
  grid-column: span 2;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.card-title {
  font-size: 20px;
  font-weight: 700;
  color: #333333;
}

.diet-detail-edit-btn {
  padding: 8px 16px;
  background: #E0E0E0; /* A neutral background */
  color: #333333;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.3s ease, color 0.3s ease;
}

.diet-detail-edit-btn:hover:not(:disabled) {
  background: #CCCCCC; /* Darker on hover */
  color: #111111;
}

.diet-detail-edit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.add-btn {
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

.add-btn:hover {
  background: #45A049;
}

.view-all {
  color: #4CAF50;
  text-decoration: none;
  font-size: 14px;
  font-weight: 600;
  transition: color 0.3s ease;
}

.view-all:hover {
  color: #45A049;
}

/* 식단 목록 */
.meals-list {
  display: flex;
  gap: 16px;
}

.meal-item {
  flex: 1;
  padding: 16px;
  background: #F8F9FA;
  border-radius: 8px;
}

.meal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.meal-type {
  font-weight: 700;
  color: #4CAF50; /* Default green, will be overridden by specific types */
  font-size: 16px;
}

/* Meal Type Specific Colors */
.meal-type-breakfast {
  color: #FF9800; /* Orange - more noticeable */
}

.meal-type-lunch {
  color: #2196F3; /* Blue - fresh blue */
}

.meal-type-dinner {
  color: #9C27B0; /* Deep Purple - rich purple */
}

.meal-type-snack {
  color: #E91E63; /* Pink - vibrant pink */
}

.meal-calorie {
  font-size: 14px;
  color: #666666;
  font-weight: 600;
}

.meal-foods {
  min-height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-meal-container {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.meal-add-btn {
  padding: 10px 20px;
  background: #FFFFFF;
  border: 2px dashed #4CAF50;
  border-radius: 6px;
  color: #4CAF50;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.meal-add-btn:hover {
  background: #E8F5E9;
  border-style: solid;
}

.food-list-message { /* Renamed for clarity, original was food-list */
  color: #333333;
  font-size: 14px;
  line-height: 1.6;
  flex-grow: 1; /* Allow it to take available space */
}

.meal-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  gap: 10px; /* Add some space between food list and button */
}

.meal-detail-btn {
  padding: 8px 12px;
  background: #4CAF50;
  color: #FFFFFF;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap; /* Prevent text wrapping */
  transition: background 0.3s ease;
}

.meal-detail-btn:hover {
  background: #45A049;
}

.food-list-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px; /* Space between food items */
  flex-grow: 1; /* Allow container to take available space */
}

.food-item-display {
  background-color: #E8F5E9; /* Lighter, more vibrant background */
  border: 1px solid #A5D6A7; /* Matching border color */
  border-radius: 20px; /* Pill shape */
  padding: 6px 12px;
  font-size: 13px;
  color: #333333;
  white-space: nowrap;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1); /* Subtle shadow for "lift" */
  transition: all 0.2s ease;
}

.food-item-display:hover {
  box-shadow: 0 2px 6px rgba(0,0,0,0.15); /* Slightly more prominent shadow on hover */
  transform: translateY(-1px);
}

/* AI 영양 분석 */
.nutrition-stats {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.calorie-progress {
  display: flex;
  justify-content: center;
}

.progress-circle {
  position: relative;
}

.progress-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.calorie-info {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.calorie-current {
  font-size: 32px;
  font-weight: 700;
  color: #4CAF50;
  line-height: 1;
}

.calorie-divider {
  font-size: 14px;
  color: #4CAF50;
  font-weight: 600;
}

.calorie-target {
  font-size: 12px;
  color: #888888;
  margin-top: 2px;
}

.calorie-percent {
  font-size: 16px;
  font-weight: 700;
  color: #333333;
  margin-top: 4px;
}

.nutrition-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.nutrition-item {
  display: flex;
  justify-content: space-between;
  padding: 12px;
  background: #F8F9FA;
  border-radius: 6px;
}

.nutrition-label {
  color: #666666;
  font-size: 14px;
}

.nutrition-value {
  color: #333333;
  font-weight: 600;
  font-size: 14px;
}

.ai-comment {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: #E8F5E9;
  border-radius: 8px;
}

.ai-icon {
  font-size: 24px;
}

.ai-text {
  color: #2E7D32;
  font-size: 14px;
  line-height: 1.6;
  flex: 1;
}

/* 챌린지 */
.challenge-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.challenge-item {
  padding: 16px;
  background: #F8F9FA;
  border-radius: 8px;
}

.challenge-info {
  margin-bottom: 12px;
}

.challenge-title {
  font-size: 15px;
  font-weight: 600;
  color: #333333;
  margin-bottom: 4px;
}

.challenge-days {
  font-size: 13px;
  color: #FFA726;
}

.challenge-progress {
  display: flex;
  align-items: center;
  gap: 12px;
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: #E0E0E0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #4CAF50;
  transition: width 0.3s ease;
}

.progress-percentage {
  font-size: 13px;
  font-weight: 600;
  color: #4CAF50;
  min-width: 40px;
  text-align: right;
}

/* 게시글 */
.post-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.post-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #F8F9FA;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.3s ease;
}

.post-item:hover {
  background: #E8F5E9;
}

.post-content {
  flex: 1;
}

.post-title {
  font-size: 14px;
  font-weight: 600;
  color: #333333;
  margin-bottom: 4px;
}

.post-author {
  font-size: 12px;
  color: #888888;
}

.post-likes {
  display: flex;
  align-items: center;
  gap: 4px;
}

.like-icon {
  font-size: 14px;
}

.like-count {
  font-size: 13px;
  color: #666666;
  font-weight: 600;
}

/* 반응형 */
@media (max-width: 968px) {
  .main-content {
    padding: 20px;
  }

  .grid-container {
    grid-template-columns: 1fr;
  }

  .large-card {
    grid-column: span 1;
  }

  .meals-list {
    flex-direction: column;
  }

  .modal-content {
    width: 95%;
  }
}

.no-daily-diet-message {
  padding: 40px;
  text-align: center;
  color: #666666;
  font-size: 16px;
  background: #F8F9FA;
  border-radius: 12px;
  border: 2px dashed #E0E0E0;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 150px;
  line-height: 1.5;
  font-weight: 500;
}

.empty-primary-diet-plan {
  padding: 40px;
  text-align: center;
  background: #F8F9FA;
  border-radius: 12px;
  border: 2px dashed #FFCC80; /* A color that stands out but isn't error-like */
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  line-height: 1.5;
  font-weight: 500;
}

.create-diet-plan-btn {
  margin-top: 20px;
  padding: 12px 24px;
  background: #FF9800; /* Orange color for action */
  color: #FFFFFF;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(255, 152, 0, 0.3);
}

.create-diet-plan-btn:hover {
  background: #FB8C00; /* Darker orange on hover */
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 152, 0, 0.4);
}

</style>
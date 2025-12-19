<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import api from '@/util/axios'
import { dietPlanApi, dailyDietApi } from '@/api/diet.js'
import { formatDate } from '@/utils/date.js'

const router = useRouter()

// ==========================================
// 1. 상태 변수 (State)
// ==========================================

const userInfo = ref({ name: '', nickname: '게스트', email: '' })
const followStats = ref({ followers: 0, following: 0 })

const todayMeals = ref([])
const currentDietPlanId = ref(null)
const currentDailyDietId = ref(null)
const hasDailyDiet = ref(false)
const hasPrimaryDietPlan = ref(false)

const bodySpecs = ref([])
const showAddModal = ref(false)
const showDeleteModal = ref(false)
const deleteTargetId = ref(null)
const newBodySpec = ref({
  height: '', weight: '', age: '', gender: '남성',
  created_at: new Date().toISOString().split('T')[0]
})

// [수정] 챌린지 데이터 (실제 데이터용)
const myChallenges = ref([])

const showToast = ref(false)
const toastMessage = ref('')

// ==========================================
// 2. Helper Functions
// ==========================================

const calculateDday = (endDate) => {
    if (!endDate) return 0;
    const diff = new Date(endDate) - new Date();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days >= 0 ? days : 0;
}

const mealTypeToKorean = { breakfast: '아침', lunch: '점심', dinner: '저녁', snack: '간식' }
const mealTypeToEnglishUpperCase = { breakfast: 'BREAKFAST', lunch: 'LUNCH', dinner: 'DINNER', snack: 'SNACK' }

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
  if (!mealFoods || mealFoods.length === 0) return 0
  return Math.round(mealFoods.reduce((total, food) => {
      const calories = (food.quantity / 100) * food.energyPer100
      return total + (calories || 0)
    }, 0))
}

const transformDailyDiet = (dailyDiet, dietPlanId, dailyDietId) => {
  if (!dailyDiet) return []
  const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack']
  return mealTypes.map((mealType) => {
    let mealContent = dailyDiet[mealType]
    let foods = [], calorie = 0, mealId = null

    if (mealContent) {
      if (Array.isArray(mealContent)) {
        foods = mealContent.map((food) => food.foodName)
        calorie = calculateTotalCalories(mealContent)
      } else if (typeof mealContent === 'object') {
        mealId = mealContent.mealId
        const mealFoodsArray = mealContent.mealFoods || []
        foods = mealFoodsArray.map((food) => food.foodName)
        calorie = calculateTotalCalories(mealFoodsArray)
      }
    }
    return {
      type: mealTypeToKorean[mealType],
      rawType: mealTypeToEnglishUpperCase[mealType],
      foods, calorie, dietPlanId, dailyDietId, mealId
    }
  })
}

// 차트 관련
const chartWidth = 800, chartHeight = 300, chartPadding = { top: 20, right: 40, bottom: 60, left: 60 }

const chartData = computed(() => {
  return [...bodySpecs.value].sort((a, b) => new Date(a.date) - new Date(b.date)).slice(-10)
})

const weightRange = computed(() => {
  if (chartData.value.length === 0) return { min: 0, max: 100 }
  const weights = chartData.value.map(d => d.weight)
  const min = Math.min(...weights), max = Math.max(...weights)
  const padding = (max - min) * 0.2 || 5
  return { min: Math.floor(min - padding), max: Math.ceil(max + padding) }
})

const getX = (index) => chartPadding.left + ((chartWidth - chartPadding.left - chartPadding.right) / (chartData.value.length - 1 || 1)) * index
const getY = (weight) => chartPadding.top + (chartHeight - chartPadding.top - chartPadding.bottom) - ((weight - weightRange.value.min) / (weightRange.value.max - weightRange.value.min) * (chartHeight - chartPadding.top - chartPadding.bottom))

const chartPath = computed(() => {
  if (chartData.value.length === 0) return ''
  return chartData.value.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.weight)}`).join(' ')
})

const yAxisTicks = computed(() => {
  const step = Math.ceil((weightRange.value.max - weightRange.value.min) / 5)
  const ticks = []
  for (let i = 0; i <= 5; i++) ticks.push({ value: weightRange.value.min + step * i, y: getY(weightRange.value.min + step * i) })
  return ticks.reverse()
})

const latestBodySpec = computed(() => {
  if (bodySpecs.value.length === 0) return null
  return [...bodySpecs.value].sort((a, b) => new Date(b.date) - new Date(a.date))[0]
})

const bmi = computed(() => latestBodySpec.value ? (latestBodySpec.value.weight / Math.pow(latestBodySpec.value.height / 100, 2)).toFixed(1) : 0)

const bmiStatus = computed(() => {
  const v = parseFloat(bmi.value)
  if (v < 18.5) return { text: '저체중', color: '#2196F3' }
  if (v < 23) return { text: '정상', color: '#4CAF50' }
  if (v < 25) return { text: '과체중', color: '#FFA726' }
  return { text: '비만', color: '#F44336' }
})

// ==========================================
// 3. API Actions
// ==========================================

const fetchUserInfo = async () => {
  try {
    const { data } = await api.get('/api/users/me')
    userInfo.value = { name: data.name, nickname: data.nickname, email: data.email }
    followStats.value = { followers: data.followers, following: data.following }
  } catch (e) { console.error(e) }
}

const fetchBodySpecs = async () => {
  try {
    const { data } = await api.get('/api/body-specs')
    bodySpecs.value = data.sort((a, b) => new Date(a.date) - new Date(b.date))
  } catch (e) { console.error(e) }
}

const fetchMyChallenges = async () => {
    try {
        const res = await api.get('/api/challenges/my')
        myChallenges.value = res.data.map(c => ({
            ...c, startDate: formatDate(c.startDate), endDate: formatDate(c.endDate)
        }))
    } catch (e) { console.error(e) }
}

const fetchTodayMeals = async () => {
  try {
    const { data: primaryData } = await dietPlanApi.getPrimary()
    if (!primaryData?.dietPlanId) {
      hasPrimaryDietPlan.value = false; setEmptyMeals(); return;
    }
    hasPrimaryDietPlan.value = true
    currentDietPlanId.value = primaryData.dietPlanId

    const { data: dailyData } = await dailyDietApi.getByDate(primaryData.dietPlanId, formatDate(new Date()))
    if (dailyData?.dailyDietId) {
      hasDailyDiet.value = true
      currentDailyDietId.value = dailyData.dailyDietId
      todayMeals.value = transformDailyDiet(dailyData, primaryData.dietPlanId, dailyData.dailyDietId)
    } else {
      hasDailyDiet.value = false; currentDailyDietId.value = null; setEmptyMeals();
    }
  } catch (e) { hasDailyDiet.value = false; setEmptyMeals(); }
}

const setEmptyMeals = () => {
  todayMeals.value = ['아침', '점심', '저녁', '간식'].map(t => ({ type: t, foods: [], calorie: 0 }))
}

// ==========================================
// 4. Interaction Handlers
// ==========================================

const handleAddBodySpec = async () => {
  if (!newBodySpec.value.height || !newBodySpec.value.weight || !newBodySpec.value.age) return displayToast('모든 필드를 입력해주세요')
  try {
    await api.post('/api/body-specs', { ...newBodySpec.value, created_at: newBodySpec.value.created_at })
    await fetchBodySpecs()
    showAddModal.value = false
    displayToast('신체 정보가 추가되었습니다')
  } catch (e) { displayToast('저장 중 오류가 발생했습니다.') }
}

const deleteBodySpec = (id) => { deleteTargetId.value = id; showDeleteModal.value = true }
const confirmDelete = async () => {
  if (deleteTargetId.value) {
    try { await api.delete(`/api/body-specs/${deleteTargetId.value}`); await fetchBodySpecs(); displayToast('삭제되었습니다') }
    catch (e) { displayToast('삭제 실패') }
    finally { showDeleteModal.value = false }
  }
}

const displayToast = (msg) => { toastMessage.value = msg; showToast.value = true; setTimeout(() => showToast.value = false, 3000) }
const openAddModal = () => {
  if (latestBodySpec.value) {
    newBodySpec.value.height = latestBodySpec.value.height; newBodySpec.value.age = latestBodySpec.value.age; newBodySpec.value.gender = latestBodySpec.value.gender
  }
  showAddModal.value = true
}
const goToFollowPage = (tab) => router.push(`/follow?tab=${tab}`)

onMounted(() => Promise.all([fetchUserInfo(), fetchBodySpecs(), fetchTodayMeals(), fetchMyChallenges()]))
</script>

<template>
  <div class="main-container">
    <AppHeader active-page="main" />

    <main class="main-content">
      <div class="content-wrapper">
        <div class="page-header">
           <h1 class="page-title">안녕하세요, {{ userInfo.nickname || '게스트' }}님! 👋</h1>
           <p class="page-subtitle">오늘도 건강한 하루 되세요</p>
        </div>

        <div class="grid-layout">
          
          <div class="card diet-card">
            <div class="card-header">
              <h2 class="card-title">오늘의 식단</h2>
              <button class="diet-detail-edit-btn"
                @click="router.push({ name: 'diet-plan-detail', query: { id: currentDietPlanId } })"
                :disabled="!currentDietPlanId">
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
                    <div v-if="meal.foods.length > 0" class="food-list-container">
                      <span v-for="(foodName, index) in meal.foods" :key="index" class="food-item-display">
                        {{ foodName }}
                      </span>
                    </div>
                    <div v-else class="empty-meal-container">
                      <button class="meal-add-btn"
                        @click="router.push({
                          name: 'meal-detail',
                          query: { dietPlanId: currentDietPlanId, dailyDietId: currentDailyDietId, mealType: meal.rawType }
                        })">
                        + 식단 추가
                      </button>
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
              <button class="create-diet-plan-btn" @click="router.push('/diet/add')">식단 생성하기</button>
            </div>
          </div>

          <div class="card user-card">
            <div class="card-header">
              <h2 class="card-title">내 정보</h2>
            </div>
            <div class="user-info">
              <div class="info-row"><span class="info-label">이름</span><span class="info-value">{{ userInfo.name }}</span></div>
              <div class="info-row"><span class="info-label">닉네임</span><span class="info-value">{{ userInfo.nickname }}</span></div>
              <div class="info-row"><span class="info-label">이메일</span><span class="info-value">{{ userInfo.email }}</span></div>
            </div>
            <div class="follow-wrapper">
              <div class="follow-section">
                <div class="follow-item" @click="goToFollowPage('followers')">
                  <div class="follow-count">{{ followStats.followers }}</div>
                  <div class="follow-label">팔로워</div>
                </div>
                <div class="follow-divider"></div>
                <div class="follow-item" @click="goToFollowPage('following')">
                  <div class="follow-count">{{ followStats.following }}</div>
                  <div class="follow-label">팔로잉</div>
                </div>
              </div>
              <button class="view-all-btn" @click="goToFollowPage('followers')">
                팔로우 목록 전체보기 >
              </button>
            </div>
          </div>

          <div class="card body-current-card">
            <div class="card-header">
              <h2 class="card-title">현재 신체 정보</h2>
              <button class="add-btn" @click="openAddModal">+ 기록</button>
            </div>
            
            <div v-if="latestBodySpec" class="body-info">
              <div class="body-stats">
                <div class="stat-item">
                  <span class="stat-label">키</span>
                  <span class="stat-value">{{ latestBodySpec.height }}<span class="stat-unit">cm</span></span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">체중</span>
                  <span class="stat-value">{{ latestBodySpec.weight }}<span class="stat-unit">kg</span></span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">나이</span>
                  <span class="stat-value">{{ latestBodySpec.age }}<span class="stat-unit">세</span></span>
                </div>
              </div>

              <div class="bmi-section">
                <div class="bmi-content">
                  <span class="bmi-label">BMI</span>
                  <span class="bmi-value" :style="{ color: bmiStatus.color }">{{ bmi }}</span>
                </div>
                <div class="bmi-status" :style="{ backgroundColor: bmiStatus.color }">
                  {{ bmiStatus.text }}
                </div>
              </div>

              <div class="latest-date">최근 기록: {{ latestBodySpec.date }}</div>
            </div>
            
            <div v-else class="empty-body-info">
              <p class="empty-text">기록이 없습니다.</p>
            </div>
          </div>

          <div class="card chart-card">
            <div class="card-header">
              <h2 class="card-title">체중 변화 추이</h2>
            </div>
            <div v-if="chartData.length >= 2" class="chart-container">
              <svg :width="chartWidth" :height="chartHeight" class="chart-svg">
                <g class="grid-lines">
                  <line v-for="tick in yAxisTicks" :key="tick.value" :x1="chartPadding.left" :y1="tick.y" :x2="chartWidth - chartPadding.right" :y2="tick.y" stroke="#E0E0E0" stroke-dasharray="4"/>
                </g>
                <g class="y-axis">
                  <line :x1="chartPadding.left" :y1="chartPadding.top" :x2="chartPadding.left" :y2="chartHeight - chartPadding.bottom" stroke="#666" stroke-width="2"/>
                  <text v-for="tick in yAxisTicks" :key="tick.value" :x="chartPadding.left - 10" :y="tick.y + 5" text-anchor="end" class="axis-label">{{ tick.value }}kg</text>
                </g>
                <g class="x-axis">
                  <line :x1="chartPadding.left" :y1="chartHeight - chartPadding.bottom" :x2="chartWidth - chartPadding.right" :y2="chartHeight - chartPadding.bottom" stroke="#666" stroke-width="2"/>
                  <text v-for="(d, i) in chartData" :key="i" :x="getX(i)" :y="chartHeight - chartPadding.bottom + 25" text-anchor="middle" class="axis-label">{{ d.date.substring(5) }}</text>
                </g>
                <path :d="chartPath" fill="none" stroke="#4CAF50" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                <g class="data-points">
                  <circle v-for="(d, i) in chartData" :key="i" :cx="getX(i)" :cy="getY(d.weight)" r="6" fill="#4CAF50" stroke="#FFFFFF" stroke-width="2"/>
                  <text v-for="(d, i) in chartData" :key="'label-' + i" :x="getX(i)" :y="getY(d.weight) - 15" text-anchor="middle" class="data-label">{{ d.weight }}kg</text>
                </g>
              </svg>
            </div>
            <div v-else class="empty-chart">
              <p class="empty-text">2개 이상의 기록이 필요합니다.</p>
            </div>
          </div>

          <div class="card history-card">
            <div class="card-header">
              <h2 class="card-title">신체 정보 이력</h2>
            </div>
            <div v-if="bodySpecs.length > 0" class="history-list">
              <div v-for="spec in [...bodySpecs].sort((a, b) => new Date(b.date) - new Date(a.date))" 
                   :key="spec.id" 
                   class="history-item">
                <div class="history-date">{{ spec.date }}</div>
                
                <div class="history-stats">
                  <span class="history-stat">키: {{ spec.height }}cm</span>
                  <span class="history-stat">체중: {{ spec.weight }}kg</span>
                  <span class="history-stat">나이: {{ spec.age }}세</span>
                  <span class="history-stat">성별: {{ spec.gender }}</span>
                </div>
                
                <button class="delete-btn" @click="deleteBodySpec(spec.id)">삭제</button>
              </div>
            </div>
            <div v-else class="empty-history">
              <p class="empty-text">신체 정보 기록이 없습니다</p>
            </div>
          </div>

          <div class="card challenge-card">
            <div class="card-header">
              <h2 class="card-title">참여 중인 챌린지</h2>
              <router-link to="/challenge" class="view-all">전체보기</router-link>
            </div>
            <div v-if="myChallenges.length > 0" class="challenge-list">
              <div v-for="challenge in myChallenges" :key="challenge.id" class="challenge-item">
                <div class="challenge-info">
                  <div class="challenge-header-row">
                    <h3 class="challenge-title">{{ challenge.title }}</h3>
                    <span v-if="challenge.challengeStatus !== 'DELETED'" class="d-day-badge">
                        D-{{ calculateDday(challenge.endDate) }}
                    </span>
                    <span v-else class="status-badge-deleted">삭제됨</span>
                  </div>
                  <p class="challenge-dates">{{ challenge.startDate }} ~ {{ challenge.endDate }}</p>
                </div>
                <div v-if="challenge.challengeStatus !== 'DELETED'" class="challenge-progress">
                  <div class="progress-bar">
                    <div class="progress-fill" :style="{ width: challenge.progress + '%' }"></div>
                  </div>
                  <span class="progress-percentage">{{ challenge.progress }}%</span>
                </div>
              </div>
            </div>
            <div v-else class="empty-challenge">
                <p class="empty-text">참여 중인 챌린지가 없습니다.</p>
                <button class="join-challenge-btn" @click="router.push('/challenge')">챌린지 찾아보기</button>
            </div>
          </div>

        </div>
      </div>
    </main>

    <div v-if="showAddModal" class="modal-overlay" @click="showAddModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2 class="modal-title">신체 정보 추가</h2>
          <button class="modal-close" @click="showAddModal = false">✕</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="handleAddBodySpec" class="body-form">
            <div class="form-group"><label class="form-label">측정일</label><input v-model="newBodySpec.created_at" type="date" class="form-input" required /></div>
            <div class="form-row">
              <div class="form-group"><label class="form-label">키 (cm)</label><input v-model="newBodySpec.height" type="number" class="form-input" required /></div>
              <div class="form-group"><label class="form-label">체중 (kg)</label><input v-model="newBodySpec.weight" type="number" class="form-input" required /></div>
            </div>
            <div class="form-row">
              <div class="form-group"><label class="form-label">나이</label><input v-model="newBodySpec.age" type="number" class="form-input" required /></div>
              <div class="form-group"><label class="form-label">성별</label><select v-model="newBodySpec.gender" class="form-input"><option value="남성">남성</option><option value="여성">여성</option></select></div>
            </div>
            <div class="form-actions"><button type="button" class="cancel-btn" @click="showAddModal = false">취소</button><button type="submit" class="submit-btn">추가</button></div>
          </form>
        </div>
      </div>
    </div>

    <div v-if="showDeleteModal" class="modal-overlay" @click="showDeleteModal = false">
      <div class="modal-content small-modal" @click.stop>
        <div class="modal-body"><p class="modal-message">이 기록을 삭제하시겠습니까?</p></div>
        <div class="modal-footer"><button class="modal-btn cancel-btn-modal" @click="showDeleteModal = false">취소</button><button class="modal-btn delete-btn-modal" @click="confirmDelete">삭제</button></div>
      </div>
    </div>

    <transition name="slide-up"><div v-if="showToast" class="toast-message"><div class="toast-icon">✓</div><span class="toast-text">{{ toastMessage }}</span></div></transition>
  </div>
</template>

<style scoped>
/* ========================================= */
/* 1. 기본 레이아웃 & 공통 스타일 */
/* ========================================= */
.main-container { min-height: 100vh; background-color: #F5F7FA; }
.main-content { padding: 40px; }
.content-wrapper { max-width: 1400px; margin: 0 auto; }
.page-header { margin-bottom: 30px; }
.page-title { font-size: 28px; font-weight: 700; color: #333; margin-bottom: 4px; }
.page-subtitle { font-size: 16px; color: #888; }

.grid-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }

/* 카드 공통 - 호버 효과 복구 ★ */
.card { 
  background: #FFFFFF; border-radius: 12px; padding: 24px; 
  box-shadow: 0 2px 8px rgba(0,0,0,0.06); 
  transition: transform 0.2s ease, box-shadow 0.2s ease; /* 부드러운 움직임 */
}
.card:hover {
  transform: translateY(-4px); /* 위로 살짝 뜸 */
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1); /* 그림자 진해짐 */
}

.card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.card-title { font-size: 18px; font-weight: 700; color: #333; }

/* ========================================= */
/* 2. 오늘의 식단 */
/* ========================================= */
.diet-card { grid-column: span 2; }
.meals-list { display: flex; gap: 16px; }
.meal-item { 
  flex: 1; padding: 16px; background: #F8F9FA; border-radius: 8px; 
  transition: background 0.3s ease;
}
.meal-item:hover { background: #E8F5E9; /* 호버 시 배경색 변경 */ }

.meal-header { display: flex; justify-content: space-between; margin-bottom: 12px; }
.meal-type { font-weight: 700; font-size: 16px; }
.meal-calorie { font-size: 14px; color: #666; font-weight: 600; }
.meal-foods { min-height: 60px; display: flex; align-items: center; justify-content: center; }
.food-list-container { display: flex; flex-wrap: wrap; gap: 6px; }
.food-item-display { 
  background: #fff; border: 1px solid #A5D6A7; padding: 4px 10px; border-radius: 12px; 
  font-size: 12px; color: #333; box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}
.meal-type-breakfast { color: #FF9800; }
.meal-type-lunch { color: #2196F3; }
.meal-type-dinner { color: #9C27B0; }
.meal-type-snack { color: #E91E63; }

.no-daily-diet-message { padding: 40px; text-align: center; background: #F8F9FA; border-radius: 8px; color: #888; width: 100%; border: 1px dashed #ddd; }
.empty-primary-diet-plan { padding: 40px; text-align: center; background: #FFF3E0; border-radius: 8px; width: 100%; }

/* 버튼 스타일 (호버 효과) */
.diet-detail-edit-btn { 
  padding: 6px 12px; background: #eee; border: none; border-radius: 4px; cursor: pointer; font-size: 13px; font-weight: 600; 
  transition: all 0.2s ease;
}
.diet-detail-edit-btn:hover { background: #ddd; color: #000; }

.meal-add-btn { 
  background: #fff; border: 1px dashed #4CAF50; color: #4CAF50; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 13px;
  transition: all 0.2s ease;
}
.meal-add-btn:hover { background: #E8F5E9; border-style: solid; }

.create-diet-plan-btn { margin-top: 10px; padding: 8px 16px; background: #FF9800; color: white; border: none; border-radius: 4px; cursor: pointer; transition: transform 0.2s; }
.create-diet-plan-btn:hover { transform: translateY(-2px); box-shadow: 0 2px 8px rgba(255, 152, 0, 0.3); }

/* ========================================= */
/* 3. 내 정보 (팔로우 섹션 복구) */
/* ========================================= */
.user-info { display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px; }
.info-row { display: flex; justify-content: space-between; border-bottom: 1px solid #f0f0f0; padding-bottom: 8px; }
.info-label { color: #666; font-size: 14px; font-weight: 600; }
.info-value { color: #333; font-weight: 500; font-size: 14px; }

/* 팔로우 래퍼 */
.follow-wrapper { 
  background: #F8F9FA; border-radius: 8px; padding: 16px; 
  display: flex; flex-direction: column; gap: 12px; 
}
.follow-section { display: flex; justify-content: space-around; align-items: center; }

/* 팔로우 아이템 (호버 효과) */
.follow-item { 
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  padding: 8px 16px; border-radius: 8px; cursor: pointer;
  transition: all 0.3s ease; /* 부드러운 전환 */
}
.follow-item:hover { 
  background: #E8F5E9; transform: translateY(-2px); 
}

.follow-count { font-size: 20px; font-weight: 700; color: #4CAF50; }
.follow-label { font-size: 13px; color: #666; }
.follow-divider { width: 1px; height: 30px; background: #ddd; }

/* 전체보기 버튼 (복구됨) */
.view-all-btn {
  width: 100%; padding: 10px 0;
  background-color: #FFFFFF; border: 1px solid #E0E0E0; border-radius: 6px;
  color: #555555; font-size: 13px; font-weight: 600;
  cursor: pointer; transition: all 0.2s ease;
}
.view-all-btn:hover {
  background-color: #4CAF50; border-color: #4CAF50; color: #FFFFFF;
}

/* 2. 신체 정보 (Right) - 디자인 수정됨 */
.body-current-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.body-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  /* 요소들을 위아래로 적절히 분배하되, 너무 벌어지지 않게 상단 정렬 후 margin으로 조절 */
  justify-content: flex-start; 
  gap: 0; /* 개별 margin으로 간격 제어 */
  padding-top: 10px;
}

.body-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 32px; /* ★ [수정] 위쪽 스탯과 BMI 사이 여백 대폭 추가 */
}

.stat-item {
  background: #F8F9FA;
  padding: 16px 8px;
  border-radius: 12px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.stat-label {
  font-size: 13px;
  color: #888;
  font-weight: 500;
}

.stat-value {
  font-size: 20px;
  font-weight: 700;
  color: #333;
}

.stat-unit {
  font-size: 12px;
  font-weight: 400;
  color: #888;
  margin-left: 2px;
}

/* BMI 섹션 */
.bmi-section {
  background: #F8F9FA;
  padding: 24px 20px;
  border-radius: 12px;
  display: flex;
  justify-content: space-between; /* ★ 원래대로 유지 */
  align-items: center;
  margin-bottom: auto;
  position: relative; /* ★ 추가 */
}

.bmi-content {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.bmi-label {
  font-size: 16px;
  font-weight: 600;
  color: #555;
}

.bmi-value {
  font-size: 32px;
  font-weight: 700;
  line-height: 1;
  color: #333;
  letter-spacing: -0.5px;
  position: absolute; /* ★ 추가 */
  left: 50%; /* ★ 추가 */
  transform: translateX(-50%); /* ★ 추가 */
}

.bmi-status {
  padding: 6px 16px;
  border-radius: 20px;
  color: white;
  font-size: 14px;
  font-weight: 600;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.latest-date {
  text-align: right;
  font-size: 12px;
  color: #999;
  margin-top: 20px; /* BMI 섹션과의 간격 */
}

.empty-body-info {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #888;
}

.add-btn {
  padding: 6px 14px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease;
}
.add-btn:hover {
  background: #45A049;
}

/* ========================================= */
/* 5. 그래프 & 이력 & 챌린지 */
/* ========================================= */
.chart-card { grid-column: span 2; }
.chart-container { overflow-x: auto; padding: 10px 0; }
.chart-svg { display: block; margin: 0 auto; }
.axis-label { font-size: 12px; fill: #888; }
.data-label { font-size: 12px; font-weight: 600; fill: #333; }
.empty-chart { text-align: center; padding: 40px; color: #888; }

/* 4. 신체 이력 (MyPage 스타일 복구) */
.history-card { 
  /* 그리드 레이아웃 상 위치 */
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 400px; /* 리스트가 길어지면 스크롤 */
  overflow-y: auto;
}

.history-item {
  display: flex;
  align-items: center;
  justify-content: space-between; /* 양끝 정렬 */
  gap: 16px;
  padding: 16px 24px;
  background: #F8F9FA;
  border-radius: 8px;
  transition: background 0.3s ease;
}

.history-item:hover {
  background: #E8F5E9; /* 호버 시 연한 초록색 */
}

.history-date {
  font-size: 14px;
  font-weight: 700;
  color: #4CAF50;
  min-width: 80px; /* 날짜 영역 고정 너비 */
}

.history-stats {
  flex: 1; /* 남은 공간 차지 */
  display: flex;
  justify-content: center; /* 수치들을 가운데로 모음 */
  gap: 10px; /* 수치 간 간격 넓게 */
  flex-wrap: wrap;
}

.history-stat {
  font-size: 14px;
  color: #666666;
  white-space: nowrap; /* 줄바꿈 방지 */
}

.delete-btn {
  padding: 6px 12px;
  background: transparent;
  border: 1px solid #F44336;
  border-radius: 6px;
  color: #F44336;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.delete-btn:hover {
  background: #F44336;
  color: #FFFFFF;
}

.empty-history {
  text-align: center;
  padding: 40px 20px;
  color: #888;
}

/* 챌린지 카드 스타일 */
.challenge-list { display: flex; flex-direction: column; gap: 12px; }
.challenge-item { 
  background: #F8F9FA; padding: 16px; border-radius: 8px; 
  transition: transform 0.2s ease;
}
.challenge-item:hover { transform: translateX(4px); background: #E8F5E9; }

.challenge-title { font-size: 14px; font-weight: 600; margin-bottom: 4px; }
.challenge-header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
.d-day-badge { color: #FF5722; font-weight: 700; font-size: 12px; }
.status-badge-deleted { background: #666; color: white; padding: 2px 8px; border-radius: 10px; font-size: 11px; }
.challenge-dates { font-size: 12px; color: #888; margin-bottom: 8px; }
.progress-bar { height: 6px; background: #ddd; border-radius: 3px; overflow: hidden; }
.progress-fill { height: 100%; background: #4CAF50; }
.progress-percentage { font-size: 12px; color: #4CAF50; float: right; margin-top: 4px; font-weight: 600; }
.view-all { font-size: 13px; color: #4CAF50; text-decoration: none; font-weight: 600; }
.view-all:hover { color: #2E7D32; }
.empty-challenge { text-align: center; padding: 20px; }
.join-challenge-btn { margin-top: 10px; padding: 8px 16px; background: #4CAF50; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; }

/* ========================================= */
/* 6. 모달 & 토스트 (간략화) */
/* ========================================= */
.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1000; }
.modal-content { background: white; padding: 24px; border-radius: 12px; width: 400px; box-shadow: 0 8px 30px rgba(0,0,0,0.2); }
.modal-header { display: flex; justify-content: space-between; margin-bottom: 20px; }
.modal-title { font-weight: 700; font-size: 18px; }
.modal-close { background: none; border: none; font-size: 20px; cursor: pointer; }
.form-group { margin-bottom: 12px; }
.form-label { display: block; margin-bottom: 4px; font-size: 13px; font-weight: 600; }
.form-input { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; transition: border-color 0.2s; }
.form-input:focus { outline: none; border-color: #4CAF50; }
.form-row { display: flex; gap: 10px; }
.form-row .form-group { flex: 1; }
.form-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; }
.cancel-btn { background: #f0f0f0; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; transition: background 0.2s; }
.cancel-btn:hover { background: #e0e0e0; }
.submit-btn { background: #4CAF50; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; transition: background 0.2s; }
.submit-btn:hover { background: #45a049; }
.delete-btn-modal { background: #F44336; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; }
.cancel-btn-modal { background: #f0f0f0; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; }
.modal-footer { display: flex; justify-content: center; gap: 10px; margin-top: 20px; }

.toast-message { position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%); background: white; padding: 12px 24px; border-radius: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); display: flex; align-items: center; gap: 8px; z-index: 2000; }
.toast-icon { background: #4CAF50; color: white; width: 20px; height: 20px; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 12px; }
.slide-up-enter-active, .slide-up-leave-active { transition: all 0.3s ease; }
.slide-up-enter-from, .slide-up-leave-to { transform: translate(-50%, 20px); opacity: 0; }

/* 반응형 */
@media (max-width: 968px) {
  .grid-layout { grid-template-columns: 1fr; }
  .diet-card, .chart-card { grid-column: span 1; }
  .meals-list { flex-direction: column; }
}
</style>
<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import { dietPlanApi } from '@/api'
import { formatDateDot, calculateDuration } from '@/utils'

const router = useRouter()

// 식단 계획 목록
const dietPlans = ref([])

// 로딩 및 에러 상태
const isLoading = ref(true)
const networkError = ref(false)

// 식단 계획 목록 가져오기
const fetchDietPlans = async () => {
  isLoading.value = true
  networkError.value = false

  try {
    const response = await dietPlanApi.getMyList()
    dietPlans.value = response.data.map(plan => ({
      id: plan.dietPlanId,
      title: plan.title,
      startDate: plan.startDate,
      endDate: plan.endDate,
      primary: plan.primary
    }))
  } catch (error) {
    console.error('식단 계획 조회 실패:', error)
    networkError.value = true
  } finally {
    isLoading.value = false
  }
}

// 식단 계획 상세 페이지로 이동
const goToDietPlanDetail = (planId) => {
  router.push(`/diet/detail?id=${planId}`) // Changed path
}

// 새 식단 계획 추가
const goToAddDietPlan = () => {
  router.push('/diet/add')
}

onMounted(() => {
  fetchDietPlans()
})
</script>

<template>
  <div class="diet-container">
    <!-- 상단 네비게이션 -->
    <AppHeader active-page="diet" />

    <!-- 메인 콘텐츠 -->
    <main class="main-content">
      <div class="content-wrapper">
        <div class="page-header">
          <h1 class="page-title">식단 관리</h1>
        </div>

        <!-- 로딩 중 -->
        <div v-if="isLoading" class="loading-message">
          로딩 중...
        </div>

        <!-- 네트워크 오류 -->
        <div v-else-if="networkError" class="error-state">
          <div class="error-icon">⚠</div>
          <p class="error-text">네트워크 오류입니다</p>
          <p class="error-subtext">잠시 후 시도해주세요</p>
          <button class="retry-btn" @click="fetchDietPlans">다시 시도</button>
        </div>

        <!-- 빈 리스트 -->
        <div v-else-if="dietPlans.length === 0" class="empty-state">
          <div class="empty-icon">📋</div>
          <p class="empty-text">아직 식단 계획이 없습니다</p>
          <p class="empty-subtext">새로운 식단 계획을 작성해보세요</p>
          <button class="create-btn-large" @click="goToAddDietPlan">
            + 새 식단 계획
          </button>
        </div>

        <!-- 식단 계획 목록 -->
        <div v-else class="plan-grid">
          <!-- 식단 계획 카드들 -->
          <div
            v-for="plan in dietPlans"
            :key="plan.id"
            class="plan-card"
            @click="goToDietPlanDetail(plan.id)"
          >
            <div class="plan-card-header">
              <div class="title-with-badge">
                <h3 class="plan-card-title">{{ plan.title }}</h3>
                <span v-if="plan.primary" class="primary-badge">대표 식단</span>
              </div>
            </div>
            <div class="plan-card-body">
              <div class="plan-info-row">
                <span class="info-label">기간</span>
                <span class="info-value">{{ calculateDuration(plan.startDate, plan.endDate) }}일</span>
              </div>
              <div class="plan-info-row">
                <span class="info-label">시작일</span>
                <span class="info-value">{{ formatDateDot(plan.startDate) }}</span>
              </div>
              <div class="plan-info-row">
                <span class="info-label">종료일</span>
                <span class="info-value">{{ formatDateDot(plan.endDate) }}</span>
              </div>
            </div>
            <div class="plan-card-footer">
              <button class="detail-btn" @click.stop="goToDietPlanDetail(plan.id)">
                상세보기 →
              </button>
            </div>
          </div>

          <!-- 새 식단 계획 추가 카드 -->
          <div class="plan-card add-card" @click="goToAddDietPlan">
            <div class="add-card-content">
              <div class="add-icon">+</div>
              <p class="add-text">새 식단 계획</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.diet-container {
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

.page-header {
  margin-bottom: 32px;
}

.page-title {
  font-size: 32px;
  font-weight: 700;
  color: #333333;
}

/* 로딩 메시지 */
.loading-message {
  text-align: center;
  padding: 80px 20px;
  font-size: 18px;
  color: #666666;
}

/* 네트워크 오류 상태 */
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  text-align: center;
}

.error-icon {
  font-size: 64px;
  margin-bottom: 24px;
}

.error-text {
  font-size: 20px;
  font-weight: 700;
  color: #F44336;
  margin-bottom: 8px;
}

.error-subtext {
  font-size: 16px;
  color: #666666;
  margin-bottom: 32px;
}

.retry-btn {
  padding: 12px 32px;
  background: #4CAF50;
  color: #FFFFFF;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.retry-btn:hover {
  background: #45A049;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
}

/* 빈 상태 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  text-align: center;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 24px;
}

.empty-text {
  font-size: 20px;
  font-weight: 700;
  color: #333333;
  margin-bottom: 8px;
}

.empty-subtext {
  font-size: 16px;
  color: #666666;
  margin-bottom: 32px;
}

.create-btn-large {
  padding: 14px 32px;
  background: #4CAF50;
  color: #FFFFFF;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.create-btn-large:hover {
  background: #45A049;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
}

/* 식단 계획 그리드 */
.plan-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
}

/* 식단 계획 카드 */
.plan-card {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
  display: flex;
  flex-direction: column;
}

.plan-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
  border-color: #4CAF50;
}

.plan-card-header {
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 2px solid #F0F0F0;
}

.title-with-badge {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.plan-card-title {
  font-size: 20px;
  font-weight: 700;
  color: #333333;
  margin: 0;
}

.primary-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  background: linear-gradient(135deg, #4CAF50 0%, #45A049 100%);
  color: #FFFFFF;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.3px;
  box-shadow: 0 2px 6px rgba(76, 175, 80, 0.25);
  flex-shrink: 0;
}

.plan-card-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.plan-info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-label {
  font-size: 14px;
  color: #666666;
  font-weight: 500;
}

.info-value {
  font-size: 15px;
  color: #333333;
  font-weight: 600;
}

.plan-card-footer {
  display: flex;
  justify-content: flex-end;
}

.detail-btn {
  padding: 8px 16px;
  background: #E8F5E9;
  color: #4CAF50;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.detail-btn:hover {
  background: #4CAF50;
  color: #FFFFFF;
}

/* 새 식단 계획 추가 카드 */
.add-card {
  background: #FFFFFF;
  border: 2px dashed #4CAF50;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 240px;
}

.add-card:hover {
  background: #E8F5E9;
  border-style: solid;
}

.add-card-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.add-icon {
  font-size: 48px;
  color: #4CAF50;
  font-weight: 300;
}

.add-text {
  font-size: 16px;
  font-weight: 600;
  color: #4CAF50;
  margin: 0;
}

/* 반응형 */
@media (max-width: 768px) {
  .main-content {
    padding: 20px;
  }

  .page-title {
    font-size: 24px;
  }

  .plan-grid {
    grid-template-columns: 1fr;
  }

  .error-state,
  .empty-state {
    padding: 60px 20px;
  }

  .error-icon,
  .empty-icon {
    font-size: 48px;
  }

  .error-text,
  .empty-text {
    font-size: 18px;
  }

  .error-subtext,
  .empty-subtext {
    font-size: 14px;
  }
}

@media (max-width: 480px) {
  .plan-card {
    padding: 20px;
  }

  .plan-card-title {
    font-size: 18px;
  }
}
</style>

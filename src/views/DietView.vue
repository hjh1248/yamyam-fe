<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// 더미 데이터 - 식단 계획 목록
const dietPlans = ref([
  {
    id: 1,
    title: '1월 다이어트 식단',
    startDate: '2025-01-01',
    endDate: '2025-01-31',
    isShared: false
  },
  {
    id: 2,
    title: '저탄수화물 식단',
    startDate: '2024-12-15',
    endDate: '2025-01-15',
    isShared: true
  },
])

const selectedPlan = ref(dietPlans.value[0])
const selectedDate = ref('2025-01-15')

// 로그아웃 모달
const showLogoutModal = ref(false)

// 날짜 변경 함수
const changeDate = (days) => {
  const currentDate = new Date(selectedDate.value)
  currentDate.setDate(currentDate.getDate() + days)
  selectedDate.value = currentDate.toISOString().split('T')[0]
}

// 더미 데이터 - 일별 식단
const dailyDiet = ref({
  breakfast: [
    { name: '현미밥', amount: '1공기', calorie: 300 },
    { name: '계란후라이', amount: '1개', calorie: 90 },
  ],
  lunch: [
    { name: '샐러드', amount: '1접시', calorie: 150 },
    { name: '닭가슴살', amount: '100g', calorie: 165 },
  ],
  dinner: [],
  snack: []
})

const handleLogout = () => {
  showLogoutModal.value = true
}

const confirmLogout = () => {
  showLogoutModal.value = false
  router.push('/login')
}

const goToMain = () => {
  router.push('/main')
}
</script>

<template>
  <div class="diet-container">
    <!-- 상단 네비게이션 -->
    <header class="header">
      <div class="header-content">
        <div class="logo" @click="goToMain">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="20" cy="20" r="18" stroke="#4CAF50" stroke-width="2"/>
            <path d="M13 20 L18 25 L28 14" stroke="#4CAF50" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span class="logo-text">냠냠 코치</span>
        </div>

        <nav class="nav-menu">
          <router-link to="/main" class="nav-item">대시보드</router-link>
          <router-link to="/diet" class="nav-item active">식단 관리</router-link>
          <router-link to="/board" class="nav-item">게시판</router-link>
          <router-link to="/challenge" class="nav-item">챌린지</router-link>
          <router-link to="/mypage" class="nav-item">마이페이지</router-link>
        </nav>

        <div class="user-menu">
          <span class="username">홍길동님</span>
          <button @click="handleLogout" class="logout-btn">로그아웃</button>
        </div>
      </div>
    </header>

    <!-- 메인 콘텐츠 -->
    <main class="main-content">
      <div class="content-wrapper">
        <div class="page-header">
          <h1 class="page-title">식단 관리</h1>
          <button class="create-btn" @click="router.push('/diet/add')">+ 새 식단 계획</button>
        </div>

        <div class="diet-layout">
          <!-- 왼쪽: 식단 계획 목록 -->
          <div class="plan-list-section">
            <div class="section-title">내 식단 계획</div>
            <div class="plan-list">
              <div
                v-for="plan in dietPlans"
                :key="plan.id"
                :class="['plan-item', { active: selectedPlan.id === plan.id }]"
                @click="selectedPlan = plan"
              >
                <div class="plan-header">
                  <h3 class="plan-title">{{ plan.title }}</h3>
                  <span v-if="plan.isShared" class="shared-badge">공유됨</span>
                </div>
                <p class="plan-period">{{ plan.startDate }} ~ {{ plan.endDate }}</p>
              </div>
            </div>
          </div>

          <!-- 오른쪽: 식단 상세 -->
          <div class="plan-detail-section">
            <div class="detail-header">
              <h2 class="detail-title">{{ selectedPlan.title }}</h2>
              <div class="detail-actions">
                <button class="action-btn delete">삭제</button>
              </div>
            </div>

            <!-- 날짜 선택 -->
            <div class="date-selector">
              <button class="date-nav-btn" @click="changeDate(-1)">◀</button>
              <input type="date" v-model="selectedDate" class="date-input" />
              <button class="date-nav-btn" @click="changeDate(1)">▶</button>
            </div>

            <!-- 식단 카드 -->
            <div class="meal-cards">
              <!-- 아침 -->
              <div class="meal-card">
                <div class="meal-card-header">
                  <h3 class="meal-card-title">아침</h3>
                  <button v-if="dailyDiet.breakfast.length > 0" class="meal-edit-btn" @click="router.push('/diet/edit?mealType=아침')">수정</button>
                </div>
                <div class="meal-card-content">
                  <div v-if="dailyDiet.breakfast.length === 0" class="empty-meal-card">
                    <button class="meal-add-btn-large" @click="router.push('/diet/add?mealType=아침')">+ 식단 추가</button>
                  </div>
                  <div v-else class="food-items">
                    <div v-for="food in dailyDiet.breakfast" :key="food.name" class="food-item">
                      <div class="food-info">
                        <span class="food-name">{{ food.name }}</span>
                        <span class="food-amount">{{ food.amount }}</span>
                      </div>
                      <span class="food-calorie">{{ food.calorie }}kcal</span>
                    </div>
                    <div class="meal-total">
                      총 {{ dailyDiet.breakfast.reduce((sum, food) => sum + food.calorie, 0) }}kcal
                    </div>
                  </div>
                </div>
              </div>

              <!-- 점심 -->
              <div class="meal-card">
                <div class="meal-card-header">
                  <h3 class="meal-card-title">점심</h3>
                  <button v-if="dailyDiet.lunch.length > 0" class="meal-edit-btn" @click="router.push('/diet/edit?mealType=점심')">수정</button>
                </div>
                <div class="meal-card-content">
                  <div v-if="dailyDiet.lunch.length === 0" class="empty-meal-card">
                    <button class="meal-add-btn-large" @click="router.push('/diet/add?mealType=점심')">+ 식단 추가</button>
                  </div>
                  <div v-else class="food-items">
                    <div v-for="food in dailyDiet.lunch" :key="food.name" class="food-item">
                      <div class="food-info">
                        <span class="food-name">{{ food.name }}</span>
                        <span class="food-amount">{{ food.amount }}</span>
                      </div>
                      <span class="food-calorie">{{ food.calorie }}kcal</span>
                    </div>
                    <div class="meal-total">
                      총 {{ dailyDiet.lunch.reduce((sum, food) => sum + food.calorie, 0) }}kcal
                    </div>
                  </div>
                </div>
              </div>

              <!-- 저녁 -->
              <div class="meal-card">
                <div class="meal-card-header">
                  <h3 class="meal-card-title">저녁</h3>
                </div>
                <div class="meal-card-content">
                  <div class="empty-meal-card">
                    <button class="meal-add-btn-large" @click="router.push('/diet/add?mealType=저녁')">+ 식단 추가</button>
                  </div>
                </div>
              </div>

              <!-- 간식 -->
              <div class="meal-card">
                <div class="meal-card-header">
                  <h3 class="meal-card-title">간식</h3>
                </div>
                <div class="meal-card-content">
                  <div class="empty-meal-card">
                    <button class="meal-add-btn-large" @click="router.push('/diet/add?mealType=간식')">+ 식단 추가</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- 로그아웃 확인 모달 -->
    <div v-if="showLogoutModal" class="modal-overlay" @click="showLogoutModal = false">
      <div class="modal-content logout-modal" @click.stop>
        <div class="modal-header">
          <h2 class="modal-title">로그아웃</h2>
          <button class="modal-close" @click="showLogoutModal = false">✕</button>
        </div>
        <div class="modal-body">
          <p class="modal-message">로그아웃 하시겠습니까?</p>
        </div>
        <div class="modal-footer">
          <button class="modal-btn cancel-btn" @click="showLogoutModal = false">취소</button>
          <button class="modal-btn logout-confirm-btn" @click="confirmLogout">로그아웃</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.diet-container {
  min-height: 100vh;
  background-color: #F5F7FA;
}

/* 헤더 (동일) */
.header {
  background: #FFFFFF;
  border-bottom: 1px solid #E0E0E0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 16px 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}

.logo-text {
  font-size: 20px;
  font-weight: 700;
  color: #333333;
}

.nav-menu {
  display: flex;
  gap: 32px;
}

.nav-item {
  color: #666666;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.3s ease;
  padding: 8px 0;
  border-bottom: 2px solid transparent;
}

.nav-item:hover,
.nav-item.active {
  color: #4CAF50;
  border-bottom-color: #4CAF50;
}

.user-menu {
  display: flex;
  align-items: center;
  gap: 16px;
}

.username {
  font-size: 14px;
  color: #333333;
  font-weight: 500;
}

.logout-btn {
  padding: 8px 16px;
  background: transparent;
  border: 1px solid #E0E0E0;
  border-radius: 6px;
  color: #666666;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.logout-btn:hover {
  border-color: #4CAF50;
  color: #4CAF50;
}

/* 메인 콘텐츠 */
.main-content {
  padding: 40px;
}

.content-wrapper {
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
}

.page-title {
  font-size: 32px;
  font-weight: 700;
  color: #333333;
}

.create-btn {
  padding: 12px 24px;
  background: #4CAF50;
  color: #FFFFFF;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.create-btn:hover {
  background: #45A049;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
}

/* 레이아웃 */
.diet-layout {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 24px;
}

/* 식단 계획 목록 */
.plan-list-section {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 24px;
  height: fit-content;
  position: sticky;
  top: 80px;
}

.section-title {
  font-size: 18px;
  font-weight: 700;
  color: #333333;
  margin-bottom: 20px;
}

.plan-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.plan-item {
  padding: 16px;
  background: #F8F9FA;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.plan-item:hover {
  background: #E8F5E9;
}

.plan-item.active {
  border-color: #4CAF50;
  background: #E8F5E9;
}

.plan-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.plan-title {
  font-size: 15px;
  font-weight: 600;
  color: #333333;
}

.shared-badge {
  padding: 4px 8px;
  background: #FFA726;
  color: #FFFFFF;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
}

.plan-period {
  font-size: 14px;
  color: #666666;
  font-weight: 500;
}

/* 식단 상세 */
.plan-detail-section {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 32px;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 2px solid #F0F0F0;
}

.detail-title {
  font-size: 24px;
  font-weight: 700;
  color: #333333;
}

.detail-actions {
  display: flex;
  gap: 12px;
}

.action-btn {
  padding: 8px 16px;
  background: transparent;
  border: 1px solid #E0E0E0;
  border-radius: 6px;
  color: #666666;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.action-btn:hover {
  border-color: #4CAF50;
  color: #4CAF50;
}

.action-btn.delete:hover {
  border-color: #F44336;
  color: #F44336;
}

/* 날짜 선택 */
.date-selector {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 32px;
  justify-content: center;
}

.date-nav-btn {
  width: 36px;
  height: 36px;
  background: #FFFFFF;
  border: 1px solid #E0E0E0;
  border-radius: 6px;
  color: #666666;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.date-nav-btn:hover {
  background: #4CAF50;
  color: #FFFFFF;
  border-color: #4CAF50;
}

.date-input {
  padding: 8px 16px;
  border: 1px solid #E0E0E0;
  border-radius: 6px;
  font-size: 15px;
  color: #333333;
  background: #FFFFFF;
  cursor: pointer;
  transition: border-color 0.3s ease;
  font-weight: 600;
  display: flex;
  align-items: center;
  text-align: center;
}

.date-input:focus {
  outline: none;
  border-color: #4CAF50;
}

/* 식단 카드 */
.meal-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.meal-card {
  background: #F8F9FA;
  border-radius: 10px;
  padding: 20px;
}

.meal-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.meal-card-title {
  font-size: 18px;
  font-weight: 700;
  color: #4CAF50;
}

.meal-edit-btn {
  padding: 6px 12px;
  background: transparent;
  border: 1px solid #4CAF50;
  border-radius: 6px;
  color: #4CAF50;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.meal-edit-btn:hover {
  background: #4CAF50;
  color: #FFFFFF;
}

.meal-add-btn-small {
  padding: 6px 12px;
  background: transparent;
  border: 1px solid #4CAF50;
  border-radius: 6px;
  color: #4CAF50;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.meal-add-btn-small:hover {
  background: #4CAF50;
  color: #FFFFFF;
}

.meal-card-content {
  min-height: 120px;
}

.empty-meal-card {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 120px;
}

.meal-add-btn-large {
  padding: 12px 24px;
  background: #FFFFFF;
  border: 2px dashed #4CAF50;
  border-radius: 8px;
  color: #4CAF50;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.meal-add-btn-large:hover {
  background: #E8F5E9;
  border-style: solid;
}

.food-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.food-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #FFFFFF;
  border-radius: 6px;
}

.food-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.food-name {
  font-size: 14px;
  font-weight: 600;
  color: #333333;
}

.food-amount {
  font-size: 12px;
  color: #888888;
}

.food-calorie {
  font-size: 14px;
  font-weight: 600;
  color: #4CAF50;
}

.meal-total {
  margin-top: 8px;
  padding-top: 12px;
  border-top: 1px solid #E0E0E0;
  text-align: right;
  font-size: 15px;
  font-weight: 700;
  color: #333333;
}

/* 로그아웃 모달 */
.logout-modal {
  max-width: 400px;
}

.logout-modal .modal-body {
  padding: 32px 28px;
  text-align: center;
}

.logout-modal .modal-message {
  font-size: 16px;
  color: #333333;
  line-height: 1.6;
  margin: 8px 0;
}

.logout-modal .modal-footer {
  padding: 24px 28px;
  border-top: 1px solid #E0E0E0;
  display: flex;
  gap: 12px;
  justify-content: center;
}

.logout-modal .modal-btn {
  padding: 12px 32px;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 100px;
}

.logout-modal .cancel-btn {
  background: #F5F7FA;
  border: 1px solid #E0E0E0;
  color: #666666;
}

.logout-modal .cancel-btn:hover {
  background: #E8EAF0;
  border-color: #BDBDBD;
  color: #333333;
}

.logout-confirm-btn {
  background: #4CAF50;
  border: none;
  color: #FFFFFF;
  padding: 12px 32px;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 100px;
}

.logout-confirm-btn:hover {
  background: #45A049;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
}

/* 반응형 */
@media (max-width: 968px) {
  .diet-layout {
    grid-template-columns: 1fr;
  }

  .plan-list-section {
    position: static;
  }

  .meal-cards {
    grid-template-columns: 1fr;
  }

  .logout-modal {
    width: 95%;
  }
}
</style>

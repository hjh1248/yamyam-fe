<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

// 폼 데이터
const mealType = ref('아침')
const foods = ref([
  { name: '', amount: '', calorie: '' }
])

// 토스트 메시지
const showToast = ref(false)
const toastMessage = ref('')

// query parameter로 받은 mealType이 있으면 초기값으로 설정
onMounted(() => {
  if (route.query.mealType) {
    mealType.value = route.query.mealType
  }
})

const addFood = () => {
  foods.value.push({ name: '', amount: '', calorie: '' })
}

const removeFood = (index) => {
  foods.value.splice(index, 1)
}

const displayToast = (message) => {
  toastMessage.value = message
  showToast.value = true
  setTimeout(() => {
    showToast.value = false
  }, 3000)
}

const handleSubmit = () => {
  displayToast('식단이 추가되었습니다!')
  setTimeout(() => {
    router.push('/diet')
  }, 500)
}

const handleCancel = () => {
  router.back()
}
</script>

<template>
  <div class="add-diet-container">
    <!-- 상단 네비게이션 -->
    <header class="header">
      <div class="header-content">
        <div class="logo" @click="router.push('/main')">
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
          <button @click="router.push('/login')" class="logout-btn">로그아웃</button>
        </div>
      </div>
    </header>

    <!-- 메인 콘텐츠 -->
    <main class="main-content">
      <div class="content-wrapper">
        <div class="page-header">
          <h1 class="page-title">식단 추가</h1>
        </div>

        <div class="form-card">
          <form @submit.prevent="handleSubmit">
            <!-- 식사 타입 선택 -->
            <div class="form-section">
              <label class="form-label">식사 시간</label>
              <div class="meal-type-buttons">
                <button
                  v-for="type in ['아침', '점심', '저녁', '간식']"
                  :key="type"
                  type="button"
                  :class="['meal-type-btn', { active: mealType === type }]"
                  @click="mealType = type"
                >
                  {{ type }}
                </button>
              </div>
            </div>

            <!-- 음식 목록 -->
            <div class="form-section">
              <div class="section-header">
                <label class="form-label">음식 정보</label>
                <button type="button" class="add-food-btn" @click="addFood">
                  + 음식 추가
                </button>
              </div>

              <div class="food-list">
                <div v-for="(food, index) in foods" :key="index" class="food-row">
                  <div class="food-input-group">
                    <input
                      v-model="food.name"
                      type="text"
                      placeholder="음식명 (예: 현미밥)"
                      class="food-input"
                      required
                    />
                  </div>
                  <div class="food-input-group">
                    <input
                      v-model="food.amount"
                      type="text"
                      placeholder="양 (예: 1공기)"
                      class="food-input"
                      required
                    />
                  </div>
                  <div class="food-input-group">
                    <input
                      v-model="food.calorie"
                      type="number"
                      placeholder="칼로리"
                      class="food-input"
                      required
                    />
                  </div>
                  <button
                    v-if="foods.length > 1"
                    type="button"
                    class="remove-btn"
                    @click="removeFood(index)"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>

            <!-- 버튼 -->
            <div class="form-actions">
              <button type="button" class="cancel-btn" @click="handleCancel">
                취소
              </button>
              <button type="submit" class="submit-btn">
                식단 추가
              </button>
            </div>
          </form>
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
.add-diet-container {
  min-height: 100vh;
  background-color: #F5F7FA;
}

/* 헤더 */
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
  max-width: 900px;
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

/* 폼 카드 */
.form-card {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 40px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.form-section {
  margin-bottom: 32px;
}

.form-label {
  display: block;
  font-size: 16px;
  font-weight: 700;
  color: #333333;
  margin-bottom: 16px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

/* 식사 타입 버튼 */
.meal-type-buttons {
  display: flex;
  gap: 12px;
}

.meal-type-btn {
  flex: 1;
  padding: 14px;
  background: #F8F9FA;
  border: 2px solid #E0E0E0;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  color: #666666;
  cursor: pointer;
  transition: all 0.3s ease;
}

.meal-type-btn:hover {
  border-color: #4CAF50;
  color: #4CAF50;
}

.meal-type-btn.active {
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

.food-input {
  padding: 12px 16px;
  border: 1px solid #E0E0E0;
  border-radius: 8px;
  font-size: 15px;
  color: #333333;
  background: #FFFFFF;
  transition: border-color 0.3s ease;
}

.food-input:focus {
  outline: none;
  border-color: #4CAF50;
}

.food-input::placeholder {
  color: #AAAAAA;
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

/* 액션 버튼 */
.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 40px;
}

.cancel-btn,
.submit-btn {
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

.cancel-btn:hover {
  border-color: #333333;
  color: #333333;
}

.submit-btn {
  background: #4CAF50;
  border: none;
  color: #FFFFFF;
}

.submit-btn:hover {
  background: #45A049;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
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
@media (max-width: 768px) {
  .food-row {
    grid-template-columns: 1fr;
  }

  .remove-btn {
    width: 100%;
  }

  .meal-type-buttons {
    flex-direction: column;
  }

  .toast-message {
    bottom: 20px;
    max-width: 90%;
  }
}
</style>

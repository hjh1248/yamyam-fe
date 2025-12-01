<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const showLogoutModal = ref(false)

// 게시글 데이터 (실제로는 API에서 가져옴)
const post = ref({
  id: null,
  title: '',
  content: '',
  author: '홍길동',
  createdAt: '',
  images: [], // { name, preview }
  selectedDiet: null
})

onMounted(() => {
  // query parameter에서 데이터 가져오기
  if (route.query.data) {
    try {
      const data = JSON.parse(decodeURIComponent(route.query.data))
      post.value = { ...post.value, ...data }
    } catch (e) {
      console.error('Failed to parse post data:', e)
    }
  }
})

// 본문 파싱 (이미지 플레이스홀더 처리)
const parsedContent = computed(() => {
  if (!post.value.content) return []

  const result = []
  let currentIndex = 0
  const regex = /\[([^\]]+)\]/g
  let match

  while ((match = regex.exec(post.value.content)) !== null) {
    if (match.index > currentIndex) {
      const textBefore = post.value.content.substring(currentIndex, match.index)
      if (textBefore) {
        result.push({ type: 'text', content: textBefore })
      }
    }

    const imageName = match[1]
    const image = post.value.images.find(img => img.name === imageName)

    if (image) {
      result.push({ type: 'image', name: imageName, image: image })
    } else {
      result.push({ type: 'text', content: match[0] })
    }

    currentIndex = match.index + match[0].length
  }

  if (currentIndex < post.value.content.length) {
    const remainingText = post.value.content.substring(currentIndex)
    if (remainingText) {
      result.push({ type: 'text', content: remainingText })
    }
  }

  return result
})

const goBack = () => {
  router.push('/board')
}

const goToMain = () => {
  router.push('/main')
}

const handleLogout = () => {
  showLogoutModal.value = true
}

const confirmLogout = () => {
  showLogoutModal.value = false
  router.push('/login')
}
</script>

<template>
  <div class="detail-container">
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
          <router-link to="/diet" class="nav-item">식단 관리</router-link>
          <router-link to="/board" class="nav-item active">게시판</router-link>
          <router-link to="/challenge" class="nav-item">챌린지</router-link>
          <router-link to="/mypage" class="nav-item">마이페이지</router-link>
        </nav>

        <div class="user-menu">
          <span class="username">홍길동님</span>
          <button class="logout-btn" @click="handleLogout">로그아웃</button>
        </div>
      </div>
    </header>

    <!-- 메인 콘텐츠 -->
    <main class="main-content">
      <div class="content-wrapper">
        <!-- 뒤로가기 버튼 -->
        <button @click="goBack" class="back-btn">
          ← 목록으로
        </button>

        <!-- 게시글 상세 -->
        <article class="post-detail">
          <div class="post-header">
            <h1 class="post-title">{{ post.title || '제목 없음' }}</h1>
            <div class="post-meta">
              <span class="post-author">{{ post.author }}</span>
              <span class="post-date">{{ post.createdAt }}</span>
            </div>
          </div>

          <div class="post-content">
            <template v-if="parsedContent.length > 0">
              <div v-for="(part, index) in parsedContent" :key="index">
                <p v-if="part.type === 'text'" class="content-text">{{ part.content }}</p>
                <div v-else-if="part.type === 'image' && part.image" class="content-image-section">
                  <img :src="part.image.preview" :alt="part.name" class="content-image" />
                </div>
              </div>
            </template>
            <p v-else class="content-empty">내용 없음</p>
          </div>

          <!-- 식단 표시 -->
          <div v-if="post.selectedDiet" class="post-diet-section">
            <div class="diet-header">
              <span class="diet-badge">식단 포함</span>
              <span class="diet-date">{{ post.selectedDiet.date }} {{ post.selectedDiet.mealType }}</span>
            </div>
            <div class="diet-foods">
              <div v-for="food in post.selectedDiet.foods" :key="food.name" class="diet-food">
                {{ food.name }} ({{ food.amount }}) - {{ food.calories }}kcal
              </div>
            </div>
            <div class="diet-total">
              총 {{ post.selectedDiet.totalCalories }}kcal
            </div>
          </div>
        </article>
      </div>
    </main>

    <!-- 로그아웃 모달 -->
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
          <button class="modal-btn cancel-btn-modal" @click="showLogoutModal = false">취소</button>
          <button class="modal-btn logout-confirm-btn" @click="confirmLogout">로그아웃</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.detail-container {
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
  padding: 0 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 80px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: opacity 0.3s ease;
}

.logo:hover {
  opacity: 0.8;
}

.logo-text {
  font-size: 24px;
  font-weight: 700;
  color: #333333;
}

.nav-menu {
  display: flex;
  gap: 8px;
}

.nav-item {
  padding: 12px 20px;
  color: #666666;
  text-decoration: none;
  font-weight: 600;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.nav-item:hover {
  background: #F5F7FA;
  color: #333333;
}

.nav-item.active {
  background: #E8F5E9;
  color: #4CAF50;
}

.user-menu {
  display: flex;
  align-items: center;
  gap: 16px;
}

.username {
  font-weight: 600;
  color: #333333;
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

.back-btn {
  padding: 10px 20px;
  background: #F5F7FA;
  border: 1px solid #E0E0E0;
  border-radius: 8px;
  color: #666666;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 24px;
}

.back-btn:hover {
  background: #E8EAF0;
  border-color: #BDBDBD;
  color: #333333;
}

/* 게시글 상세 */
.post-detail {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 40px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.post-header {
  border-bottom: 2px solid #E0E0E0;
  padding-bottom: 24px;
  margin-bottom: 32px;
}

.post-title {
  font-size: 32px;
  font-weight: 700;
  color: #333333;
  margin-bottom: 16px;
  line-height: 1.4;
}

.post-meta {
  display: flex;
  gap: 16px;
  align-items: center;
}

.post-author {
  font-size: 16px;
  font-weight: 600;
  color: #333333;
}

.post-date {
  font-size: 15px;
  color: #888888;
}

.post-content {
  margin-bottom: 32px;
}

.content-text {
  font-size: 17px;
  color: #333333;
  line-height: 1.9;
  white-space: pre-wrap;
  word-break: break-word;
  margin-bottom: 16px;
}

.content-empty {
  font-size: 16px;
  color: #AAAAAA;
  font-style: italic;
  text-align: center;
  padding: 40px 0;
}

.content-image-section {
  margin: 24px 0;
}

.content-image {
  width: 100%;
  max-height: 600px;
  object-fit: contain;
  border-radius: 12px;
  border: 1px solid #E0E0E0;
}

/* 식단 섹션 */
.post-diet-section {
  padding: 24px;
  background: #F8F9FA;
  border: 2px solid #4CAF50;
  border-radius: 12px;
  margin-top: 32px;
}

.diet-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.diet-badge {
  padding: 6px 14px;
  background: #4CAF50;
  color: #FFFFFF;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
}

.diet-date {
  font-size: 16px;
  font-weight: 600;
  color: #333333;
}

.diet-foods {
  margin-bottom: 16px;
}

.diet-food {
  padding: 10px 0;
  font-size: 15px;
  color: #666666;
  border-bottom: 1px solid #E0E0E0;
}

.diet-food:last-child {
  border-bottom: none;
}

.diet-total {
  font-size: 17px;
  font-weight: 700;
  color: #4CAF50;
  text-align: right;
}

/* 로그아웃 모달 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: #FFFFFF;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  width: 90%;
  max-width: 500px;
}

.logout-modal {
  max-width: 400px;
}

.modal-header {
  padding: 24px 28px 16px;
  border-bottom: 1px solid #E0E0E0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-title {
  font-size: 20px;
  font-weight: 700;
  color: #333333;
}

.modal-close {
  background: none;
  border: none;
  font-size: 24px;
  color: #888888;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.modal-close:hover {
  background: #F8F9FA;
  color: #333333;
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

.logout-modal .cancel-btn-modal {
  background: #F5F7FA;
  border: 1px solid #E0E0E0;
  color: #666666;
}

.logout-modal .cancel-btn-modal:hover {
  background: #E8EAF0;
  border-color: #BDBDBD;
  color: #333333;
}

.logout-confirm-btn {
  background: #4CAF50;
  border: none;
  color: #FFFFFF;
}

.logout-confirm-btn:hover {
  background: #45A049;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
}

/* 반응형 */
@media (max-width: 968px) {
  .header-content {
    padding: 0 20px;
  }

  .nav-menu {
    display: none;
  }

  .main-content {
    padding: 20px;
  }

  .post-detail {
    padding: 24px;
  }

  .post-title {
    font-size: 24px;
  }
}
</style>

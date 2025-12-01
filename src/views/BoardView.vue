<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// 더미 데이터 - 게시글 목록
const posts = ref([
  {
    id: 1,
    title: '다이어트 식단 공유합니다!',
    content: '3개월 동안 10kg 감량한 식단 공유드려요. 아침에는 현미밥과 계란...',
    author: '건강러버',
    likeCount: 24,
    commentCount: 12,
    createdAt: '2025-01-10',
    hasDietPlan: true
  },
  {
    id: 2,
    title: '저염식 레시피 추천',
    content: '혈압이 높으신 분들을 위한 저염식 레시피를 소개합니다...',
    author: '요리왕',
    likeCount: 18,
    commentCount: 8,
    createdAt: '2025-01-12',
    hasDietPlan: false
  },
  {
    id: 3,
    title: '간헐적 단식 후기',
    content: '16:8 간헐적 단식을 3주 동안 실천한 후기입니다...',
    author: '다이어터',
    likeCount: 32,
    commentCount: 15,
    createdAt: '2025-01-14',
    hasDietPlan: false
  },
  {
    id: 4,
    title: '단백질 위주 식단 꿀팁',
    content: '근육량을 늘리기 위한 고단백 식단을 짜보았습니다...',
    author: '헬스매니아',
    likeCount: 45,
    commentCount: 20,
    createdAt: '2025-01-15',
    hasDietPlan: true
  },
])

const selectedPost = ref(null)
const showModal = ref(false)
const showLogoutModal = ref(false)

const openPost = (post) => {
  selectedPost.value = post
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  selectedPost.value = null
}

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

const goToWrite = () => {
  router.push('/board/write')
}
</script>

<template>
  <div class="board-container">
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
          <button @click="handleLogout" class="logout-btn">로그아웃</button>
        </div>
      </div>
    </header>

    <!-- 메인 콘텐츠 -->
    <main class="main-content">
      <div class="content-wrapper">
        <div class="page-header">
          <h1 class="page-title">커뮤니티 게시판</h1>
          <button class="write-btn" @click="goToWrite">✏️ 글쓰기</button>
        </div>

        <!-- 게시글 목록 -->
        <div class="post-grid">
          <div
            v-for="post in posts"
            :key="post.id"
            class="post-card"
            @click="openPost(post)"
          >
            <div class="post-card-header">
              <h2 class="post-card-title">{{ post.title }}</h2>
              <span v-if="post.hasDietPlan" class="diet-badge">식단 포함</span>
            </div>
            <p class="post-card-content">{{ post.content }}</p>
            <div class="post-card-footer">
              <div class="post-author">
                <span class="author-icon">👤</span>
                <span class="author-name">{{ post.author }}</span>
                <span class="post-date">{{ post.createdAt }}</span>
              </div>
              <div class="post-stats">
                <span class="stat-item">
                  <span class="stat-icon">❤️</span>
                  {{ post.likeCount }}
                </span>
                <span class="stat-item">
                  <span class="stat-icon">💬</span>
                  {{ post.commentCount }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- 게시글 상세 모달 -->
    <div v-if="showModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <button class="modal-close" @click="closeModal">✕</button>

        <div class="modal-header">
          <h2 class="modal-title">{{ selectedPost.title }}</h2>
          <div class="modal-meta">
            <span class="modal-author">{{ selectedPost.author }}</span>
            <span class="modal-date">{{ selectedPost.createdAt }}</span>
          </div>
        </div>

        <div class="modal-body">
          <p class="modal-text">{{ selectedPost.content }}</p>

          <div v-if="selectedPost.hasDietPlan" class="diet-plan-preview">
            <h3 class="preview-title">📋 공유된 식단 계획</h3>
            <div class="preview-content">
              <p>식단 계획을 확인하고 내 계획으로 가져올 수 있습니다.</p>
              <button class="copy-diet-btn">식단 가져오기</button>
            </div>
          </div>

          <div class="modal-actions">
            <button class="action-like-btn">❤️ 좋아요 {{ selectedPost.likeCount }}</button>
            <button class="action-share-btn">📤 공유</button>
          </div>

          <!-- 댓글 섹션 -->
          <div class="comments-section">
            <h3 class="comments-title">댓글 {{ selectedPost.commentCount }}</h3>

            <div class="comment-input-box">
              <input type="text" placeholder="댓글을 입력하세요..." class="comment-input" />
              <button class="comment-submit-btn">작성</button>
            </div>

            <div class="comments-list">
              <div class="comment-item">
                <div class="comment-header">
                  <span class="comment-author">샐러드러버</span>
                  <span class="comment-date">2025-01-11</span>
                </div>
                <p class="comment-text">정말 유익한 정보네요! 감사합니다 😊</p>
              </div>
              <div class="comment-item">
                <div class="comment-header">
                  <span class="comment-author">건강지킴이</span>
                  <span class="comment-date">2025-01-11</span>
                </div>
                <p class="comment-text">저도 따라해볼게요!</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

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
.board-container {
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
  max-width: 1200px;
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

.write-btn {
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

.write-btn:hover {
  background: #45A049;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
}

/* 게시글 그리드 */
.post-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}

.post-card {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 24px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.post-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
}

.post-card-header {
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: 12px;
}

.post-card-title {
  font-size: 18px;
  font-weight: 700;
  color: #333333;
  flex: 1;
}

.diet-badge {
  padding: 4px 10px;
  background: #E8F5E9;
  color: #4CAF50;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.post-card-content {
  font-size: 14px;
  color: #666666;
  line-height: 1.6;
  margin-bottom: 16px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.post-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  border-top: 1px solid #F0F0F0;
}

.post-author {
  display: flex;
  align-items: center;
  gap: 8px;
}

.author-icon {
  font-size: 16px;
}

.author-name {
  font-size: 14px;
  font-weight: 600;
  color: #333333;
}

.post-date {
  font-size: 12px;
  color: #AAAAAA;
}

.post-stats {
  display: flex;
  gap: 16px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  color: #666666;
}

.stat-icon {
  font-size: 14px;
}

/* 모달 */
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
  padding: 20px;
}

.modal-content {
  background: #FFFFFF;
  border-radius: 16px;
  width: 100%;
  max-width: 700px;
  max-height: 85vh;
  overflow-y: auto;
  position: relative;
}

.modal-close {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 32px;
  height: 32px;
  background: #F0F0F0;
  border: none;
  border-radius: 50%;
  font-size: 18px;
  cursor: pointer;
  transition: background 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-close:hover {
  background: #E0E0E0;
}

.modal-header {
  padding: 32px 32px 24px;
  border-bottom: 1px solid #F0F0F0;
}

.modal-title {
  font-size: 24px;
  font-weight: 700;
  color: #333333;
  margin-bottom: 12px;
  padding-right: 40px;
}

.modal-meta {
  display: flex;
  gap: 12px;
  align-items: center;
}

.modal-author {
  font-size: 15px;
  font-weight: 600;
  color: #4CAF50;
}

.modal-date {
  font-size: 14px;
  color: #888888;
}

.modal-body {
  padding: 24px 32px 32px;
}

.modal-text {
  font-size: 15px;
  color: #333333;
  line-height: 1.8;
  margin-bottom: 24px;
}

.diet-plan-preview {
  padding: 20px;
  background: #E8F5E9;
  border-radius: 10px;
  margin-bottom: 24px;
}

.preview-title {
  font-size: 16px;
  font-weight: 700;
  color: #2E7D32;
  margin-bottom: 12px;
}

.preview-content p {
  font-size: 14px;
  color: #2E7D32;
  margin-bottom: 12px;
}

.copy-diet-btn {
  padding: 10px 20px;
  background: #4CAF50;
  color: #FFFFFF;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.3s ease;
}

.copy-diet-btn:hover {
  background: #45A049;
}

.modal-actions {
  display: flex;
  gap: 12px;
  margin-bottom: 32px;
}

.action-like-btn,
.action-share-btn {
  padding: 12px 20px;
  border: 1px solid #E0E0E0;
  border-radius: 8px;
  background: #FFFFFF;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #333333;
}

.action-like-btn:hover {
  border-color: #4CAF50;
  color: #4CAF50;
  background: #E8F5E9;
}

.action-share-btn:hover {
  border-color: #FFA726;
  color: #FFA726;
  background: #FFF3E0;
}

/* 댓글 */
.comments-section {
  border-top: 2px solid #F0F0F0;
  padding-top: 24px;
}

.comments-title {
  font-size: 18px;
  font-weight: 700;
  color: #333333;
  margin-bottom: 16px;
}

.comment-input-box {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}

.comment-input {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #E0E0E0;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.3s ease;
}

.comment-input:focus {
  border-color: #4CAF50;
}

.comment-submit-btn {
  padding: 12px 24px;
  background: #4CAF50;
  color: #FFFFFF;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.3s ease;
}

.comment-submit-btn:hover {
  background: #45A049;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.comment-item {
  padding: 16px;
  background: #F8F9FA;
  border-radius: 8px;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.comment-author {
  font-size: 14px;
  font-weight: 600;
  color: #333333;
}

.comment-date {
  font-size: 12px;
  color: #888888;
}

.comment-text {
  font-size: 14px;
  color: #666666;
  line-height: 1.6;
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
  .post-grid {
    grid-template-columns: 1fr;
  }

  .modal-content {
    max-width: 100%;
    margin: 0 20px;
  }

  .logout-modal {
    width: 95%;
  }
}
</style>

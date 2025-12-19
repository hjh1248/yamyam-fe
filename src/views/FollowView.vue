<template>
  <div class="follow-view">
    <AppHeader active-page="" />

    <main class="main-content">
      <div class="container">
        <div class="header-section">
          <button @click="goBack" class="back-btn">← 돌아가기</button>
          <h1 class="page-title">팔로우 관리</h1>
        </div>

        <!-- 탭 메뉴 -->
        <div class="tab-menu">
          <button 
            :class="['tab-btn', { active: activeTab === 'followers' }]"
            @click="activeTab = 'followers'"
          >
            팔로워 ({{ followers.length }})
          </button>
          <button 
            :class="['tab-btn', { active: activeTab === 'following' }]"
            @click="activeTab = 'following'"
          >
            팔로잉 ({{ following.length }})
          </button>
        </div>

        <!-- 팔로워 탭 -->
        <div v-if="activeTab === 'followers'" class="tab-content">
          <div v-if="followers.length > 0" class="user-list">
            <div v-for="user in followers" :key="user.id" class="user-card">
              <div class="user-info" @click="router.push(`/user/${user.id}`)">
                <div class="user-avatar">
                  {{ user.name.charAt(0) }}
                </div>
                <div class="user-details">
                  <h3 class="user-name">{{ user.name }}</h3>
                  <p class="user-nickname">@{{ user.nickname }}</p>
                  <p class="user-meta">{{ user.email }}</p>
                </div>
              </div>
              
              <button
                v-if="user.isFollowing"
                @click="unfollowUser(user)"
                class="btn btn-unfollow"
              >
                언팔로우
              </button>
              <button
                v-else
                @click="followUser(user)"
                class="btn btn-follow"
              >
                팔로우
              </button>
            </div>
          </div>

          <div v-else class="empty-state">
            <p>아직 나를 팔로우하는 사람이 없습니다.</p>
          </div>
        </div>

        <!-- 팔로잉 탭 -->
        <div v-if="activeTab === 'following'" class="tab-content">
          <div v-if="following.length > 0" class="user-list">
            <div v-for="user in following" :key="user.id" class="user-card">
              <div class="user-info" @click="router.push(`/user/${user.id}`)">
                <div class="user-avatar">
                  {{ user.name.charAt(0) }}
                </div>
                <div class="user-details">
                  <h3 class="user-name">{{ user.name }}</h3>
                  <p class="user-nickname">@{{ user.nickname }}</p>
                  <p class="user-meta">{{ user.email }}</p>
                </div>
              </div>
              <button
                @click="unfollowFromFollowing(user)"
                class="btn btn-unfollow"
              >
                언팔로우
              </button>
            </div>
          </div>

          <div v-else class="empty-state">
            <p>팔로잉 중인 사용자가 없습니다.</p>
          </div>
        </div>
      </div>
    </main>

    <transition name="slideUp">
      <div v-if="showToast" class="toast">
        <span class="toast-icon">✓</span>
        <span class="toast-message">{{ toastMessage }}</span>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import api from '@/util/axios'

const router = useRouter()
const route = useRoute()

// State
const activeTab = ref('followers') // 기본 탭
const followers = ref([])
const following = ref([])

// Toast
const showToast = ref(false)
const toastMessage = ref('')

// 팔로워 목록 불러오기
const fetchFollowers = async () => {
  try {
    const response = await api.get('/api/follows/followers')
    followers.value = response.data
  } catch (error) {
    console.error(error)
    displayToast('팔로워 목록을 불러오지 못했습니다.')
  }
}

// 팔로잉 목록 불러오기
const fetchFollowing = async () => {
  try {
    const response = await api.get('/api/follows/following')
    following.value = response.data
  } catch (error) {
    console.error(error)
    displayToast('팔로잉 목록을 불러오지 못했습니다.')
  }
}

// 화면 로드 시 데이터 가져오기 + 쿼리 파라미터로 탭 설정
onMounted(async () => {
  // URL 쿼리로 탭 결정 (예: /follow?tab=following)
  if (route.query.tab === 'following') {
    activeTab.value = 'following'
  }
  
  await Promise.all([
    fetchFollowers(),
    fetchFollowing()
  ])
})

// 팔로우 (맞팔하기)
const followUser = async (user) => {
  try {
    await api.post(`/api/follows/${user.id}`)
    user.isFollowing = true
    displayToast(`${user.name}님을 팔로우했습니다.`)
  } catch (error) {
    console.error(error)
    displayToast('팔로우 실패')
  }
}

// 언팔로우 (팔로워 탭에서)
const unfollowUser = async (user) => {
  try {
    await api.delete(`/api/follows/${user.id}`)
    user.isFollowing = false
    displayToast(`${user.name}님을 언팔로우했습니다.`)
  } catch (error) {
    console.error(error)
    displayToast('언팔로우 실패')
  }
}

// 언팔로우 (팔로잉 탭에서 - 목록에서 제거)
const unfollowFromFollowing = async (user) => {
  if (!confirm(`${user.name}님을 언팔로우 하시겠습니까?`)) return

  try {
    await api.delete(`/api/follows/${user.id}`)
    following.value = following.value.filter(u => u.id !== user.id)
    displayToast(`${user.name}님을 언팔로우했습니다.`)
  } catch (error) {
    console.error(error)
    displayToast('언팔로우 실패')
  }
}

const displayToast = (message) => {
  toastMessage.value = message
  showToast.value = true
  setTimeout(() => {
    showToast.value = false
  }, 3000)
}

const goBack = () => {
  router.back()
}
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.follow-view {
  min-height: 100vh;
  background: #F5F7FA;
}

.main-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
}

.container {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 40px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header-section {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 30px;
}

.back-btn {
  padding: 10px 20px;
  background: #F5F7FA;
  border: none;
  border-radius: 8px;
  color: #666666;
  font-size: 15px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.back-btn:hover {
  background: #E8EBF0;
  color: #333333;
}

.page-title {
  font-size: 28px;
  color: #333333;
}

/* 탭 메뉴 */
.tab-menu {
  display: flex;
  gap: 10px;
  margin-bottom: 30px;
  border-bottom: 2px solid #E0E0E0;
}

.tab-btn {
  padding: 12px 30px;
  background: none;
  border: none;
  font-size: 16px;
  font-weight: 600;
  color: #999999;
  cursor: pointer;
  transition: all 0.3s ease;
  border-bottom: 3px solid transparent;
  margin-bottom: -2px;
}

.tab-btn:hover {
  color: #4CAF50;
}

.tab-btn.active {
  color: #4CAF50;
  border-bottom-color: #4CAF50;
}

/* 탭 콘텐츠 */
.tab-content {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.user-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.user-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  background: #F5F7FA;
  border-radius: 10px;
  transition: all 0.3s ease;
}

.user-card:hover {
  transform: translateX(5px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 15px;
  cursor: pointer;
  flex: 1;
}

.user-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #4CAF50, #66BB6A);
  color: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: bold;
}

.user-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.user-name {
  font-size: 18px;
  color: #333333;
  font-weight: 600;
}

.user-nickname {
  font-size: 14px;
  color: #4CAF50;
  font-weight: 500;
}

.user-meta {
  font-size: 13px;
  color: #999999;
}

/* Buttons */
.btn {
  padding: 10px 24px;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-follow {
  background: #4CAF50;
  color: #FFFFFF;
}

.btn-follow:hover {
  background: #45a049;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
}

.btn-unfollow {
  background: #FFFFFF;
  color: #666666;
  border: 2px solid #E0E0E0;
}

.btn-unfollow:hover {
  background: #F5F7FA;
  border-color: #999999;
  color: #333333;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #999999;
  font-size: 16px;
}

/* Toast */
.toast {
  position: fixed;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  background: #FFFFFF;
  padding: 16px 24px;
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 1000;
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
  font-weight: bold;
  font-size: 14px;
}

.toast-message {
  color: #333333;
  font-weight: 500;
}

.slideUp-enter-active {
  animation: slideUp 0.3s ease-out;
}

.slideUp-leave-active {
  animation: slideUp 0.3s ease-out reverse;
}

@keyframes slideUp {
  from {
    transform: translate(-50%, 20px);
    opacity: 0;
  }
  to {
    transform: translate(-50%, 0);
    opacity: 1;
  }
}

/* Responsive */
@media (max-width: 768px) {
  .container {
    padding: 20px;
  }

  .page-title {
    font-size: 24px;
  }

  .tab-btn {
    padding: 10px 20px;
    font-size: 14px;
  }

  .user-card {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }

  .btn {
    width: 100%;
  }
}
</style>
<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// 더미 데이터 - 진행 중인 챌린지
const myChallenges = ref([
  {
    id: 1,
    title: '30일 저탄수화물 챌린지',
    description: '30일 동안 저탄수화물 식단을 유지하는 챌린지입니다.',
    startDate: '2025-01-01',
    endDate: '2025-01-31',
    progress: 60,
    status: '진행중'
  },
  {
    id: 2,
    title: '매일 채소 5가지 먹기',
    description: '매일 5가지 이상의 채소를 섭취하는 챌린지입니다.',
    startDate: '2025-01-10',
    endDate: '2025-01-31',
    progress: 85,
    status: '진행중'
  },
])

// 더미 데이터 - 참여 가능한 챌린지
const availableChallenges = ref([
  {
    id: 3,
    title: '아침 식사 거르지 않기',
    description: '21일 동안 매일 아침 식사를 하는 챌린지입니다.',
    startDate: '2025-02-01',
    endDate: '2025-02-21',
    participants: 124
  },
  {
    id: 4,
    title: '주 3회 운동과 함께하는 식단',
    description: '운동과 함께 균형 잡힌 식단을 유지하는 챌린지입니다.',
    startDate: '2025-02-01',
    endDate: '2025-02-28',
    participants: 89
  },
  {
    id: 5,
    title: '간식 줄이기 챌린지',
    description: '14일 동안 하루 1회 이하로 간식 섭취를 제한하는 챌린지입니다.',
    startDate: '2025-02-05',
    endDate: '2025-02-19',
    participants: 156
  },
])

// 모달 상태
const showDetailModal = ref(false)
const showJoinModal = ref(false)
const showLogoutModal = ref(false)
const selectedChallenge = ref(null)

// 토스트 메시지
const showToast = ref(false)
const toastMessage = ref('')

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

// 토스트 메시지 표시
const displayToast = (message) => {
  toastMessage.value = message
  showToast.value = true
  setTimeout(() => {
    showToast.value = false
  }, 3000)
}

// 상세보기
const showDetail = (challenge) => {
  selectedChallenge.value = challenge
  showDetailModal.value = true
}

// 참여하기 모달 열기
const openJoinModal = (challenge) => {
  selectedChallenge.value = challenge
  showJoinModal.value = true
}

// 챌린지 참여 확정
const confirmJoin = () => {
  const challenge = selectedChallenge.value

  // 참여 중인 챌린지에 추가
  myChallenges.value.push({
    id: challenge.id,
    title: challenge.title,
    description: challenge.description,
    startDate: challenge.startDate,
    endDate: challenge.endDate,
    progress: 0,
    status: '진행중'
  })

  // 참여 가능한 챌린지에서 제거
  const index = availableChallenges.value.findIndex(c => c.id === challenge.id)
  if (index !== -1) {
    availableChallenges.value.splice(index, 1)
  }

  showJoinModal.value = false
  selectedChallenge.value = null

  displayToast(`'${challenge.title}' 챌린지에 참여했습니다!`)
}

// 포기하기
const quitChallenge = (challenge) => {
  if (confirm(`'${challenge.title}' 챌린지를 포기하시겠습니까?`)) {
    // 참여 중인 챌린지에서 제거
    const index = myChallenges.value.findIndex(c => c.id === challenge.id)
    if (index !== -1) {
      myChallenges.value.splice(index, 1)
    }

    // 참여 가능한 챌린지에 다시 추가
    availableChallenges.value.push({
      id: challenge.id,
      title: challenge.title,
      description: challenge.description,
      startDate: challenge.startDate,
      endDate: challenge.endDate,
      participants: Math.floor(Math.random() * 100) + 50
    })

    displayToast('챌린지를 포기했습니다.')
  }
}
</script>

<template>
  <div class="challenge-container">
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
          <router-link to="/board" class="nav-item">게시판</router-link>
          <router-link to="/challenge" class="nav-item active">챌린지</router-link>
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
        <!-- 진행 중인 챌린지 -->
        <section class="challenge-section">
          <h2 class="section-title">내가 참여 중인 챌린지</h2>

          <div v-if="myChallenges.length === 0" class="empty-state">
            <p class="empty-text">참여 중인 챌린지가 없습니다.</p>
            <p class="empty-subtext">아래에서 새로운 챌린지에 도전해보세요!</p>
          </div>

          <div v-else class="challenge-grid">
            <div v-for="challenge in myChallenges" :key="challenge.id" class="challenge-card participating">
              <div class="challenge-status-badge">{{ challenge.status }}</div>

              <h3 class="challenge-title">{{ challenge.title }}</h3>
              <p class="challenge-description">{{ challenge.description }}</p>

              <div class="challenge-period">
                <span class="period-icon">📅</span>
                <span class="period-text">{{ challenge.startDate }} ~ {{ challenge.endDate }}</span>
              </div>

              <div class="challenge-progress-section">
                <div class="progress-header">
                  <span class="progress-label">진행률</span>
                  <span class="progress-percentage">{{ challenge.progress }}%</span>
                </div>
                <div class="progress-bar-container">
                  <div class="progress-bar-fill" :style="{ width: challenge.progress + '%' }"></div>
                </div>
              </div>

              <div class="challenge-actions">
                <button class="challenge-detail-btn" @click="showDetail(challenge)">상세 보기</button>
                <button class="challenge-quit-btn" @click="quitChallenge(challenge)">포기하기</button>
              </div>
            </div>
          </div>
        </section>

        <!-- 참여 가능한 챌린지 -->
        <section class="challenge-section">
          <h2 class="section-title">참여 가능한 챌린지</h2>

          <div class="challenge-grid">
            <div v-for="challenge in availableChallenges" :key="challenge.id" class="challenge-card available">
              <div class="challenge-participants">
                <span class="participants-icon">👥</span>
                <span class="participants-count">{{ challenge.participants }}명 참여 중</span>
              </div>

              <h3 class="challenge-title">{{ challenge.title }}</h3>
              <p class="challenge-description">{{ challenge.description }}</p>

              <div class="challenge-period">
                <span class="period-icon">📅</span>
                <span class="period-text">{{ challenge.startDate }} ~ {{ challenge.endDate }}</span>
              </div>

              <div class="challenge-actions">
                <button class="challenge-join-btn" @click="openJoinModal(challenge)">
                  🎯 챌린지 참여하기
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>

    <!-- 상세보기 모달 -->
    <div v-if="showDetailModal" class="modal-overlay" @click="showDetailModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2 class="modal-title">챌린지 상세 정보</h2>
          <button class="modal-close" @click="showDetailModal = false">✕</button>
        </div>
        <div class="modal-body" v-if="selectedChallenge">
          <h3 class="detail-challenge-title">{{ selectedChallenge.title }}</h3>
          <p class="detail-description">{{ selectedChallenge.description }}</p>

          <div class="detail-section">
            <h4 class="detail-section-title">📅 기간</h4>
            <p class="detail-text">{{ selectedChallenge.startDate }} ~ {{ selectedChallenge.endDate }}</p>
          </div>

          <div class="detail-section" v-if="selectedChallenge.progress !== undefined">
            <h4 class="detail-section-title">📊 현재 진행률</h4>
            <p class="detail-text">{{ selectedChallenge.progress }}% 완료</p>
          </div>

          <div class="detail-section">
            <h4 class="detail-section-title">🎯 챌린지 규칙</h4>
            <ul class="detail-list">
              <li>매일 식단을 기록해야 합니다</li>
              <li>하루라도 빠지면 챌린지 실패로 간주됩니다</li>
              <li>다른 참여자들과 경험을 공유할 수 있습니다</li>
            </ul>
          </div>

          <div class="detail-section">
            <h4 class="detail-section-title">🏆 완주 보상</h4>
            <ul class="detail-list">
              <li>완주 배지 획득</li>
              <li>커뮤니티 인기 게시글 우선 노출</li>
              <li>다음 챌린지 우선 참여권</li>
            </ul>
          </div>
        </div>
        <div class="modal-footer">
          <button class="modal-btn close-btn" @click="showDetailModal = false">닫기</button>
        </div>
      </div>
    </div>

    <!-- 참여 확인 모달 -->
    <div v-if="showJoinModal" class="modal-overlay" @click="showJoinModal = false">
      <div class="modal-content small-modal" @click.stop>
        <div class="modal-header">
          <h2 class="modal-title">챌린지 참여 확인</h2>
          <button class="modal-close" @click="showJoinModal = false">✕</button>
        </div>
        <div class="modal-body" v-if="selectedChallenge">
          <p class="confirm-message">
            <strong>{{ selectedChallenge.title }}</strong> 챌린지에 참여하시겠습니까?
          </p>
          <p class="confirm-submessage">
            참여 후에는 매일 식단을 기록해야 합니다.
          </p>
        </div>
        <div class="modal-footer">
          <button class="modal-btn cancel-btn" @click="showJoinModal = false">취소</button>
          <button class="modal-btn confirm-btn" @click="confirmJoin">참여하기</button>
        </div>
      </div>
    </div>

    <!-- 토스트 메시지 -->
    <div v-if="showToast" class="toast-message">
      <div class="toast-icon">✓</div>
      <span class="toast-text">{{ toastMessage }}</span>
    </div>

    <!-- 로그아웃 확인 모달 -->
    <div v-if="showLogoutModal" class="modal-overlay" @click="showLogoutModal = false">
      <div class="modal-content small-modal" @click.stop>
        <div class="modal-header">
          <h2 class="modal-title">로그아웃</h2>
          <button class="modal-close" @click="showLogoutModal = false">✕</button>
        </div>
        <div class="modal-body">
          <p class="confirm-message">로그아웃 하시겠습니까?</p>
        </div>
        <div class="modal-footer">
          <button class="modal-btn cancel-btn" @click="showLogoutModal = false">취소</button>
          <button class="modal-btn logout-btn" @click="confirmLogout">로그아웃</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.challenge-container {
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

.challenge-section {
  margin-bottom: 48px;
}

.section-title {
  font-size: 28px;
  font-weight: 700;
  color: #333333;
  margin-bottom: 24px;
}

/* 빈 상태 */
.empty-state {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 60px 40px;
  text-align: center;
}

.empty-text {
  font-size: 18px;
  font-weight: 600;
  color: #666666;
  margin-bottom: 8px;
}

.empty-subtext {
  font-size: 15px;
  color: #888888;
}

/* 챌린지 그리드 */
.challenge-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 24px;
}

.challenge-card {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 28px;
  position: relative;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.challenge-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
}

.challenge-card.participating {
  border: 2px solid #4CAF50;
}

.challenge-status-badge {
  position: absolute;
  top: 20px;
  right: 20px;
  padding: 6px 14px;
  background: #4CAF50;
  color: #FFFFFF;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
}

.challenge-participants {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 16px;
  color: #FFA726;
  font-size: 14px;
  font-weight: 600;
}

.participants-icon {
  font-size: 16px;
}

.challenge-title {
  font-size: 20px;
  font-weight: 700;
  color: #333333;
  margin-bottom: 12px;
  line-height: 1.4;
}

.challenge-description {
  font-size: 14px;
  color: #666666;
  line-height: 1.6;
  margin-bottom: 20px;
}

.challenge-period {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #F8F9FA;
  border-radius: 8px;
  margin-bottom: 20px;
}

.period-icon {
  font-size: 16px;
}

.period-text {
  font-size: 14px;
  color: #666666;
}

/* 진행률 */
.challenge-progress-section {
  margin-bottom: 24px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.progress-label {
  font-size: 14px;
  color: #666666;
  font-weight: 600;
}

.progress-percentage {
  font-size: 16px;
  font-weight: 700;
  color: #4CAF50;
}

.progress-bar-container {
  width: 100%;
  height: 10px;
  background: #E0E0E0;
  border-radius: 5px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #4CAF50 0%, #66BB6A 100%);
  transition: width 0.3s ease;
  border-radius: 5px;
}

/* 액션 버튼 */
.challenge-actions {
  display: flex;
  gap: 12px;
}

.challenge-detail-btn,
.challenge-quit-btn {
  flex: 1;
  padding: 12px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.challenge-detail-btn {
  background: #4CAF50;
  color: #FFFFFF;
  border: none;
}

.challenge-detail-btn:hover {
  background: #45A049;
}

.challenge-quit-btn {
  background: transparent;
  color: #F44336;
  border: 1px solid #F44336;
}

.challenge-quit-btn:hover {
  background: #F44336;
  color: #FFFFFF;
}

.challenge-join-btn {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%);
  color: #FFFFFF;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
}

.challenge-join-btn:hover {
  transform: scale(1.02);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
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
}

.modal-content {
  background: #FFFFFF;
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.modal-content.small-modal {
  max-width: 450px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 28px;
  border-bottom: 1px solid #E0E0E0;
}

.modal-title {
  font-size: 20px;
  font-weight: 700;
  color: #333333;
}

.modal-close {
  width: 32px;
  height: 32px;
  background: transparent;
  border: none;
  color: #666666;
  font-size: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.3s ease;
}

.modal-close:hover {
  background: #F8F9FA;
  color: #333333;
}

.modal-body {
  padding: 28px;
}

.detail-challenge-title {
  font-size: 22px;
  font-weight: 700;
  color: #333333;
  margin-bottom: 12px;
}

.detail-description {
  font-size: 15px;
  color: #666666;
  line-height: 1.6;
  margin-bottom: 24px;
}

.detail-section {
  margin-bottom: 24px;
}

.detail-section-title {
  font-size: 16px;
  font-weight: 700;
  color: #333333;
  margin-bottom: 12px;
}

.detail-text {
  font-size: 14px;
  color: #666666;
  line-height: 1.6;
}

.detail-list {
  list-style: none;
  padding: 0;
}

.detail-list li {
  font-size: 14px;
  color: #666666;
  line-height: 1.8;
  padding-left: 20px;
  position: relative;
}

.detail-list li::before {
  content: '•';
  position: absolute;
  left: 0;
  color: #4CAF50;
  font-weight: 700;
}

.confirm-message {
  font-size: 16px;
  color: #333333;
  margin: 8px 0;
  line-height: 1.6;
  text-align: center;
}

.confirm-message strong {
  color: #4CAF50;
  font-weight: 700;
}

.confirm-submessage {
  font-size: 14px;
  color: #888888;
  line-height: 1.6;
}

.modal-body {
  padding: 32px 28px;
  text-align: center;
}

.modal-footer {
  padding: 24px 28px;
  border-top: 1px solid #E0E0E0;
  display: flex;
  gap: 12px;
  justify-content: center;
}

.modal-btn {
  padding: 12px 32px;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 100px;
}

.close-btn,
.cancel-btn {
  background: #F5F7FA;
  border: 1px solid #E0E0E0;
  color: #666666;
}

.close-btn:hover,
.cancel-btn:hover {
  background: #E8EAF0;
  border-color: #BDBDBD;
  color: #333333;
}

.confirm-btn {
  background: #4CAF50;
  border: none;
  color: #FFFFFF;
}

.confirm-btn:hover {
  background: #45A049;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
}

.logout-btn {
  background: #4CAF50;
  border: none;
  color: #FFFFFF;
}

.logout-btn:hover {
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
  z-index: 1100;
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
@media (max-width: 968px) {
  .challenge-grid {
    grid-template-columns: 1fr;
  }

  .modal-content {
    width: 95%;
    max-height: 90vh;
  }

  .toast-message {
    bottom: 20px;
    max-width: 90%;
  }
}
</style>

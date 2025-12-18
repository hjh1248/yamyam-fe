<template>
  <div class="challenge-view">
    <AppHeader active-page="challenge" />

    <main class="main-content">
      <div class="container">
        <div class="page-header">
          <h1 class="page-title">챌린지</h1>
          <button @click="openCreateModal" class="create-btn">+ 챌린지 만들기</button>
        </div>

        <div class="dashboard-stats">
          <div class="stat-card">
            <div class="stat-icon">🔥</div>
            <div class="stat-info">
              <span class="stat-label">진행 중</span>
              <span class="stat-value">{{ myChallenges.length }}개</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">📈</div>
            <div class="stat-info">
              <span class="stat-label">평균 달성률</span>
              <span class="stat-value">{{ averageProgress }}%</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">🆕</div>
            <div class="stat-info">
              <span class="stat-label">참여 가능</span>
              <span class="stat-value">{{ availableChallenges.length }}개</span>
            </div>
          </div>
        </div>

        <section class="challenge-section">
          <h2 class="section-title">참여 중인 챌린지</h2>
          
          <div v-if="myChallenges.length > 0" class="challenge-list">
            <div v-for="challenge in myChallenges" :key="challenge.id" 
                class="challenge-card"
                :class="{ 'deleted-card': challenge.challengeStatus === 'DELETED' }">
              
              <div class="card-header">
                <span v-if="challenge.challengeStatus === 'DELETED'" class="status-badge deleted">삭제됨</span>
                <span v-else class="status-badge">진행중</span>
                
                <span v-if="challenge.challengeStatus !== 'DELETED'" class="d-day">
                  D-{{ calculateDday(challenge.endDate) }}
                </span>

                <button 
                  v-if="currentUserId === challenge.creatorId && challenge.challengeStatus !== 'DELETED'" 
                  @click.stop="deleteChallenge(challenge)" 
                  class="btn-delete-icon" 
                  title="내가 만든 챌린지 삭제">
                  🗑️
                </button>
              </div>

              <h3 class="challenge-title">{{ challenge.title }}</h3>

              <div v-if="challenge.challengeStatus === 'DELETED'" class="deleted-notice">
                ⚠️ 개최자에 의해 종료된 챌린지입니다.<br>목록에서 제거해주세요.
              </div>

              <div v-else class="progress-container">
                <div class="progress-bar">
                  <div class="progress-fill" :style="{ width: challenge.progress + '%' }"></div>
                </div>
                <span class="progress-text">{{ challenge.progress }}% 달성</span>
              </div>

              <p class="challenge-date">{{ challenge.startDate }} ~ {{ challenge.endDate }}</p>
              
              <button @click="quitChallengeBtn(challenge)" class="btn-quit">
                {{ challenge.challengeStatus === 'DELETED' ? '목록에서 삭제' : '포기하기' }}
              </button>
            </div>
          </div>
          
          <div v-else class="empty-state">
            <p>참여 중인 챌린지가 없습니다.</p>
          </div>
        </section>

        <section class="challenge-section">
          <h2 class="section-title">참여 가능한 챌린지</h2>
          
          <div v-if="availableChallenges.length > 0" class="challenge-list">
            <div v-for="challenge in availableChallenges" :key="challenge.id" class="challenge-card available">
              <div class="card-header">
                <span class="participants-count">👥 {{ challenge.participants }}명 참여중</span>
                
                <button 
                  v-if="currentUserId === challenge.creatorId" 
                  @click.stop="deleteChallenge(challenge)" 
                  class="btn-delete-icon" 
                  title="내가 만든 챌린지 삭제">
                  🗑️
                </button>
              </div>
              
              <h3 class="challenge-title">{{ challenge.title }}</h3>
              <p class="challenge-desc">{{ challenge.description }}</p>
              <p class="challenge-date">{{ challenge.startDate }} ~ {{ challenge.endDate }}</p>
              <button @click="openJoinModal(challenge)" class="btn-join">참여하기</button>
            </div>
          </div>
          
          <div v-else class="empty-state">
            <p>새로운 챌린지가 없습니다.</p>
          </div>
        </section>

      </div>
    </main>

    <div v-if="showCreateModal" class="modal-overlay" @click="showCreateModal = false">
        <div class="modal-content" @click.stop>
            <h3>새 챌린지 만들기</h3>
            <input v-model="newChallenge.title" placeholder="제목" class="form-input mb-2">
            <textarea v-model="newChallenge.description" placeholder="설명" class="form-textarea mb-2"></textarea>
            <div class="form-row">
                <div class="form-group">
                  <label>시작일</label>
                  <input type="date" v-model="newChallenge.startDate" class="form-input">
                </div>
                <div class="form-group">
                  <label>종료일</label>
                  <input type="date" v-model="newChallenge.endDate" class="form-input">
                </div>
            </div>
            <div class="modal-footer">
                <button @click="createChallenge" class="btn-confirm">생성</button>
                <button @click="showCreateModal = false" class="btn-cancel">취소</button>
            </div>
        </div>
    </div>

    <div v-if="showJoinModal" class="modal-overlay" @click="showJoinModal = false">
      <div class="modal-content small-modal" @click.stop>
        <h3>챌린지에 참여하시겠습니까?</h3>
        <p class="confirm-message"><strong>{{ selectedChallenge?.title }}</strong></p>
        <div class="modal-footer">
          <button @click="confirmJoin" class="confirm-btn">참여하기</button>
          <button @click="showJoinModal = false" class="cancel-btn">취소</button>
        </div>
      </div>
    </div>

    <div v-if="showQuitModal" class="modal-overlay" @click="showQuitModal = false">
      <div class="modal-content small-modal" @click.stop>
        <h3>정말 포기하시겠습니까?</h3>
        <p class="confirm-message red-text">이 작업은 되돌릴 수 없습니다.</p>
        <div class="modal-footer">
          <button @click="confirmQuit" class="quit-btn">포기하기</button>
          <button @click="showQuitModal = false" class="cancel-btn">취소</button>
        </div>
      </div>
    </div>
    
    <transition name="slideUp">
      <div v-if="showToast" class="toast">
        <span class="toast-icon">✓</span>
        <span class="toast-message">{{ toastMessage }}</span>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue' // ★ 헤더 컴포넌트 임포트
import api from '@/util/axios'

const router = useRouter()

// State
const myChallenges = ref([])
const availableChallenges = ref([])
const currentUserId = ref(null)

const showCreateModal = ref(false)
const showJoinModal = ref(false)
const showQuitModal = ref(false)
const selectedChallenge = ref(null)

const showToast = ref(false)
const toastMessage = ref('')
const newChallenge = ref({ title: '', description: '', startDate: '', endDate: '' })

// Computed: 평균 달성률
const averageProgress = computed(() => {
  if (myChallenges.value.length === 0) return 0
  const total = myChallenges.value.reduce((sum, c) => sum + (c.progress || 0), 0)
  return Math.round(total / myChallenges.value.length)
})

// Helper
const formatDate = (d) => d ? d.split('T')[0] : ''
const calculateDday = (endDate) => {
    const diff = new Date(endDate) - new Date();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}
const displayToast = (msg) => { toastMessage.value = msg; showToast.value = true; setTimeout(() => showToast.value = false, 3000); }

// API Actions
const fetchUserInfo = async () => {
    try {
        const res = await api.get('/api/users/me')
        currentUserId.value = res.data.id
    } catch (e) { console.error(e) }
}

const fetchChallenges = async () => {
    try {
        const [myRes, availRes] = await Promise.all([
            api.get('/api/challenges/my'),
            api.get('/api/challenges/available')
        ])
        myChallenges.value = myRes.data.map(c => ({...c, startDate: formatDate(c.startDate), endDate: formatDate(c.endDate)}))
        availableChallenges.value = availRes.data.map(c => ({...c, startDate: formatDate(c.startDate), endDate: formatDate(c.endDate)}))
    } catch (e) { console.error(e) }
}

// Logic
const openCreateModal = () => {
  newChallenge.value = { title: '', description: '', startDate: '', endDate: '' }
  showCreateModal.value = true
}

const createChallenge = async () => {
    try {
        await api.post('/api/challenges', newChallenge.value)
        showCreateModal.value = false
        await fetchChallenges()
        displayToast('생성 완료!')
    } catch (e) { displayToast('생성 실패: 입력값을 확인해주세요') }
}

const deleteChallenge = async (challenge) => {
    if(!confirm('정말 삭제하시겠습니까? (참여자 목록에는 삭제됨으로 표시됩니다)')) return;
    try {
        await api.delete(`/api/challenges/${challenge.id}`)
        await fetchChallenges()
        displayToast('삭제되었습니다.')
    } catch (e) { displayToast('삭제 권한이 없습니다.') }
}

const openJoinModal = (challenge) => {
  selectedChallenge.value = challenge
  showJoinModal.value = true
}

const confirmJoin = async () => {
  try {
    await api.post(`/api/challenges/${selectedChallenge.value.id}/join`)
    showJoinModal.value = false
    await fetchChallenges()
    displayToast('참여 완료!')
  } catch (e) { displayToast('참여 실패') }
}

const quitChallengeBtn = (challenge) => {
  if (challenge.challengeStatus === 'DELETED') confirmQuit(challenge)
  else { selectedChallenge.value = challenge; showQuitModal.value = true; }
}

const confirmQuit = async (challengeParam) => {
  const target = challengeParam || selectedChallenge.value
  try {
    await api.delete(`/api/challenges/${target.id}/quit`)
    showQuitModal.value = false
    await fetchChallenges()
    displayToast('목록에서 제거되었습니다.')
  } catch(e) { displayToast('오류 발생') }
}

onMounted(async () => {
    await fetchUserInfo()
    await fetchChallenges()
})
</script>

<style scoped>
/* FriendsView와 동일한 레이아웃 구조 */
* { margin: 0; padding: 0; box-sizing: border-box; }

.challenge-view {
  min-height: 100vh;
  background: #F5F7FA;
}

.main-content {
  padding: 40px;
}

.container {
  max-width: 1400px; /* FriendsView와 폭 맞춤 */
  margin: 0 auto;
  /* background: #FFFFFF; <--- 컨테이너 전체 배경색을 원하면 주석 해제, 지금은 카드형이라 뺌 */ 
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.page-title {
  font-size: 28px;
  color: #333333;
}

.create-btn {
  background-color: #4CAF50;
  color: white;
  border: none;
  padding: 10px 24px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}
.create-btn:hover { background-color: #45a049; transform: translateY(-2px); }

/* 대시보드 통계 카드 스타일 */
.dashboard-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

.stat-card {
  background: white;
  padding: 24px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.stat-icon {
  width: 50px; height: 50px;
  background: #E8F5E9; color: #4CAF50;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 24px;
}

.stat-info { display: flex; flex-direction: column; }
.stat-label { font-size: 14px; color: #666; margin-bottom: 4px; }
.stat-value { font-size: 24px; font-weight: 700; color: #333; }

/* 챌린지 섹션 및 카드 */
.section-title { font-size: 20px; color: #333; margin-bottom: 20px; font-weight: 600; }
.challenge-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 24px; }

.challenge-card {
  background: white; border-radius: 12px; padding: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06); transition: transform 0.2s;
  display: flex; flex-direction: column;
}
.challenge-card:hover { transform: translateY(-4px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }

.card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.status-badge { padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; background: #E8F5E9; color: #4CAF50; }
.status-badge.deleted { background: #666; color: white; }
.d-day { color: #FF5722; font-weight: 700; font-size: 14px; }

.challenge-title { font-size: 18px; font-weight: 700; margin-bottom: 12px; color: #333; }
.challenge-desc { font-size: 14px; color: #666; margin-bottom: 20px; line-height: 1.5; flex-grow: 1; }
.challenge-date { font-size: 12px; color: #999; margin-top: auto; margin-bottom: 16px; }

/* 진행바 */
.progress-container { margin-bottom: 16px; }
.progress-bar { height: 8px; background: #eee; border-radius: 4px; overflow: hidden; margin-bottom: 6px; }
.progress-fill { height: 100%; background: #4CAF50; }
.progress-text { font-size: 12px; color: #666; }

/* 버튼 */
.btn-join { width: 100%; padding: 12px; background: #4CAF50; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; }
.btn-quit { width: 100%; padding: 10px; background: white; border: 1px solid #FFCDD2; color: #E53935; border-radius: 8px; cursor: pointer; }
.btn-delete-icon { background: none; border: none; font-size: 18px; cursor: pointer; color: #999; }
.btn-delete-icon:hover { color: #E53935; }

/* 상태 */
.deleted-card { background: #f9f9f9; opacity: 0.9; border: 1px solid #ddd; }
.deleted-notice { background: #ffebee; color: #d32f2f; padding: 10px; border-radius: 8px; font-size: 13px; margin: 10px 0; font-weight: bold; }
.empty-state { text-align: center; padding: 40px; background: white; border-radius: 12px; color: #999; }

/* 모달 */
.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal-content { background: white; padding: 24px; border-radius: 12px; width: 90%; max-width: 500px; }
.modal-content.small-modal { max-width: 350px; text-align: center; }
.modal-footer { display: flex; justify-content: flex-end; gap: 10px; margin-top: 24px; }
.form-input, .form-textarea { width: 100%; padding: 10px; border: 2px solid #E0E0E0; border-radius: 8px; font-size: 15px; }
.form-input:focus, .form-textarea:focus { outline: none; border-color: #4CAF50; }
.form-row { display: flex; gap: 10px; margin-top: 10px; }
.form-group { flex: 1; }
.form-group label { display: block; font-size: 12px; margin-bottom: 4px; color: #666; }
.mb-2 { margin-bottom: 12px; }

.btn-confirm { padding: 10px 20px; background: #4CAF50; color: white; border: none; border-radius: 6px; cursor: pointer; }
.btn-cancel { padding: 10px 20px; background: #f5f5f5; color: #333; border: none; border-radius: 6px; cursor: pointer; }
.quit-btn { padding: 10px 20px; background: #F44336; color: white; border: none; border-radius: 6px; cursor: pointer; }
.red-text { color: #F44336; margin-top: 8px; font-size: 14px; }

/* 토스트 (FriendsView와 동일) */
.toast {
  position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%);
  background: #FFFFFF; padding: 16px 24px; border-radius: 10px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15); display: flex; align-items: center; gap: 12px; z-index: 1000;
}
.toast-icon { width: 24px; height: 24px; background: #4CAF50; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; }
.toast-message { color: #333; font-weight: 500; }
.slideUp-enter-active { animation: slideUp 0.3s ease-out; }
@keyframes slideUp { from { transform: translate(-50%, 20px); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } }
</style>
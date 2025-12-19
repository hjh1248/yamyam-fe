<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import api from '@/util/axios'

const route = useRoute()
const router = useRouter()
const challengeId = route.params.id

const challenge = ref(null)
const successDates = ref([])
const isParticipating = ref(false) // 참여 여부 상태
const today = new Date().toISOString().split('T')[0]

// 1. 챌린지 상세 정보 불러오기
const fetchDetail = async () => {
  try {
    const res = await api.get(`/api/challenges/${challengeId}/detail`)
    challenge.value = res.data
    successDates.value = res.data.successDates
  } catch (e) {
    console.error(e)
    alert('정보를 불러오지 못했습니다.')
  }
}

// 2. 참여 여부 확인 (내 챌린지 목록 조회)
const checkParticipation = async () => {
  try {
    const res = await api.get('/api/challenges/my')
    // 내 챌린지 목록에 현재 ID가 있는지 확인
    const myChallengeIds = res.data.map(c => c.id)
    isParticipating.value = myChallengeIds.includes(Number(challengeId))
  } catch (e) {
    console.error('참여 상태 확인 실패', e)
  }
}

// 3. 체크 토글 (참여자만 가능)
const toggleCheck = async () => {
  if (!isParticipating.value) {
    alert('챌린지에 참여해야 인증할 수 있습니다!')
    return
  }

  try {
    await api.post(`/api/challenges/${challengeId}/check`)
    await fetchDetail() // 데이터 갱신
  } catch (e) {
    console.error(e)
    alert('처리 중 오류가 발생했습니다.')
  }
}

// 4. 챌린지 참여하기
const joinChallenge = async () => {
  if(!confirm('이 챌린지에 참여하시겠습니까?')) return

  try {
    await api.post(`/api/challenges/${challenge.value.id}/join`)
    alert('참여가 완료되었습니다! 오늘부터 시작해보세요 🔥')
    await checkParticipation() // 상태 갱신
    await fetchDetail() // 데이터 갱신
  } catch (e) {
    console.error(e)
    alert('참여 실패: ' + (e.response?.data?.message || '오류가 발생했습니다.'))
  }
}

// 5. 챌린지 포기하기
const quitChallenge = async () => {
  if(!confirm('정말 포기하시겠습니까? 기록은 유지되지만 더 이상 도전할 수 없습니다.')) return

  try {
    await api.delete(`/api/challenges/${challenge.value.id}/quit`)
    alert('챌린지를 포기했습니다.')
    await checkParticipation() // 상태 갱신
    await fetchDetail() // 데이터 갱신
  } catch (e) {
    console.error(e)
    alert('포기 실패')
  }
}

// 6. 목록으로 돌아가기
const goBack = () => {
  router.push('/challenge') // 챌린지 목록 페이지 경로
}

// 날짜 목록 계산
const calendarDays = computed(() => {
  if (!challenge.value) return []
  
  const days = []
  let current = new Date(challenge.value.startDate)
  const end = new Date(challenge.value.endDate)
  
  while (current <= end) {
    const dateStr = current.toISOString().split('T')[0]
    days.push({
      date: dateStr,
      isSuccess: successDates.value.includes(dateStr),
      isToday: dateStr === today,
      isFuture: dateStr > today
    })
    current.setDate(current.getDate() + 1)
  }
  return days
})

onMounted(async () => {
  await fetchDetail()
  await checkParticipation()
})
</script>

<template>
  <div class="detail-container">
    <AppHeader active-page="challenge" />
    
    <main class="main-content" v-if="challenge">
      <div class="content-wrapper">
        
        <div class="header-section">
          <button @click="goBack" class="back-btn">← 목록으로</button>
          <div class="title-group">
            <h1 class="page-title">{{ challenge.title }}</h1>
            <span class="date-range">{{ challenge.startDate.split('T')[0] }} ~ {{ challenge.endDate.split('T')[0] }}</span>
          </div>
        </div>

        <div class="card desc-card">
          <h3>챌린지 소개</h3>
          <p class="desc-text">{{ challenge.description }}</p>
          
          <div class="action-area">
            <button v-if="!isParticipating" @click="joinChallenge" class="btn-action btn-join">
              참여하기
            </button>
            <button v-else @click="quitChallenge" class="btn-action btn-quit">
              포기하기
            </button>
          </div>
        </div>
        
        <div class="status-section" :class="{ 'disabled-section': !isParticipating }">
          
          <div class="card progress-card">
            <h2>나의 달성률</h2>
            <div class="progress-bar-lg">
               <div class="fill" :style="{ width: challenge.progress + '%' }"></div>
            </div>
            <p class="percent-text">{{ challenge.progress }}%</p>
            <p v-if="!isParticipating" class="info-msg">참여 후 달성률을 기록해보세요!</p>
          </div>

          <div class="card calendar-card">
            <h2>일별 기록</h2>
            <div class="calendar-grid">
              <div 
                v-for="day in calendarDays" 
                :key="day.date"
                class="day-item"
                :class="{ 
                  'success': day.isSuccess, 
                  'today': day.isToday,
                  'future': day.isFuture,
                  'clickable': isParticipating && day.isToday
                }"
                @click="day.isToday ? toggleCheck() : null"
              >
                <div class="day-date">{{ day.date.substring(5) }}</div>
                <div class="day-status">
                  <span v-if="day.isSuccess">✅ 성공</span>
                  <span v-else-if="day.isFuture">🔒 예정</span>
                  <span v-else-if="day.isToday">
                    {{ isParticipating ? '👉 클릭' : '오늘' }}
                  </span>
                  <span v-else>❌ 실패</span>
                </div>
              </div>
            </div>
          </div>

        </div> </div>
    </main>
  </div>
</template>

<style scoped>
.detail-container { min-height: 100vh; background: #F5F7FA; }
.main-content { padding: 40px; }
.content-wrapper { max-width: 800px; margin: 0 auto; }

/* 헤더 영역 */
.header-section { margin-bottom: 24px; }
.back-btn {
  background: none; border: none; font-size: 15px; color: #666; cursor: pointer; margin-bottom: 12px; font-weight: 600;
  display: flex; align-items: center; gap: 4px;
}
.back-btn:hover { color: #333; }

.title-group { display: flex; justify-content: space-between; align-items: flex-end; }
.page-title { font-size: 32px; font-weight: 700; color: #333; margin: 0; }
.date-range { font-size: 14px; color: #888; font-weight: 500; }

/* 공통 카드 스타일 */
.card { background: white; padding: 30px; border-radius: 16px; margin-bottom: 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.04); }
.card h2, .card h3 { font-size: 18px; margin-bottom: 16px; font-weight: 700; color: #333; }

/* 설명 카드 (커지고 흰색 바탕) */
.desc-card { border: 1px solid #E0E0E0; }
.desc-text { 
  font-size: 16px; line-height: 1.6; color: #444; margin-bottom: 30px; 
  white-space: pre-line; /* 줄바꿈 반영 */
}

/* 액션 버튼 영역 */
.action-area { display: flex; justify-content: flex-end; border-top: 1px solid #eee; padding-top: 20px; }
.btn-action {
  padding: 12px 32px; border-radius: 8px; font-size: 16px; font-weight: 700; cursor: pointer; transition: all 0.2s; border: none;
}
.btn-join { background: #4CAF50; color: white; box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3); }
.btn-join:hover { background: #43A047; transform: translateY(-2px); }

.btn-quit { background: #FFEBEE; color: #D32F2F; }
.btn-quit:hover { background: #FFCDD2; }

/* 진행률 & 달력 섹션 */
.status-section { transition: opacity 0.3s; }
.disabled-section { opacity: 0.7; pointer-events: none; /* 비참여시 클릭 방지 */ }
.info-msg { font-size: 13px; color: #888; margin-top: 8px; text-align: right; }

/* 진행률 바 */
.progress-bar-lg { height: 24px; background: #F1F3F5; border-radius: 12px; overflow: hidden; margin-bottom: 8px; }
.fill { height: 100%; background: linear-gradient(90deg, #4CAF50, #81C784); transition: width 0.5s ease-out; }
.percent-text { text-align: right; font-weight: 800; color: #2E7D32; font-size: 20px; }

/* 캘린더 그리드 */
.calendar-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 12px; }
.day-item { 
  background: #f9f9f9; border: 1px solid #eee; border-radius: 12px; padding: 14px; 
  text-align: center; cursor: default; transition: all 0.2s; display: flex; flex-direction: column; gap: 4px;
}

/* 오늘 날짜 (참여 중일 때만 클릭 효과) */
.day-item.today.clickable { 
  border: 2px solid #4CAF50; background: #fff; cursor: pointer; 
  animation: pulse 2s infinite;
}
.day-item.today.clickable:hover { background: #E8F5E9; transform: translateY(-2px); }

/* 그냥 오늘 (비참여) */
.day-item.today { border: 2px solid #ddd; background: #fff; }

/* 성공한 날 */
.day-item.success { background: #E8F5E9; border-color: #A5D6A7; color: #2E7D32; }

/* 미래 */
.day-item.future { opacity: 0.5; background: #eee; color: #aaa; }

.day-date { font-size: 12px; color: #888; }
.day-status { font-size: 13px; font-weight: 600; }

@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.4); }
  70% { box-shadow: 0 0 0 6px rgba(76, 175, 80, 0); }
  100% { box-shadow: 0 0 0 0 rgba(76, 175, 80, 0); }
}

@media (max-width: 600px) {
  .title-group { flex-direction: column; align-items: flex-start; gap: 8px; }
  .calendar-grid { grid-template-columns: repeat(3, 1fr); }
}
</style>
<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import api from '@/util/axios'

const router = useRouter()
const challenges = ref([])
const activeTab = ref('ALL') // 현재 선택된 탭

// 탭 목록 정의
const tabs = [
  { id: 'ALL', label: '전체' },
  { id: 'RECRUITING', label: '모집 중' }, // 시작 전
  { id: 'PROGRESS', label: '진행 중' },   // 시작됨 ~ 종료 전
  { id: 'ENDED', label: '종료됨' }        // 종료일 지남
]

// API 호출
const fetchAllChallenges = async () => {
  try {
    // 백엔드에서 다 가져와서 프론트에서 필터링하거나, 
    // 백엔드에 status 파라미터를 보내서 가져올 수도 있습니다.
    // 여기서는 일단 다 가져와서 프론트 필터링 예시를 보여드릴게요.
    const res = await api.get('/api/challenges')
    challenges.value = res.data
  } catch (e) {
    console.error(e)
  }
}

// 탭에 따른 필터링 로직
const filteredChallenges = computed(() => {
  const now = new Date().toISOString().split('T')[0]
  
  return challenges.value.filter(c => {
    const start = c.startDate.split('T')[0]
    const end = c.endDate.split('T')[0]

    if (activeTab.value === 'ALL') return true
    if (activeTab.value === 'RECRUITING') return start > now // 아직 시작 안 함
    if (activeTab.value === 'PROGRESS') return start <= now && end >= now // 진행 중
    if (activeTab.value === 'ENDED') return end < now // 날짜 지남
    return true
  })
})

const goDetail = (id) => router.push(`/challenge/${id}`)
const goCreate = () => { /* 생성 모달 로직 등 연결 */ }

// D-Day 계산
const getDDay = (endDate) => {
  const diff = new Date(endDate) - new Date()
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
  return days > 0 ? `D-${days}` : (days === 0 ? 'D-Day' : '종료')
}

// 상태 뱃지 스타일
const getStatusBadge = (c) => {
  const now = new Date().toISOString().split('T')[0]
  const start = c.startDate.split('T')[0]
  const end = c.endDate.split('T')[0]
  
  if (start > now) return { text: '모집중', class: 'badge-recruit' }
  if (end < now) return { text: '종료', class: 'badge-end' }
  return { text: '진행중', class: 'badge-active' }
}

onMounted(() => {
  fetchAllChallenges()
})
</script>

<template>
  <div class="list-container">
    <AppHeader active-page="challenge" />
    
    <main class="main-content">
      <div class="content-wrapper">
        
        <div class="page-header">
          <div>
            <h1 class="page-title">챌린지 라운지 🏆</h1>
            <p class="page-subtitle">함께 도전하고 성장하는 공간입니다.</p>
          </div>
          </div>

        <div class="tabs">
          <button 
            v-for="tab in tabs" 
            :key="tab.id"
            class="tab-btn"
            :class="{ active: activeTab === tab.id }"
            @click="activeTab = tab.id"
          >
            {{ tab.label }}
          </button>
        </div>

        <div v-if="filteredChallenges.length > 0" class="challenge-grid">
          <div 
            v-for="challenge in filteredChallenges" 
            :key="challenge.id" 
            class="challenge-card"
            @click="goDetail(challenge.id)"
          >
            <div class="card-top">
              <span class="status-badge" :class="getStatusBadge(challenge).class">
                {{ getStatusBadge(challenge).text }}
              </span>
              <span class="participants">👥 {{ challenge.participants }}명</span>
            </div>
            
            <h3 class="card-title">{{ challenge.title }}</h3>
            <p class="card-desc">{{ challenge.description }}</p>
            
            <div class="card-footer">
              <span class="date">{{ challenge.startDate.split('T')[0] }} ~ {{ challenge.endDate.split('T')[0] }}</span>
              <span class="d-day">{{ getDDay(challenge.endDate) }}</span>
            </div>
          </div>
        </div>

        <div v-else class="empty-state">
          <p>해당하는 챌린지가 없습니다 텅...</p>
        </div>

      </div>
    </main>
  </div>
</template>

<style scoped>
.list-container { min-height: 100vh; background: #F5F7FA; }
.main-content { padding: 40px; }
.content-wrapper { max-width: 1200px; margin: 0 auto; }

/* 헤더 */
.page-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 30px; }
.page-title { font-size: 28px; font-weight: 800; color: #333; margin-bottom: 8px; }
.page-subtitle { color: #666; font-size: 16px; }

/* 탭 메뉴 */
.tabs { display: flex; gap: 12px; margin-bottom: 30px; border-bottom: 1px solid #ddd; padding-bottom: 16px; }
.tab-btn {
  background: none; border: none; font-size: 16px; color: #888; cursor: pointer; font-weight: 600; padding: 8px 16px; border-radius: 20px; transition: all 0.2s;
}
.tab-btn:hover { background: #eee; color: #555; }
.tab-btn.active { background: #333; color: white; box-shadow: 0 4px 10px rgba(0,0,0,0.2); }

/* 그리드 레이아웃 */
.challenge-grid { 
  display: grid; 
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); 
  gap: 24px; 
}

/* 카드 스타일 */
.challenge-card {
  background: white; border-radius: 16px; padding: 24px; cursor: pointer;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05); transition: transform 0.2s, box-shadow 0.2s;
  display: flex; flex-direction: column; height: 220px; /* 높이 고정 */
}
.challenge-card:hover { transform: translateY(-5px); box-shadow: 0 8px 20px rgba(0,0,0,0.1); }

.card-top { display: flex; justify-content: space-between; margin-bottom: 16px; }
.participants { font-size: 13px; color: #888; font-weight: 500; }

/* 상태 뱃지 */
.status-badge { padding: 4px 10px; border-radius: 8px; font-size: 12px; font-weight: 700; }
.badge-recruit { background: #E3F2FD; color: #1E88E5; } /* 파랑: 모집중 */
.badge-active { background: #E8F5E9; color: #43A047; }  /* 초록: 진행중 */
.badge-end { background: #F5F5F5; color: #999; }        /* 회색: 종료 */

.card-title { font-size: 18px; font-weight: 700; color: #333; margin-bottom: 8px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.card-desc { 
  font-size: 14px; color: #666; line-height: 1.5; flex-grow: 1; 
  display: -webkit-box; -webkit-line-clamp: 3; line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis;
}

.card-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 16px; border-top: 1px solid #f0f0f0; padding-top: 12px; }
.date { font-size: 12px; color: #999; }
.d-day { font-size: 14px; font-weight: 700; color: #FF5722; }

.empty-state { text-align: center; padding: 60px; color: #999; font-size: 16px; background: white; border-radius: 16px; }

@media (max-width: 600px) {
  .page-header { flex-direction: column; align-items: flex-start; gap: 10px; }
  .tabs { overflow-x: auto; white-space: nowrap; padding-bottom: 8px; } /* 모바일 스크롤 탭 */
}
</style>
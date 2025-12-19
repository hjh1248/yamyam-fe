<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import api from '@/util/axios'

const route = useRoute()
const router = useRouter()

// URL에서 유저 ID 가져오기
const targetUserId = route.params.id

// 1. 타인 유저 정보
const userInfo = ref({
  id: '',
  name: '',
  nickname: '',
  email: ''
})

// 2. 팔로우 상태 관리
const isFollowing = ref(false)
const followStats = ref({
  followers: 0,
  following: 0
})

// 3. 타인의 신체 정보 이력
const bodySpecs = ref([])

// --- [API 통신 함수들] ---

const fetchUserProfile = async () => {
  try {
    // 유저 기본 정보 조회 (백엔드에서 isFollowing 여부 포함)
    const response = await api.get(`/api/users/${targetUserId}`)
    const data = response.data
    console.log("서버에서 온 데이터:", data)

    userInfo.value = {
      id: data.id,
      name: data.name,
      nickname: data.nickname,
      email: data.email
    }

    followStats.value = {
      followers: data.followers,
      following: data.following
    }
    
    // 백엔드에서 받은 팔로우 여부 적용
    isFollowing.value = data.isFollowing || false 

  } catch (error) {
    console.error('유저 정보 로딩 실패:', error)
    alert('존재하지 않거나 조회할 수 없는 유저입니다.')
    router.push('/')
  }
}

const fetchUserBodySpecs = async () => {
  try {
    // ★ API 경로 수정됨: /api/body-specs/users/{userId}
    const response = await api.get(`/api/body-specs/users/${targetUserId}`)
    bodySpecs.value = response.data.sort((a, b) => new Date(a.date) - new Date(b.date))
  } catch (error) {
    console.error('신체 정보 로딩 실패:', error)
  }
}

// 팔로우 / 언팔로우 토글
const toggleFollow = async () => {
  try {
    if (isFollowing.value) {
      // 언팔로우
      await api.delete(`/api/follows/${targetUserId}`)
      isFollowing.value = false
      followStats.value.followers-- 
    } else {
      // 팔로우
      await api.post(`/api/follows/${targetUserId}`)
      isFollowing.value = true
      followStats.value.followers++ 
    }
  } catch (error) {
    console.error('팔로우 처리 실패:', error)
    alert('작업을 처리할 수 없습니다.')
  }
}

onMounted(async () => {
  await Promise.all([
    fetchUserProfile(),
    fetchUserBodySpecs()
  ])
})

// 라우트 ID 변경 시 데이터 갱신
watch(() => route.params.id, (newId) => {
    location.reload() 
})

// --- [계산 로직 (읽기 전용)] ---

// 최신 신체 정보
const latestBodySpec = computed(() => {
  if (bodySpecs.value.length === 0) return null
  return [...bodySpecs.value].sort((a, b) => new Date(b.date) - new Date(a.date))[0]
})

// BMI 계산
const bmi = computed(() => {
  if (!latestBodySpec.value) return 0
  const heightM = latestBodySpec.value.height / 100
  return (latestBodySpec.value.weight / (heightM * heightM)).toFixed(1)
})

const bmiStatus = computed(() => {
  const bmiValue = parseFloat(bmi.value)
  if (bmiValue < 18.5) return { text: '저체중', color: '#2196F3' }
  if (bmiValue < 23) return { text: '정상', color: '#4CAF50' }
  if (bmiValue < 25) return { text: '과체중', color: '#FFA726' }
  return { text: '비만', color: '#F44336' }
})

// 차트 데이터 (최근 10개)
const chartData = computed(() => {
  const sorted = [...bodySpecs.value].sort((a, b) => new Date(a.date) - new Date(b.date))
  return sorted.slice(-10)
})

// 차트 관련 상수
const chartWidth = 800
const chartHeight = 300
const chartPadding = { top: 20, right: 40, bottom: 60, left: 60 }

const weightRange = computed(() => {
  if (chartData.value.length === 0) return { min: 0, max: 100 }
  const weights = chartData.value.map(d => d.weight)
  const min = Math.min(...weights)
  const max = Math.max(...weights)
  const padding = (max - min) * 0.2 || 5
  return {
    min: Math.floor(min - padding),
    max: Math.ceil(max + padding)
  }
})

const getX = (index) => {
  const dataWidth = chartWidth - chartPadding.left - chartPadding.right
  return chartPadding.left + (dataWidth / (chartData.value.length - 1 || 1)) * index
}

const getY = (weight) => {
  const dataHeight = chartHeight - chartPadding.top - chartPadding.bottom
  const range = weightRange.value.max - weightRange.value.min
  return chartPadding.top + dataHeight - ((weight - weightRange.value.min) / range * dataHeight)
}

const chartPath = computed(() => {
  if (chartData.value.length === 0) return ''
  return chartData.value.map((d, i) => {
    const x = getX(i)
    const y = getY(d.weight)
    return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`
  }).join(' ')
})

const yAxisTicks = computed(() => {
  const range = weightRange.value.max - weightRange.value.min
  const step = Math.ceil(range / 5)
  const ticks = []
  for (let i = 0; i <= 5; i++) {
    const value = weightRange.value.min + step * i
    ticks.push({ value, y: getY(value) })
  }
  return ticks.reverse()
})
</script>

<template>
  <div class="mypage-container">
    <AppHeader active-page="" />

    <main class="main-content">
      <div class="content-wrapper">
        <div class="page-header">
          <h1 class="page-title">{{ userInfo.nickname }}님의 프로필</h1>
        </div>

        <div class="grid-layout">
          <div class="card user-info-card">
            <div class="card-header">
              <h2 class="card-title">유저 정보</h2>
              <button 
                class="follow-btn" 
                :class="{ 'following': isFollowing }"
                @click="toggleFollow"
              >
                {{ isFollowing ? '언팔로우' : '팔로우' }}
              </button>
            </div>
            <div class="user-info">
              <div class="info-row">
                <span class="info-label">이름</span>
                <span class="info-value">{{ userInfo.name }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">닉네임</span>
                <span class="info-value">{{ userInfo.nickname }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">이메일</span>
                <span class="info-value">{{ userInfo.email }}</span>
              </div>
            </div>

            <div class="follow-wrapper">
              <div class="follow-section">
                <div class="follow-item">
                  <div class="follow-count">{{ followStats.followers }}</div>
                  <div class="follow-label">팔로워</div>
                </div>
                <div class="follow-divider"></div>
                <div class="follow-item">
                  <div class="follow-count">{{ followStats.following }}</div>
                  <div class="follow-label">팔로잉</div>
                </div>
              </div>
            </div>
          </div>

          <div class="card body-info-card">
            <div class="card-header">
              <h2 class="card-title">현재 상태</h2>
            </div>
            <div v-if="latestBodySpec" class="body-info">
              <div class="body-stats">
                <div class="stat-item">
                  <span class="stat-label">키</span>
                  <span class="stat-value">{{ latestBodySpec.height }}<span class="stat-unit">cm</span></span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">체중</span>
                  <span class="stat-value">{{ latestBodySpec.weight }}<span class="stat-unit">kg</span></span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">나이</span>
                  <span class="stat-value">{{ latestBodySpec.age }}<span class="stat-unit">세</span></span>
                </div>
              </div>
              <div class="bmi-section">
                <div class="bmi-header">
                  <span class="bmi-label">BMI</span>
                  <span class="bmi-value" :style="{ color: bmiStatus.color }">{{ bmi }}</span>
                </div>
                <div class="bmi-status" :style="{ backgroundColor: bmiStatus.color }">
                  {{ bmiStatus.text }}
                </div>
              </div>
              <div class="latest-date">
                최근 기록: {{ latestBodySpec.date }}
              </div>
            </div>
            <div v-else class="empty-body-info">
              <p class="empty-text">공개된 신체 정보가 없습니다.</p>
            </div>
          </div>

          <div class="card chart-card">
            <div class="card-header">
              <h2 class="card-title">체중 변화 추이</h2>
            </div>
            <div v-if="chartData.length >= 2" class="chart-container">
              <svg :width="chartWidth" :height="chartHeight" class="chart-svg">
                <g class="grid-lines">
                  <line v-for="tick in yAxisTicks" :key="tick.value" :x1="chartPadding.left" :y1="tick.y" :x2="chartWidth - chartPadding.right" :y2="tick.y" stroke="#E0E0E0" stroke-dasharray="4"/>
                </g>
                <g class="y-axis">
                  <line :x1="chartPadding.left" :y1="chartPadding.top" :x2="chartPadding.left" :y2="chartHeight - chartPadding.bottom" stroke="#666" stroke-width="2"/>
                  <text v-for="tick in yAxisTicks" :key="tick.value" :x="chartPadding.left - 10" :y="tick.y + 5" text-anchor="end" class="axis-label">{{ tick.value }}kg</text>
                </g>
                <g class="x-axis">
                  <line :x1="chartPadding.left" :y1="chartHeight - chartPadding.bottom" :x2="chartWidth - chartPadding.right" :y2="chartHeight - chartPadding.bottom" stroke="#666" stroke-width="2"/>
                  <text v-for="(d, i) in chartData" :key="i" :x="getX(i)" :y="chartHeight - chartPadding.bottom + 25" text-anchor="middle" class="axis-label">{{ d.date.substring(5) }}</text>
                </g>
                <path :d="chartPath" fill="none" stroke="#4CAF50" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                <g class="data-points">
                  <circle v-for="(d, i) in chartData" :key="i" :cx="getX(i)" :cy="getY(d.weight)" r="6" fill="#4CAF50" stroke="#FFFFFF" stroke-width="2"/>
                  <text v-for="(d, i) in chartData" :key="'label-' + i" :x="getX(i)" :y="getY(d.weight) - 15" text-anchor="middle" class="data-label">{{ d.weight }}kg</text>
                </g>
              </svg>
            </div>
            <div v-else class="empty-chart">
              <p class="empty-text">데이터가 부족하여 그래프를 표시할 수 없습니다.</p>
            </div>
          </div>

          <div class="card history-card">
            <div class="card-header">
              <h2 class="card-title">기록 이력</h2>
            </div>
            <div v-if="bodySpecs.length > 0" class="history-list">
              <div
                v-for="spec in [...bodySpecs].sort((a, b) => new Date(b.date) - new Date(a.date))"
                :key="spec.id"
                class="history-item"
              >
                <div class="history-date">{{ spec.date }}</div>
                <div class="history-stats">
                  <span class="history-stat">키: {{ spec.height }}cm</span>
                  <span class="history-stat">체중: {{ spec.weight }}kg</span>
                  <span class="history-stat">나이: {{ spec.age }}세</span>
                </div>
                </div>
            </div>
            <div v-else class="empty-history">
              <p class="empty-text">기록이 없습니다.</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
/* MyPage.vue 스타일 베이스 */
.mypage-container { min-height: 100vh; background-color: #F5F7FA; }
.main-content { padding: 40px; }
.content-wrapper { max-width: 1400px; margin: 0 auto; }
.page-header { margin-bottom: 32px; }
.page-title { font-size: 32px; font-weight: 700; color: #333333; }

.grid-layout { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; }
.card { background: #FFFFFF; border-radius: 12px; padding: 24px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06); }
.card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.card-title { font-size: 20px; font-weight: 700; color: #333333; }

/* 팔로우 버튼 */
.follow-btn {
  padding: 8px 24px; background: #4CAF50; color: #FFFFFF;
  border: none; border-radius: 6px; font-size: 14px; font-weight: 600;
  cursor: pointer; transition: all 0.2s ease;
}
.follow-btn:hover { background: #45A049; transform: translateY(-2px); }
.follow-btn.following { background: #E0E0E0; color: #555555; }
.follow-btn.following:hover { background: #D5D5D5; }

/* 유저 정보 */
.user-info { display: flex; flex-direction: column; gap: 16px; margin-bottom: 20px; }
.info-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #F0F0F0; }
.info-label { font-size: 15px; font-weight: 600; color: #666666; }
.info-value { font-size: 15px; color: #333333; }

/* 팔로워/팔로잉 */
.follow-wrapper { background: #F8F9FA; border-radius: 8px; margin-top: 8px; padding: 16px; }
.follow-section { display: flex; align-items: center; justify-content: space-around; }
.follow-item { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 4px 16px; }
.follow-count { font-size: 24px; font-weight: 700; color: #4CAF50; }
.follow-label { font-size: 14px; font-weight: 500; color: #666666; }
.follow-divider { width: 1px; height: 30px; background: #E0E0E0; }

/* 신체 정보 */
.body-info { display: flex; flex-direction: column; gap: 20px; }
.body-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.stat-item { text-align: center; padding: 16px; background: #F8F9FA; border-radius: 8px; }
.stat-label { display: block; font-size: 13px; color: #888888; margin-bottom: 8px; }
.stat-value { font-size: 28px; font-weight: 700; color: #333333; }
.stat-unit { font-size: 16px; font-weight: 500; color: #888888; margin-left: 4px; }

.bmi-section { padding: 16px; background: #F8F9FA; border-radius: 8px; }
.bmi-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.bmi-label { font-size: 15px; font-weight: 600; color: #666666; }
.bmi-value { font-size: 32px; font-weight: 700; }
.bmi-status { padding: 8px 16px; border-radius: 20px; color: #FFFFFF; font-size: 14px; font-weight: 600; }
.latest-date { font-size: 13px; color: #888888; text-align: center; }

/* 그래프 & 히스토리 (가로 확장) */
.chart-card { grid-column: span 2; }
.chart-container { overflow-x: auto; padding: 20px 0; }
.chart-svg { display: block; margin: 0 auto; }
.axis-label { font-size: 12px; fill: #666666; }
.data-label { font-size: 13px; font-weight: 600; fill: #333333; }

.history-card { grid-column: span 2; }
.history-list { display: flex; flex-direction: column; gap: 12px; max-height: 400px; overflow-y: auto; }
.history-item { display: flex; align-items: center; justify-content: space-between; padding: 16px 24px; background: #F8F9FA; border-radius: 8px; }
.history-stats { flex: 1; display: flex; justify-content: center; gap: 32px; flex-wrap: wrap; }
.history-stat { font-size: 14px; color: #666666; }
.history-date { font-size: 14px; font-weight: 700; color: #4CAF50; min-width: 100px; }

.empty-body-info, .empty-chart, .empty-history { text-align: center; padding: 40px 20px; }
.empty-text { font-size: 15px; color: #888888; }

@media (max-width: 968px) {
  .grid-layout { grid-template-columns: 1fr; }
  .chart-card, .history-card { grid-column: span 1; }
  .history-item { flex-direction: column; text-align: center; gap: 8px; }
}
</style>
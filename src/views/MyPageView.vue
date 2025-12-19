<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import api from '@/util/axios'

const router = useRouter()

// 1. 사용자 정보
const userInfo = ref({
  name: '',
  nickname: '',
  email: ''
})

// 2. 팔로워/팔로잉 수
const followStats = ref({
  followers: 0, 
  following: 0  
})

// 3. 신체 정보 이력
const bodySpecs = ref([])

// --- [API 통신 함수들] ---

// 내 정보 불러오기
const fetchUserInfo = async () => {
  try {
    const response = await api.get('/api/users/me')
    const data = response.data
    
    userInfo.value = {
      name: data.name,
      nickname: data.nickname,
      email: data.email
    }
    
    followStats.value = {
      followers: data.followers,
      following: data.following
    }
  } catch (error) {
    console.error('내 정보 로딩 실패:', error)
  }
}

// 신체 정보 목록 불러오기
const fetchBodySpecs = async () => {
  try {
    const response = await api.get('/api/body-specs')
    bodySpecs.value = response.data.sort((a, b) => new Date(a.date) - new Date(b.date))
  } catch (error) {
    console.error('신체 정보 로딩 실패:', error)
  }
}

// 페이지 로드
onMounted(async () => {
  await Promise.all([
    fetchUserInfo(),
    fetchBodySpecs()
  ])
})

// --- [기존 로직] ---

// 모달 상태
const showAddModal = ref(false)
const showDeleteModal = ref(false)
const deleteTargetId = ref(null)

// 토스트
const showToast = ref(false)
const toastMessage = ref('')

// 신체 정보 폼
const newBodySpec = ref({
  height: '',
  weight: '',
  age: '',
  gender: '남성',
  created_at: new Date().toISOString().split('T')[0]
})

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

// BMI 상태
const bmiStatus = computed(() => {
  const bmiValue = parseFloat(bmi.value)
  if (bmiValue < 18.5) return { text: '저체중', color: '#2196F3' }
  if (bmiValue < 23) return { text: '정상', color: '#4CAF50' }
  if (bmiValue < 25) return { text: '과체중', color: '#FFA726' }
  return { text: '비만', color: '#F44336' }
})

// 그래프 데이터
const chartData = computed(() => {
  const sorted = [...bodySpecs.value].sort((a, b) => new Date(a.date) - new Date(b.date))
  return sorted.slice(-10)
})

// 그래프 관련 계산
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
    ticks.push({
      value,
      y: getY(value)
    })
  }
  return ticks.reverse()
})

// 신체 정보 추가
const handleAddBodySpec = async () => {
  if (!newBodySpec.value.height || !newBodySpec.value.weight || !newBodySpec.value.age) {
    displayToast('모든 필드를 입력해주세요')
    return
  }

  try {
    await api.post('/api/body-specs', {
      height: parseInt(newBodySpec.value.height),
      weight: parseInt(newBodySpec.value.weight),
      age: parseInt(newBodySpec.value.age),
      gender: newBodySpec.value.gender,
      created_at: newBodySpec.value.created_at
    })

    await fetchBodySpecs()

    showAddModal.value = false
    newBodySpec.value = {
      height: '',
      weight: '',
      age: '',
      gender: '남성',
      created_at: newBodySpec.value.created_at
    }

    displayToast('신체 정보가 추가되었습니다')
  } catch (error) {
    console.error(error)
    displayToast('저장 중 오류가 발생했습니다.')
  }
}

// 신체 정보 삭제 모달 열기
const deleteBodySpec = (id) => {
  deleteTargetId.value = id
  showDeleteModal.value = true
}

// 신체 정보 삭제 확인
const confirmDelete = async () => {
  if (deleteTargetId.value) {
    try {
      await api.delete(`/api/body-specs/${deleteTargetId.value}`)
      await fetchBodySpecs()
      displayToast('신체 정보가 삭제되었습니다')
    } catch (error) {
      console.error(error)
      displayToast('삭제 중 오류가 발생했습니다.')
    } finally {
      showDeleteModal.value = false
      deleteTargetId.value = null
    }
  }
}

// 토스트
const displayToast = (message) => {
  toastMessage.value = message
  showToast.value = true
  setTimeout(() => {
    showToast.value = false
  }, 3000)
}

// 모달 열기
const openAddModal = () => {
  if (latestBodySpec.value) {
    newBodySpec.value.height = latestBodySpec.value.height.toString()
    newBodySpec.value.age = latestBodySpec.value.age.toString()
    newBodySpec.value.gender = latestBodySpec.value.gender
  }
  showAddModal.value = true
}

// ★ 팔로우 페이지로 이동 (탭 파라미터 포함)
const goToFollowPage = (tab) => {
  router.push(`/follow?tab=${tab}`)
}
</script>

<template>
  <div class="mypage-container">
    <AppHeader active-page="mypage" />

    <main class="main-content">
      <div class="content-wrapper">
        <div class="page-header">
          <h1 class="page-title">마이페이지</h1>
        </div>

        <div class="grid-layout">
          <!-- 사용자 정보 카드 -->
          <div class="card user-info-card">
            <div class="card-header">
              <h2 class="card-title">내 정보</h2>
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

            <!-- 팔로워/팔로잉 섹션 -->
            <div class="follow-wrapper">
              <div class="follow-section">
                <div class="follow-item" @click="goToFollowPage('followers')">
                  <div class="follow-count">{{ followStats.followers }}</div>
                  <div class="follow-label">팔로워</div>
                </div>
                <div class="follow-divider"></div>
                <div class="follow-item" @click="goToFollowPage('following')">
                  <div class="follow-count">{{ followStats.following }}</div>
                  <div class="follow-label">팔로잉</div>
                </div>
              </div>
              
              <button class="view-all-btn" @click="goToFollowPage('followers')">
                팔로우 목록 전체보기 >
              </button>
            </div>
          </div>

          <!-- 최신 신체 정보 카드 -->
          <div class="card body-info-card">
            <div class="card-header">
              <h2 class="card-title">현재 신체 정보</h2>
              <button class="add-btn" @click="openAddModal">+ 기록 추가</button>
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
              <p class="empty-text">신체 정보가 없습니다</p>
              <button class="add-btn-large" @click="openAddModal">+ 신체 정보 추가</button>
            </div>
          </div>

          <!-- 체중 변화 그래프 -->
          <div class="card chart-card">
            <div class="card-header">
              <h2 class="card-title">체중 변화 추이</h2>
            </div>
            <div v-if="chartData.length >= 2" class="chart-container">
              <svg :width="chartWidth" :height="chartHeight" class="chart-svg">
                <g class="grid-lines">
                  <line
                    v-for="tick in yAxisTicks"
                    :key="tick.value"
                    :x1="chartPadding.left"
                    :y1="tick.y"
                    :x2="chartWidth - chartPadding.right"
                    :y2="tick.y"
                    stroke="#E0E0E0"
                    stroke-dasharray="4"
                  />
                </g>

                <g class="y-axis">
                  <line
                    :x1="chartPadding.left"
                    :y1="chartPadding.top"
                    :x2="chartPadding.left"
                    :y2="chartHeight - chartPadding.bottom"
                    stroke="#666"
                    stroke-width="2"
                  />
                  <text
                    v-for="tick in yAxisTicks"
                    :key="tick.value"
                    :x="chartPadding.left - 10"
                    :y="tick.y + 5"
                    text-anchor="end"
                    class="axis-label"
                  >
                    {{ tick.value }}kg
                  </text>
                </g>

                <g class="x-axis">
                  <line
                    :x1="chartPadding.left"
                    :y1="chartHeight - chartPadding.bottom"
                    :x2="chartWidth - chartPadding.right"
                    :y2="chartHeight - chartPadding.bottom"
                    stroke="#666"
                    stroke-width="2"
                  />
                  <text
                    v-for="(d, i) in chartData"
                    :key="i"
                    :x="getX(i)"
                    :y="chartHeight - chartPadding.bottom + 25"
                    text-anchor="middle"
                    class="axis-label"
                  >
                    {{ d.date.substring(5) }}
                  </text>
                </g>

                <path
                  :d="chartPath"
                  fill="none"
                  stroke="#4CAF50"
                  stroke-width="3"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />

                <g class="data-points">
                  <circle
                    v-for="(d, i) in chartData"
                    :key="i"
                    :cx="getX(i)"
                    :cy="getY(d.weight)"
                    r="6"
                    fill="#4CAF50"
                    stroke="#FFFFFF"
                    stroke-width="2"
                  />
                  <text
                    v-for="(d, i) in chartData"
                    :key="'label-' + i"
                    :x="getX(i)"
                    :y="getY(d.weight) - 15"
                    text-anchor="middle"
                    class="data-label"
                  >
                    {{ d.weight }}kg
                  </text>
                </g>
              </svg>
            </div>
            <div v-else class="empty-chart">
              <p class="empty-text">2개 이상의 기록이 필요합니다</p>
            </div>
          </div>

          <!-- 신체 정보 이력 -->
          <div class="card history-card">
            <div class="card-header">
              <h2 class="card-title">신체 정보 이력</h2>
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
                  <span class="history-stat">성별: {{ spec.gender }}</span>
                </div>
                <button class="delete-btn" @click="deleteBodySpec(spec.id)">삭제</button>
              </div>
            </div>
            <div v-else class="empty-history">
              <p class="empty-text">신체 정보 기록이 없습니다</p>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- 신체 정보 추가 모달 -->
    <div v-if="showAddModal" class="modal-overlay" @click="showAddModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2 class="modal-title">신체 정보 추가</h2>
          <button class="modal-close" @click="showAddModal = false">✕</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="handleAddBodySpec" class="body-form">
            <div class="form-group">
              <label class="form-label">측정일</label>
              <input
                v-model="newBodySpec.created_at"
                type="date"
                class="form-input"
                required
              />
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">키 (cm)</label>
                <input
                  v-model="newBodySpec.height"
                  type="number"
                  placeholder="175"
                  class="form-input"
                  required
                />
              </div>

              <div class="form-group">
                <label class="form-label">체중 (kg)</label>
                <input
                  v-model="newBodySpec.weight"
                  type="number"
                  placeholder="70"
                  class="form-input"
                  required
                />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">나이</label>
                <input
                  v-model="newBodySpec.age"
                  type="number"
                  placeholder="25"
                  class="form-input"
                  required
                />
              </div>

              <div class="form-group">
                <label class="form-label">성별</label>
                <select v-model="newBodySpec.gender" class="form-input">
                  <option value="남성">남성</option>
                  <option value="여성">여성</option>
                </select>
              </div>
            </div>

            <div class="form-actions">
              <button type="button" class="cancel-btn" @click="showAddModal = false">취소</button>
              <button type="submit" class="submit-btn">추가</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- 삭제 확인 모달 -->
    <div v-if="showDeleteModal" class="modal-overlay" @click="showDeleteModal = false">
      <div class="modal-content small-modal" @click.stop>
        <div class="modal-header">
          <h2 class="modal-title">신체 정보 삭제</h2>
          <button class="modal-close" @click="showDeleteModal = false">✕</button>
        </div>
        <div class="modal-body">
          <p class="modal-message">이 기록을 삭제하시겠습니까?</p>
        </div>
        <div class="modal-footer">
          <button class="modal-btn cancel-btn-modal" @click="showDeleteModal = false">취소</button>
          <button class="modal-btn delete-btn" @click="confirmDelete">삭제</button>
        </div>
      </div>
    </div>

    <!-- 토스트 메시지 -->
    <div v-if="showToast" class="toast-message">
      <div class="toast-icon">✓</div>
      <span class="toast-text">{{ toastMessage }}</span>
    </div>
  </div>
</template>

<style scoped>
.mypage-container {
  min-height: 100vh;
  background-color: #F5F7FA;
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
  margin-bottom: 32px;
}

.page-title {
  font-size: 32px;
  font-weight: 700;
  color: #333333;
}

/* 그리드 레이아웃 */
.grid-layout {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}

/* 카드 */
.card {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.card-title {
  font-size: 20px;
  font-weight: 700;
  color: #333333;
}

.add-btn {
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

.add-btn:hover {
  background: #45A049;
}

/* 사용자 정보 */
.user-info {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 20px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #F0F0F0;
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  font-size: 15px;
  font-weight: 600;
  color: #666666;
}

.info-value {
  font-size: 15px;
  color: #333333;
}

/* 팔로워/팔로잉 섹션 */
.follow-wrapper {
  background: #F8F9FA;
  border-radius: 8px;
  margin-top: 8px;
  padding: 16px; /* 안쪽 여백 */
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 기존 follow-section (배경색 제거, 패딩 조정) */
.follow-section {
  display: flex;
  align-items: center;
  justify-content: space-around;
  /* background: #F8F9FA;  <- 기존 배경색 삭제 (부모인 wrapper로 이동) */
  /* padding: 20px;       <- 기존 패딩 삭제 */
  border-radius: 8px;
}

/* 기존 아이템 스타일 유지 */
.follow-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 4px 16px; /* 패딩 살짝 줄임 */
  border-radius: 8px;
}

.follow-item:hover {
  background: #E8F5E9; /* 호버 효과 유지 */
  transform: translateY(-2px);
}

.follow-count {
  font-size: 24px; /* 숫자가 너무 크면 살짝 줄여도 됨 */
  font-weight: 700;
  color: #4CAF50;
}

.follow-label {
  font-size: 14px;
  font-weight: 500;
  color: #666666;
}

.follow-divider {
  width: 1px;
  height: 30px; /* 높이 살짝 조정 */
  background: #E0E0E0;
}

.view-all-btn {
  width: 100%;
  padding: 10px 0;
  background-color: #FFFFFF;
  border: 1px solid #E0E0E0;
  border-radius: 6px;
  color: #555555;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.view-all-btn:hover {
  background-color: #4CAF50;
  border-color: #4CAF50;
  color: #FFFFFF;
}

/* 신체 정보 */
.body-info {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.body-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.stat-item {
  text-align: center;
  padding: 16px;
  background: #F8F9FA;
  border-radius: 8px;
}

.stat-label {
  display: block;
  font-size: 13px;
  color: #888888;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #333333;
}

.stat-unit {
  font-size: 16px;
  font-weight: 500;
  color: #888888;
  margin-left: 4px;
}

.bmi-section {
  padding: 16px;
  background: #F8F9FA;
  border-radius: 8px;
}

.bmi-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.bmi-label {
  font-size: 15px;
  font-weight: 600;
  color: #666666;
}

.bmi-value {
  font-size: 32px;
  font-weight: 700;
}

.bmi-status {
  padding: 8px 16px;
  border-radius: 20px;
  color: #FFFFFF;
  font-size: 14px;
  font-weight: 600;
  text-align: center;
}

.latest-date {
  font-size: 13px;
  color: #888888;
  text-align: center;
}

.empty-body-info {
  text-align: center;
  padding: 40px 20px;
}

.empty-text {
  font-size: 15px;
  color: #888888;
  margin-bottom: 16px;
}

.add-btn-large {
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

.add-btn-large:hover {
  background: #45A049;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
}

/* 그래프 */
.chart-card {
  grid-column: span 2;
}

.chart-container {
  overflow-x: auto;
  padding: 20px 0;
}

.chart-svg {
  display: block;
  margin: 0 auto;
}

.axis-label {
  font-size: 12px;
  fill: #666666;
}

.data-label {
  font-size: 13px;
  font-weight: 600;
  fill: #333333;
}

.empty-chart {
  text-align: center;
  padding: 60px 20px;
}

/* 이력 */
.history-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 400px;
  overflow-y: auto;
}

.history-item {
  display: flex;
  align-items: center;
  justify-content: space-between; /* 양끝 정렬로 변경 */
  gap: 16px;
  padding: 16px 24px; /* 좌우 여백을 조금 더 줌 */
  background: #F8F9FA;
  border-radius: 8px;
  transition: background 0.3s ease;
}

.history-item:hover {
  background: #E8F5E9;
}

.history-date {
  font-size: 14px;
  font-weight: 700;
  color: #4CAF50;
  min-width: 100px;
}

.history-stats {
  flex: 1;
  display: flex;
  justify-content: center; /* 정보들을 가운데로 모으거나, space-around로 분산 가능 */
  gap: 32px; /* 정보 사이 간격을 좀 더 넓힘 */
  flex-wrap: wrap;
}

.history-stat {
  font-size: 14px;
  color: #666666;
}

.delete-btn {
  padding: 6px 12px;
  background: transparent;
  border: 1px solid #F44336;
  border-radius: 6px;
  color: #F44336;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.delete-btn:hover {
  background: #F44336;
  color: #FFFFFF;
}

.empty-history {
  text-align: center;
  padding: 40px 20px;
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
  max-width: 500px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.modal-content.small-modal {
  max-width: 400px;
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

.modal-message {
  font-size: 16px;
  color: #333333;
  text-align: center;
  margin: 8px 0;
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

.cancel-btn-modal {
  background: #F5F7FA;
  border: 1px solid #E0E0E0;
  color: #666666;
}

.cancel-btn-modal:hover {
  background: #E8EAF0;
  border-color: #BDBDBD;
  color: #333333;
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

.delete-btn {
  background: #F44336;
  border: none;
  color: #FFFFFF;
}

.delete-btn:hover {
  background: #D32F2F;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(244, 67, 54, 0.3);
}

/* 폼 */
.body-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.form-label {
  font-size: 14px;
  font-weight: 600;
  color: #333333;
}

.form-input {
  padding: 12px 16px;
  border: 1px solid #E0E0E0;
  border-radius: 8px;
  font-size: 15px;
  color: #333333;
  background: #FFFFFF;
  transition: border-color 0.3s ease;
}

.form-input:focus {
  outline: none;
  border-color: #4CAF50;
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 12px;
}

.cancel-btn,
.submit-btn {
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.cancel-btn {
  background: #F5F7FA;
  border: 1px solid #E0E0E0;
  color: #666666;
}

.cancel-btn:hover {
  background: #E8EAF0;
  border-color: #BDBDBD;
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

/* 토스트 */
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

.history-card {
  grid-column: span 2; /* 이 속성을 추가하면 가로로 꽉 차게 됨 */
}

/* 반응형 */
@media (max-width: 968px) {
  .grid-layout {
    grid-template-columns: 1fr;
  }

  .chart-card {
    grid-column: span 2;
  }

  .body-stats {
    grid-template-columns: repeat(3, 1fr);
  }

  .nav-menu {
    display: none;
  }
}
</style>

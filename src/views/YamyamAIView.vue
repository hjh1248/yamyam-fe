<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import AppHeader from '@/components/AppHeader.vue'
import api from '@/util/axios'

// ==========================================
// 1. 상태 변수
// ==========================================
const messages = ref([
  { role: 'assistant', content: '안녕하세요! 저는 영양 전문가 쩝쩝교수입니다. 무엇을 도와드릴까요? 😊' }
])
const userInput = ref('')
const isLoading = ref(false)
const chatContainer = ref(null)

// 사용자 데이터
const myUserInfo = ref(null)
const myBodySpecs = ref([])     // 신체 정보 리스트
const myDietPlans = ref([])     // 식단 계획 리스트
const currentPlanDailyDiets = ref([]) // 선택된 식단 계획의 일일 식단 리스트
const currentDailyDietFoods = ref([]) // 선택된 일일 식단의 음식 목록
const myChallenges = ref([])    // 챌린지 리스트

// 첨부 상태 (선택된 ID 목록)
const attachments = ref({
  body: [],      // 선택된 신체 정보 ID들
  diet: [],      // 선택된 일일 식단(DailyDiet) ID들
  challenge: []  // 선택된 챌린지 ID들
})

// 모달 상태
const modals = ref({
  body: false,
  diet: false,
  challenge: false
})
const selectedPlanId = ref(null) // 식단 모달에서 현재 보고 있는 계획 ID
const selectedDailyDietId = ref(null) // 선택된 일일 식단 ID

const showSidebar = ref(true)

// ==========================================
// 2. 데이터 조회 API
// ==========================================
const fetchBasicData = async () => {
  try {
    // 1. 내 정보
    const userRes = await api.get('/api/users/me')
    myUserInfo.value = userRes.data 

    // 2. 신체 정보 (전체)
    const bodyRes = await api.get('/api/body-specs')
    myBodySpecs.value = bodyRes.data.sort((a, b) => new Date(b.date) - new Date(a.date))

    // 3. 식단 계획 목록 조회 (/api/diet-plans/my/details) - 상세 정보 포함
    const planRes = await api.get('/api/diet-plans/my/details')
    
    console.log(planRes);

    // 배열이 아니라 단일 객체로 올 수도 있으므로 배열로 변환 처리
    if (Array.isArray(planRes.data)) {
      myDietPlans.value = JSON.parse(JSON.stringify(planRes.data))
    } else if (planRes.data) {
      myDietPlans.value = [JSON.parse(JSON.stringify(planRes.data))]
    }

    // 4. 챌린지 목록
    const challengeRes = await api.get('/api/challenges/my')
    myChallenges.value = challengeRes.data
  } catch (e) {
    console.error('데이터 로드 실패', e)
  }
}

// 일일 식단에 음식이 있는지 확인하는 함수
const hasMealFoods = (diet) => {
  const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack']
  return mealTypes.some(type =>
    diet[type] &&
    diet[type].mealFoods &&
    Array.isArray(diet[type].mealFoods) &&
    diet[type].mealFoods.length > 0
  )
}

// 식단 계획 클릭 시 해당 계획의 일일 식단 목록 가져오기
const fetchDailyDietsByPlan = (planId) => {
  selectedPlanId.value = planId
  selectedDailyDietId.value = null // 일일 식단 선택 초기화
  currentPlanDailyDiets.value = [] // 초기화
  currentDailyDietFoods.value = [] // 음식 목록 초기화

  const selectedPlan = myDietPlans.value.find(p => (p.dietPlanId || p.id) === planId)
  if (selectedPlan && selectedPlan.dailyDiets) {
    // 음식이 있는 일일 식단만 필터링
    const dailyDiets = [...selectedPlan.dailyDiets]
      .filter(diet => hasMealFoods(diet))
      .sort((a, b) => new Date(b.date) - new Date(a.date))
    currentPlanDailyDiets.value = dailyDiets
  }
}

// 식단 계획의 전체 선택/해제
const togglePlanSelection = (planId) => {
  const selectedPlan = myDietPlans.value.find(p => (p.dietPlanId || p.id) === planId)
  if (selectedPlan && selectedPlan.dailyDiets) {
    // 음식이 있는 일일 식단만 필터링
    const validDailyDiets = selectedPlan.dailyDiets.filter(diet => hasMealFoods(diet))
    const validDailyDietIds = validDailyDiets.map(d => d.dailyDietId || d.id)

    // 현재 선택된 식단 중 이 계획에 속한 것들이 있는지 확인
    const selectedInThisPlan = attachments.value.diet.filter(id => validDailyDietIds.includes(id))

    // 이미 모두 선택되어 있으면 전체 해제, 아니면 전체 선택
    if (selectedInThisPlan.length === validDailyDietIds.length && validDailyDietIds.length > 0) {
      // 이 계획의 식단들만 해제
      attachments.value.diet = attachments.value.diet.filter(id => !validDailyDietIds.includes(id))
    } else {
      // 이 계획의 식단들을 모두 추가 (중복 방지)
      const newSelection = new Set([...attachments.value.diet, ...validDailyDietIds])
      attachments.value.diet = Array.from(newSelection)
    }
  }
}

// 식단 계획이 전체 선택되어 있는지 확인 (음식이 있는 일일 식단 기준)
const isPlanFullySelected = (planId) => {
  const selectedPlan = myDietPlans.value.find(p => (p.dietPlanId || p.id) === planId)
  if (selectedPlan && selectedPlan.dailyDiets && selectedPlan.dailyDiets.length > 0) {
    // 음식이 있는 일일 식단만 필터링
    const validDailyDiets = selectedPlan.dailyDiets.filter(diet => hasMealFoods(diet))
    if (validDailyDiets.length === 0) return false

    const validDailyDietIds = validDailyDiets.map(d => d.dailyDietId || d.id)
    const selectedInThisPlan = attachments.value.diet.filter(id => validDailyDietIds.includes(id))
    return selectedInThisPlan.length === validDailyDietIds.length
  }
  return false
}

// 일일 식단 클릭 시 해당 식단의 음식 목록 가져오기
const fetchFoodsByDailyDiet = (dailyDietId) => {
  selectedDailyDietId.value = dailyDietId
  currentDailyDietFoods.value = [] // 초기화

  const selectedDiet = currentPlanDailyDiets.value.find(d => (d.dailyDietId || d.id) === dailyDietId)
  if (selectedDiet) {
    const foods = []
    const mealTypes = [
      { key: 'breakfast', label: '아침', icon: '🍳' },
      { key: 'lunch', label: '점심', icon: '🍱' },
      { key: 'dinner', label: '저녁', icon: '🍽️' },
      { key: 'snack', label: '간식', icon: '🍪' }
    ]

    mealTypes.forEach(mealType => {
      if (selectedDiet[mealType.key] && selectedDiet[mealType.key].mealFoods) {
        selectedDiet[mealType.key].mealFoods.forEach(food => {
          foods.push({
            ...food,
            mealType: mealType.label,
            mealIcon: mealType.icon
          })
        })
      }
    })

    currentDailyDietFoods.value = foods
  }
}

// ==========================================
// 3. 선택 로직 (Toggle)
// ==========================================
const toggleSelection = (category, id) => {
  const list = attachments.value[category]
  const idx = list.indexOf(id)
  if (idx > -1) list.splice(idx, 1)
  else list.push(id)
}

const toggleAll = (category, sourceList) => {
  if (!sourceList || sourceList.length === 0) return

  // 소스 리스트에서 ID 추출 (식단은 dailyDietId, 나머지는 id)
  const allIds = sourceList.map(item => category === 'diet' ? (item.dailyDietId || item.id) : item.id)
  
  // 현재 선택된 것들 중 이 리스트에 포함된 개수 확인
  const currentSelectedInList = attachments.value[category].filter(id => allIds.includes(id))
  
  if (currentSelectedInList.length === allIds.length) {
    // 전체 해제: 현재 리스트에 있는 ID들만 제거
    attachments.value[category] = attachments.value[category].filter(id => !allIds.includes(id))
  } else {
    // 전체 선택: 현재 리스트 ID들을 합침 (중복 제거)
    const newSelection = new Set([...attachments.value[category], ...allIds])
    attachments.value[category] = Array.from(newSelection)
  }
}

// ==========================================
// 4. 컨텍스트 생성 (선택된 정보만 텍스트로)
// ==========================================
const contextString = computed(() => {
  let context = []

  // 신체 정보
  if (attachments.value.body.length > 0) {
    let bodyStr = '[선택한 신체 기록]\n'
    attachments.value.body.forEach(id => {
      const spec = myBodySpecs.value.find(s => s.id === id)
      if (spec) bodyStr += `- 날짜: ${spec.date}, 키: ${spec.height}cm, 체중: ${spec.weight}kg\n`
    })
    context.push(bodyStr)
  }

  // 식단 정보 (화면에 안보여도 선택된 ID가 있으면 포함해야 함 - 여기서는 fetch된 것만 매칭 가능)
  // *주의: 모달을 닫아도 선택 상태는 유지되지만, currentPlanDailyDiets는 바뀔 수 있음.
  // 실제로는 선택된 모든 식단 정보를 어딘가에 저장해두거나, 백엔드에서 ID만 보내서 처리하는 게 좋음.
  // 여기서는 '현재 로드된' 식단 중에서 매칭되는 것만 텍스트로 변환 (간소화)
  if (attachments.value.diet.length > 0) {
    let dietStr = `[선택한 식단 기록 (${attachments.value.diet.length}개)]\n(상세 내용은 ID로 전송됨)`
    // 실제 텍스트 변환은 복잡하므로 요약 정보만 프롬프트에 넣고, 상세는 백엔드가 ID로 조회한다고 가정하거나
    // 필요한 경우 여기서 currentPlanDailyDiets에 없어도 ID는 보냄.
    
    // 화면에 떠있는 리스트 중에서 텍스트 생성
    const visibleDiets = currentPlanDailyDiets.value.filter(d => attachments.value.diet.includes(d.dailyDietId || d.id))
    if (visibleDiets.length > 0) {
      visibleDiets.forEach(d => {
         dietStr += `\n- 날짜: ${d.date}, 총 칼로리: ${calculateTotalCal(d)}kcal`
      })
    }
    context.push(dietStr)
  }

  // 챌린지 정보
  if (attachments.value.challenge.length > 0) {
    let chStr = '[선택한 챌린지]\n'
    attachments.value.challenge.forEach(id => {
      const target = myChallenges.value.find(c => c.id === id)
      if (target) chStr += `- ${target.title} (달성률: ${target.progress}%)\n`
    })
    context.push(chStr)
  }

  return context.join('\n\n')
})

const calculateTotalCal = (diet) => {
  try {
    if (!diet) return 0
    let total = 0
    const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack']

    for (const type of mealTypes) {
      if (diet[type] && diet[type].mealFoods && Array.isArray(diet[type].mealFoods)) {
        const mealTotal = diet[type].mealFoods.reduce((sum, f) => {
          const energy = f.energyPer100 || 0
          const quantity = f.quantity || 0
          return sum + (quantity / 100 * energy)
        }, 0)
        total += mealTotal
      }
    }
    return Math.round(total)
  } catch (error) {
    console.error('calculateTotalCal 오류:', error, diet)
    return 0
  }
}

// 추천 질문
const recommendedQuestions = computed(() => {
  const list = []
  const hasBody = attachments.value.body.length > 0
  const hasDiet = attachments.value.diet.length > 0
  const hasChallenge = attachments.value.challenge.length > 0

  if (!hasBody && !hasDiet && !hasChallenge) return ['다이어트 꿀팁 알려줘', '식욕 참는 법 알려줘']
  if (hasBody) list.push('내 신체 스펙 분석해줘')
  if (hasDiet) list.push('선택한 식단의 영양 밸런스 평가해줘')
  if (hasDiet && hasBody) list.push('내 변화에 따른 식단 조언해줘')
  if (hasChallenge) list.push('이 챌린지 성공 꿀팁 알려줘')
  return list.slice(0, 4)
})

// ==========================================
// 5. 채팅 전송
// ==========================================
const sendMessage = async (text = null) => {
  const content = text || userInput.value
  if (!content.trim() || isLoading.value) return

  // 1. 화면에는 내가 쓴 질문만 보여줌
  messages.value.push({ role: 'user', content: content })
  userInput.value = ''
  scrollToBottom()
  isLoading.value = true
  
  try {
    // 2. 백엔드 DTO(ChatRequest)에 맞게 데이터 구성
    const payload = {
      content: content,  // 질문 내용
      bodySpecIds: attachments.value.body,      // 신체 정보 ID 리스트
      dailyDietIds: attachments.value.diet,     // 식단 ID 리스트
      challengeIds: attachments.value.challenge // 챌린지 ID 리스트
    }

    // 3. API 호출 (URL 수정: /api/ai/chat -> /api/chat)
    // userId는 보통 헤더(토큰)로 처리하므로 body에서 제외 (백엔드의 @LoginUser가 처리)
    const res = await api.post('/api/chat', payload)
    
    // 4. 응답 처리
    messages.value.push({ role: 'assistant', content: res.data })

  } catch (e) {
    messages.value.push({ role: 'assistant', content: '오류가 발생했습니다. 다시 시도해주세요.' })
    console.error(e)
  } finally {
    isLoading.value = false
    scrollToBottom()
  }
}

const scrollToBottom = () => {
  nextTick(() => {
    if (chatContainer.value) chatContainer.value.scrollTop = chatContainer.value.scrollHeight
  })
}

const scrollContainer = ref(null)
const isDragging = ref(false)
const startX = ref(0)
const scrollLeft = ref(0)

const resetAllAttachments = () => {
  attachments.value = { body: [], diet: [], challenge: [] }
}

const isCurrentListAllSelected = (category, sourceList) => {
  if (!sourceList || sourceList.length === 0) return false
  const allIds = sourceList.map(item => category === 'diet' ? (item.dailyDietId || item.id) : item.id)
  const selected = attachments.value[category].filter(id => allIds.includes(id))
  return selected.length === allIds.length && allIds.length > 0
}

const startDrag = (e) => {
  isDragging.value = true
  startX.value = e.pageX - scrollContainer.value.offsetLeft
  scrollLeft.value = scrollContainer.value.scrollLeft
}

const stopDrag = () => {
  isDragging.value = false
}

const onDrag = (e) => {
  if (!isDragging.value) return
  e.preventDefault() // 텍스트 선택 방지
  const x = e.pageX - scrollContainer.value.offsetLeft
  const walk = (x - startX.value) * 1.5 // 스크롤 속도 조절 (1.5배 빠르게)
  scrollContainer.value.scrollLeft = scrollLeft.value - walk
}

const hasAnySelection = computed(() => {
  return attachments.value.body.length > 0 || 
         attachments.value.diet.length > 0 || 
         attachments.value.challenge.length > 0
})

onMounted(() => {
  fetchBasicData()
})
</script>

<template>
  <div class="ai-container yamyam-ai-view">
    <AppHeader active-page="ai" />

    <div class="ai-layout">
      <main class="chat-section">
        <div class="chat-header">
          <h2>🎓 쩝쩝교수 AI</h2>
          
          <div class="header-actions">
            <transition name="fade">
              <button v-if="hasAnySelection" class="reset-header-btn" @click="resetAllAttachments">
                <span class="reset-icon">⟳</span> 선택 초기화
              </button>
            </transition>

            <button class="sidebar-toggle" @click="showSidebar = !showSidebar">
              {{ showSidebar ? '데이터 숨기기' : '데이터 첨부하기' }}
            </button>
          </div>
        </div>

        <div class="chat-window" ref="chatContainer">
          <div v-for="(msg, idx) in messages" :key="idx" class="message-row" :class="msg.role">
            <div class="avatar" v-if="msg.role === 'assistant'">🎓</div>
            <div class="bubble">
              <span style="white-space: pre-wrap;">{{ msg.content }}</span>
            </div>
          </div>
          <div v-if="isLoading" class="message-row assistant">
            <div class="avatar">🎓</div>
            <div class="bubble loading"><span>.</span><span>.</span><span>.</span></div>
          </div>
        </div>

        <div class="suggestion-area">
          <div class="suggestion-scroll" 
              ref="scrollContainer"
              @mousedown="startDrag" 
              @mouseleave="stopDrag" 
              @mouseup="stopDrag" 
              @mousemove="onDrag">
              
            <button v-for="(q, i) in recommendedQuestions" :key="i" class="suggestion-chip" @click="sendMessage(q)">
              ✨ {{ q }}
            </button>
          </div>
        </div>

        <div class="input-area">
          <div class="attachment-preview" v-if="contextString">
            <span class="preview-badge" v-if="attachments.body.length">신체 {{ attachments.body.length }}건</span>
            <span class="preview-badge" v-if="attachments.diet.length">식단 {{ attachments.diet.length }}건</span>
            <span class="preview-badge" v-if="attachments.challenge.length">챌린지 {{ attachments.challenge.length }}건</span>
            <span class="preview-info">첨부됨</span>
          </div>
          <div class="input-wrapper">
            <textarea v-model="userInput" @keydown.enter.prevent="sendMessage()" placeholder="교수님께 궁금한 점을 물어보세요..."></textarea>
            <button @click="sendMessage()" :disabled="!userInput.trim() || isLoading" class="send-btn">➤</button>
          </div>
        </div>
      </main>

      <transition name="slide-right">
        <aside v-if="showSidebar" class="data-sidebar">
          <div class="sidebar-header">
            <h3>데이터 첨부</h3>
            <p class="sidebar-desc">카드를 클릭하여 세부 항목을 선택하세요.</p>
          </div>

          <div class="sidebar-content">
            
            <div class="data-card" @click="modals.body = true" :class="{ 'has-selection': attachments.body.length > 0 }">
              <div class="card-icon">💪</div>
              <div class="card-info">
                <h4>신체 정보</h4>
                <p v-if="attachments.body.length === 0">선택된 기록 없음</p>
                <p v-else class="selected-text">{{ attachments.body.length }}개 기록 선택됨</p>
              </div>
              <div class="card-arrow">></div>
            </div>

            <div class="data-card" @click="modals.diet = true" :class="{ 'has-selection': attachments.diet.length > 0 }">
              <div class="card-icon">🥗</div>
              <div class="card-info">
                <h4>식단 정보</h4>
                <p v-if="attachments.diet.length === 0">선택된 기록 없음</p>
                <p v-else class="selected-text">{{ attachments.diet.length }}개 식단 선택됨</p>
              </div>
              <div class="card-arrow">></div>
            </div>

            <div class="data-card" @click="modals.challenge = true" :class="{ 'has-selection': attachments.challenge.length > 0 }">
              <div class="card-icon">🏆</div>
              <div class="card-info">
                <h4>챌린지 정보</h4>
                <p v-if="attachments.challenge.length === 0">선택된 챌린지 없음</p>
                <p v-else class="selected-text">{{ attachments.challenge.length }}개 챌린지 선택됨</p>
              </div>
              <div class="card-arrow">></div>
            </div>

          </div>
        </aside>
      </transition>
    </div>

    <div v-if="modals.body" class="modal-overlay" @click="modals.body = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>신체 정보 선택</h3>
          <button class="close-btn" @click="modals.body = false">✕</button>
        </div>
        <div class="modal-body">
          <div class="list-actions">
            <button @click="toggleAll('body', myBodySpecs)">전체 선택/해제</button>
          </div>
          <div class="select-list">
            <div v-for="spec in myBodySpecs" :key="spec.id" 
                 class="select-item" 
                 :class="{ active: attachments.body.includes(spec.id) }"
                 @click="toggleSelection('body', spec.id)">
              <span>{{ spec.date }} ({{ spec.height }}cm, {{ spec.weight }}kg)</span>
              <div class="checkbox" :class="{ checked: attachments.body.includes(spec.id) }"></div>
            </div>
            <div v-if="myBodySpecs.length === 0" class="empty-msg">기록이 없습니다.</div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="confirm-btn" @click="modals.body = false">선택 완료</button>
        </div>
      </div>
    </div>

    <div v-if="modals.diet" class="modal-overlay" @click="modals.diet = false">
      <div class="modal-content xlarge" @click.stop>
        <div class="modal-header">
          <h3>식단 정보 선택</h3>
          <button class="close-btn" @click="modals.diet = false">✕</button>
        </div>
        <div class="modal-body diet-layout-3col">
          <div class="plan-list">
            <h4>📁 식단 계획 목록</h4>
            <div class="scroll-box">
              <div v-for="plan in myDietPlans" :key="plan.dietPlanId || plan.id"
                   class="plan-item"
                   :class="{ selected: selectedPlanId === (plan.dietPlanId || plan.id) }"
                   @click="fetchDailyDietsByPlan(plan.dietPlanId || plan.id)">
                <div class="plan-info">
                  <span class="plan-name">{{ plan.title || '제목 없음' }}</span>
                  <span class="plan-date">{{ plan.startDate }} ~ {{ plan.endDate }}</span>
                </div>
                <div class="checkbox" :class="{ checked: isPlanFullySelected(plan.dietPlanId || plan.id) }"
                     @click.stop="togglePlanSelection(plan.dietPlanId || plan.id)"></div>
              </div>
              <div v-if="myDietPlans.length === 0" class="empty-msg">식단 계획이 없습니다.</div>
            </div>
          </div>
          <div class="daily-list">
            <h4>📅 일일 식단 목록</h4>
            <div class="list-actions" v-if="currentPlanDailyDiets.length > 0">
              <button @click="toggleAll('diet', currentPlanDailyDiets)">
                {{ isCurrentListAllSelected('diet', currentPlanDailyDiets) ? '전체 해제' : '전체 선택' }}
              </button>
            </div>
            <div class="scroll-box">
              <div v-if="!selectedPlanId" class="empty-msg center">좌측에서 식단 계획을 선택해주세요.</div>
              <div v-else-if="currentPlanDailyDiets.length === 0" class="empty-msg center">해당 계획에 등록된 식단이 없습니다.</div>
              <div v-else v-for="diet in currentPlanDailyDiets" :key="diet.dailyDietId || diet.id"
                   class="daily-item"
                   :class="{ selected: selectedDailyDietId === (diet.dailyDietId || diet.id), active: attachments.diet.includes(diet.dailyDietId || diet.id) }"
                   @click="fetchFoodsByDailyDiet(diet.dailyDietId || diet.id)">
                <div class="daily-info">
                  <div class="daily-header">
                    <span class="diet-date">{{ diet.date }}</span>
                    <span class="diet-day">{{ diet.dayOfWeek }}</span>
                  </div>
                  <span class="diet-cal">총 {{ calculateTotalCal(diet) }}kcal</span>
                </div>
                <div class="checkbox" :class="{ checked: attachments.diet.includes(diet.dailyDietId || diet.id) }"
                     @click.stop="toggleSelection('diet', diet.dailyDietId || diet.id)"></div>
              </div>
            </div>
          </div>
          <div class="food-list">
            <h4>🍽️ 음식 목록</h4>
            <div class="scroll-box">
              <div v-if="!selectedDailyDietId" class="empty-msg center">좌측에서 일일 식단을 선택해주세요.</div>
              <div v-else-if="currentDailyDietFoods.length === 0" class="empty-msg center">등록된 음식이 없습니다.</div>
              <div v-else v-for="(food, idx) in currentDailyDietFoods" :key="idx" class="food-item">
                <div class="food-header">
                  <span class="meal-badge">{{ food.mealIcon }} {{ food.mealType }}</span>
                  <span class="food-name">{{ food.foodName }}</span>
                </div>
                <div class="food-details">
                  <span class="food-quantity">{{ food.quantity }}{{ food.unit }}</span>
                  <span class="food-energy">{{ Math.round(food.quantity / 100 * food.energyPer100) }}kcal</span>
                </div>
                <div class="food-nutrients">
                  <span v-if="food.proteinPer100">단백질 {{ Math.round(food.quantity / 100 * food.proteinPer100) }}g</span>
                  <span v-if="food.carbohydratePer100">탄수화물 {{ Math.round(food.quantity / 100 * food.carbohydratePer100) }}g</span>
                  <span v-if="food.fatPer100">지방 {{ Math.round(food.quantity / 100 * food.fatPer100) }}g</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <span class="selection-count">총 {{ attachments.diet.length }}개 식단 선택됨</span>
          <button class="confirm-btn" @click="modals.diet = false">선택 완료</button>
        </div>
      </div>
    </div>

    <div v-if="modals.challenge" class="modal-overlay" @click="modals.challenge = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>챌린지 선택</h3>
          <button class="close-btn" @click="modals.challenge = false">✕</button>
        </div>
        <div class="modal-body">
          <div class="list-actions">
            <button @click="toggleAll('challenge', myChallenges)">전체 선택/해제</button>
          </div>
          <div class="select-list">
            <div v-for="c in myChallenges" :key="c.id" 
                 class="select-item"
                 :class="{ active: attachments.challenge.includes(c.id) }"
                 @click="toggleSelection('challenge', c.id)">
              <div class="challenge-info">
                <span class="ch-name">{{ c.title }}</span>
                <span class="ch-status">{{ c.challengeStatus }} ({{ c.progress }}%)</span>
              </div>
              <div class="checkbox" :class="{ checked: attachments.challenge.includes(c.id) }"></div>
            </div>
            <div v-if="myChallenges.length === 0" class="empty-msg">참여 중인 챌린지가 없습니다.</div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="confirm-btn" @click="modals.challenge = false">선택 완료</button>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
/* 기본 레이아웃 (이전과 동일) */
.ai-container { height: 100vh; display: flex; flex-direction: column; background: #F5F7FA; overflow: hidden; }
.ai-layout { display: flex; flex: 1; overflow: hidden; position: relative; }
.chat-section { flex: 1; display: flex; flex-direction: column; position: relative; }
.chat-header { padding: 16px 24px; background: white; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; }
.chat-header h2 { font-size: 18px; font-weight: 700; margin: 0; color: #333; }
.sidebar-toggle { padding: 6px 12px; border: 1px solid #ddd; background: white; border-radius: 20px; cursor: pointer; font-size: 13px; color: #333; white-space: nowrap; }

/* Header right actions (namespaced within this component via scoped styles) */
.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* Reset header button style (visual emphasis, non-conflicting) */
.reset-header-btn {
  background: #FFF0F0;
  color: #D32F2F;
  border: 1px solid #FFCDD2;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.2s;
}
.reset-header-btn:hover { background: #FFCDD2; }
.reset-icon { font-size: 14px; font-weight: bold; }

/* Fade transition for header button appearance */
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.chat-window { flex: 1; padding: 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 16px; background: #f0f2f5; }
.message-row { display: flex; gap: 10px; max-width: 80%; }
.message-row.user { align-self: flex-end; flex-direction: row-reverse; }
.message-row.assistant { align-self: flex-start; }
.avatar { width: 36px; height: 36px; background: #E8F5E9; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 20px; }
.bubble { padding: 12px 16px; border-radius: 16px; font-size: 15px; line-height: 1.5; box-shadow: 0 1px 2px rgba(0,0,0,0.1); }
.assistant .bubble { background: white; border-top-left-radius: 4px; color: #333; }
.user .bubble { background: #4CAF50; color: white; border-top-right-radius: 4px; }
.bubble.loading span { animation: blink 1.4s infinite both; font-size: 20px; line-height: 10px; }
.bubble.loading span:nth-child(2) { animation-delay: 0.2s; }
.bubble.loading span:nth-child(3) { animation-delay: 0.4s; }
@keyframes blink { 0% { opacity: 0.2; } 20% { opacity: 1; } 100% { opacity: 0.2; } }
.suggestion-area { padding: 10px 20px 0; background: white; border-top: 1px solid #f0f0f0; }
.suggestion-scroll { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 10px; }
.suggestion-scroll::-webkit-scrollbar { height: 4px; }
.suggestion-chip { flex-shrink: 0; padding: 8px 14px; background: #fff; border: 1px solid #4CAF50; color: #4CAF50; border-radius: 20px; font-size: 13px; cursor: pointer; transition: all 0.2s; }
.suggestion-chip:hover { background: #E8F5E9; }
.input-area { padding: 10px 20px 20px; background: white; }
.attachment-preview { display: flex; gap: 6px; margin-bottom: 8px; font-size: 11px; align-items: center; }
.preview-badge { background: #E3F2FD; color: #1976D2; padding: 2px 8px; border-radius: 4px; font-weight: 600; }
.preview-info { color: #888; }
.input-wrapper { display: flex; gap: 10px; position: relative; }
textarea { flex: 1; height: 50px; padding: 12px; border: 1px solid #ddd; border-radius: 12px; resize: none; font-size: 15px; outline: none; transition: border 0.2s; }
textarea:focus { border-color: #4CAF50; }
.send-btn { width: 50px; background: #4CAF50; color: white; border: none; border-radius: 12px; cursor: pointer; font-size: 18px; transition: background 0.2s; }
.send-btn:disabled { background: #ccc; cursor: not-allowed; }

/* ========================================= */
/* 사이드바 (카드형 디자인) */
/* ========================================= */
.data-sidebar { width: 340px; background: white; border-left: 1px solid #eee; display: flex; flex-direction: column; z-index: 10; box-shadow: -2px 0 10px rgba(0,0,0,0.05); transition: transform 0.3s ease-in-out; }
.slide-right-enter-active, .slide-right-leave-active { transition: transform 0.3s ease-in-out; }
.slide-right-enter-from { transform: translateX(100%); }
.slide-right-leave-to { transform: translateX(100%); }
.sidebar-header { padding: 20px; border-bottom: 1px solid #eee; }
.sidebar-header h3 { margin: 0 0 4px; font-size: 18px; }
.sidebar-desc { margin: 0; color: #888; font-size: 13px; }
.sidebar-content { padding: 20px; overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 16px; }

.data-card { 
  display: flex; align-items: center; gap: 12px; padding: 16px; 
  background: white; border: 1px solid #eee; border-radius: 12px; 
  cursor: pointer; transition: all 0.2s; 
}
.data-card:hover { border-color: #4CAF50; background: #f9f9f9; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
.data-card.has-selection { border-color: #4CAF50; background: #E8F5E9; }

.card-icon { font-size: 24px; width: 40px; height: 40px; background: #fff; border-radius: 50%; display: flex; justify-content: center; align-items: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
.card-info { flex: 1; }
.card-info h4 { margin: 0 0 4px; font-size: 15px; color: #333; }
.card-info p { margin: 0; font-size: 12px; color: #999; }
.card-info .selected-text { color: #4CAF50; font-weight: 600; }
.card-arrow { color: #ccc; font-weight: bold; }

/* ========================================= */
/* 모달 스타일 */
/* ========================================= */
.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1000; }
.modal-content { background: white; width: 400px; max-height: 80vh; border-radius: 16px; display: flex; flex-direction: column; box-shadow: 0 10px 30px rgba(0,0,0,0.2); }
.modal-content.large { width: 700px; height: 70vh; }
.modal-content.xlarge { width: 90vw; max-width: 1200px; height: 80vh; }

.modal-header { padding: 16px 20px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; }
.modal-header h3 { margin: 0; font-size: 18px; }
.close-btn { background: none; border: none; font-size: 20px; cursor: pointer; color: #666; }

.modal-body { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; }
.diet-layout { flex-direction: row; gap: 20px; padding: 0; }
.diet-layout .plan-list { width: 40%; border-right: 1px solid #eee; display: flex; flex-direction: column; background: #f9f9f9; }
.diet-layout .daily-list { width: 60%; display: flex; flex-direction: column; }

.diet-layout-3col { flex-direction: row; gap: 0; padding: 0; }
.diet-layout-3col .plan-list { width: 30%; border-right: 1px solid #eee; display: flex; flex-direction: column; background: #f9f9f9; }
.diet-layout-3col .daily-list { width: 35%; border-right: 1px solid #eee; display: flex; flex-direction: column; background: #fafafa; }
.diet-layout-3col .food-list { width: 35%; display: flex; flex-direction: column; background: white; }

.diet-layout h4 { padding: 15px; margin: 0; background: #f0f0f0; border-bottom: 1px solid #eee; font-size: 14px; color: #666; }
.diet-layout-3col h4 { padding: 15px; margin: 0; background: #f0f0f0; border-bottom: 1px solid #eee; font-size: 14px; color: #666; }
.scroll-box { overflow-y: auto; flex: 1; }

.list-actions { padding-bottom: 10px; text-align: right; }
.list-actions button { background: none; border: none; color: #4CAF50; font-size: 13px; font-weight: 600; cursor: pointer; }

/* 리스트 아이템 스타일 */
.select-list { display: flex; flex-direction: column; gap: 8px; }
.select-item { display: flex; justify-content: space-between; align-items: center; padding: 12px; border: 1px solid #eee; border-radius: 8px; cursor: pointer; transition: background 0.2s; }
.select-item:hover { background: #f5f5f5; }
.select-item.active { border-color: #4CAF50; background: #E8F5E9; }

/* Plan Item */
.plan-item { padding: 15px; border-bottom: 1px solid #eee; cursor: pointer; transition: background 0.2s; display: flex; justify-content: space-between; align-items: center; }
.plan-item:hover { background: #e0e0e0; }
.plan-item.selected { background: #fff; border-left: 4px solid #4CAF50; }
.plan-info { display: flex; flex-direction: column; flex: 1; }
.plan-name { font-weight: 600; font-size: 14px; margin-bottom: 4px; }
.plan-date { font-size: 12px; color: #888; }

/* Diet Daily Item */
.daily-list .select-item { margin: 10px; }
.daily-item { padding: 15px; border-bottom: 1px solid #eee; cursor: pointer; transition: background 0.2s; display: flex; justify-content: space-between; align-items: center; }
.daily-item:hover { background: #e8e8e8; }
.daily-item.selected { background: #fff; border-left: 4px solid #4CAF50; }
.daily-item.active { background: #E8F5E9; }
.daily-info { display: flex; flex-direction: column; gap: 6px; flex: 1; }
.daily-header { display: flex; align-items: center; gap: 8px; }
.diet-date { font-weight: 600; font-size: 14px; color: #333; }
.diet-day { font-size: 12px; color: #888; background: #f5f5f5; padding: 2px 8px; border-radius: 10px; }
.diet-cal { font-size: 12px; color: #4CAF50; font-weight: 600; }

.challenge-info { display: flex; flex-direction: column; }
.ch-name { font-weight: 600; font-size: 14px; }
.ch-status { font-size: 12px; color: #888; }

.checkbox { width: 20px; height: 20px; border: 2px solid #ddd; border-radius: 50%; position: relative; }
.checkbox.checked { background: #4CAF50; border-color: #4CAF50; }
.checkbox.checked::after { content: '✔'; color: white; font-size: 12px; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); }

/* Food Item */
.food-item { padding: 12px; margin: 10px; background: #f9f9f9; border-radius: 8px; border: 1px solid #eee; }
.food-header { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
.meal-badge { font-size: 11px; background: #fff; padding: 3px 8px; border-radius: 12px; border: 1px solid #ddd; white-space: nowrap; }
.food-name { font-weight: 600; font-size: 14px; color: #333; }
.food-details { display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 13px; }
.food-quantity { color: #666; }
.food-energy { color: #4CAF50; font-weight: 600; }
.food-nutrients { display: flex; gap: 8px; flex-wrap: wrap; font-size: 11px; color: #888; }
.food-nutrients span { background: #fff; padding: 2px 6px; border-radius: 4px; }

.empty-msg { padding: 20px; text-align: center; color: #aaa; font-size: 13px; }
.empty-msg.center { display: flex; align-items: center; justify-content: center; height: 100%; }

.modal-footer { padding: 16px 20px; border-top: 1px solid #eee; display: flex; justify-content: flex-end; align-items: center; gap: 15px; }
.selection-count { font-size: 13px; color: #4CAF50; font-weight: 600; }
.confirm-btn { background: #4CAF50; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 600; cursor: pointer; }
.confirm-btn:hover { background: #45a049; }

.suggestion-scroll { 
  display: flex; 
  gap: 8px; 
  overflow-x: auto; 
  padding-bottom: 10px;
  cursor: grab; /* 손바닥 모양 커서 */
  
  /* 스크롤바 숨기기 (크롬, 사파리, 오페라) */
  -webkit-overflow-scrolling: touch;
}
.suggestion-scroll::-webkit-scrollbar { 
  display: none; /* 스크롤바 숨김 */
}
.suggestion-scroll {
  /* 스크롤바 숨기기 (파이어폭스, IE) */
  scrollbar-width: none; 
  -ms-overflow-style: none;
}
.suggestion-scroll:active {
  cursor: grabbing; /* 잡았을 때 쥐는 모양 */
}

/* [NEW] 첨부 파일 미리보기 영역 레이아웃 */
.attachment-preview { 
  display: flex; 
  justify-content: space-between; /* 양끝 정렬 */
  align-items: center;
  margin-bottom: 8px; 
}
.badges { display: flex; gap: 6px; }

/* [NEW] 전체 초기화 버튼 스타일 */
.reset-all-btn {
  background: none;
  border: none;
  font-size: 11px;
  color: #888;
  cursor: pointer;
  text-decoration: underline;
  padding: 2px 5px;
}
.reset-all-btn:hover { color: #f44336; }

/* 기존 스타일 유지하되 list-actions 위치 잡기 */
.daily-list .list-actions {
  padding: 8px 15px;
  border-bottom: 1px solid #f0f0f0;
  background: #fff;
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 768px) {
  .data-sidebar { position: absolute; right: 0; top: 0; bottom: 0; width: 100%; }
  .modal-content.large { width: 95%; height: 80vh; }
  .diet-layout { flex-direction: column; }
  .diet-layout .plan-list, .diet-layout .daily-list { width: 100%; height: 50%; border-right: none; border-bottom: 1px solid #eee; }
}
</style>
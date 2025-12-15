<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import { dailyDietApi } from '@/api'
import { formatDate } from '@/utils'

const router = useRouter()
const route = useRoute()

// State
const dietPlanId = ref(null)
const dailyDietId = ref(null) // New ref for existing daily diet ID
const date = ref(null)
const description = ref('')
const isSaving = ref(false)
const errorMessage = ref('')
const isEditMode = ref(false) // New state to track if we are editing

onMounted(async () => { // Make onMounted async
  dietPlanId.value = route.query.planId
  date.value = route.query.date
  dailyDietId.value = route.query.dailyDietId // Get dailyDietId from query

  if (!dietPlanId.value || !date.value) {
    // 필수 파라미터가 없으면 메인으로 리디렉션
    router.push('/main')
    return
  }

  if (dailyDietId.value) {
    isEditMode.value = true
    // Fetch existing daily diet description if in edit mode
    try {
      const response = await dailyDietApi.getByDate(dietPlanId.value, date.value)
      if (response.data) {
        description.value = response.data.description || ''
      }
    } catch (error) {
      console.error('기존 일일 식단 정보 로드 실패:', error)
      errorMessage.value = '기존 식단 정보를 불러오는 데 실패했습니다.'
    }
  }
})

const saveDailyDiet = async () => {
  if (isSaving.value) return

  isSaving.value = true
  errorMessage.value = ''

  try {
    if (isEditMode.value) {
      // Update existing daily diet
      await dailyDietApi.update(dietPlanId.value, dailyDietId.value, {
        newDescription: description.value.trim(),
        newDate: date.value // Date might also be updated via this view in future
      })
    } else {
      // Create new daily diet
      await dailyDietApi.create(dietPlanId.value, {
        date: date.value,
        description: description.value.trim()
      })
    }
    
    // 성공 시 메인 대시보드로 이동
    router.push('/main')

  } catch (error) {
    console.error('일일 식단 저장 실패:', error)
    errorMessage.value = error.response?.data?.message || '일일 식단 저장에 실패했습니다.'
  } finally {
    isSaving.value = false
  }
}

const handleCancel = () => {
  router.back()
}
</script>

<template>
  <div class="create-daily-diet-container">
    <AppHeader active-page="main" />

    <main class="main-content">
      <div class="content-wrapper">
        <div class="page-header">
          <h1 class="page-title">{{ isEditMode ? '오늘의 식단 수정' : '오늘의 식단 생성' }}</h1>
          <p class="page-subtitle">{{ date }}</p>
        </div>

        <form class="form-card" @submit.prevent="saveDailyDiet">
          <div class="form-section">
            <label for="description" class="form-label">메모 (선택 사항)</label>
            <textarea
              id="description"
              v-model="description"
              class="form-textarea"
              rows="5"
              placeholder="오늘 식단에 대한 다짐이나 특이사항을 기록해보세요."
            ></textarea>
          </div>

          <div v-if="errorMessage" class="network-error">
            {{ errorMessage }}
          </div>

          <div class="form-actions">
            <button type="button" class="cancel-btn" @click="handleCancel" :disabled="isSaving">
              취소
            </button>
            <button type="submit" class="submit-btn" :disabled="isSaving">
              {{ isSaving ? '저장 중...' : (isEditMode ? '수정하기' : '저장하기') }}
            </button>
          </div>
        </form>
      </div>
    </main>
  </div>
</template>

<style scoped>
.create-daily-diet-container {
  min-height: 100vh;
  background-color: #F5F7FA;
}

.main-content {
  padding: 40px;
}

.content-wrapper {
  max-width: 800px;
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

.page-subtitle {
  font-size: 16px;
  color: #666;
  margin-top: 8px;
}

.form-card {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 40px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.form-section {
  margin-bottom: 32px;
}

.form-label {
  display: block;
  font-size: 18px;
  font-weight: 600;
  color: #333333;
  margin-bottom: 12px;
}

.form-textarea {
  width: 100%;
  padding: 16px;
  border: 1px solid #E0E0E0;
  border-radius: 8px;
  font-size: 16px;
  color: #333333;
  background: #FFFFFF;
  transition: border-color 0.3s ease;
  resize: vertical;
}

.form-textarea:focus {
  outline: none;
  border-color: #4CAF50;
}

.network-error {
  background: #FFEBEE;
  color: #D32F2F;
  padding: 12px 16px;
  border-radius: 8px;
  margin-top: 24px;
  font-size: 14px;
  font-weight: 600;
  text-align: center;
  border: 1px solid #FFCDD2;
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 40px;
}

.cancel-btn,
.submit-btn {
  padding: 14px 32px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.cancel-btn {
  background: transparent;
  border: 1px solid #E0E0E0;
  color: #666666;
}

.cancel-btn:hover:not(:disabled) {
  border-color: #333333;
  color: #333333;
}

.submit-btn {
  background: #4CAF50;
  border: none;
  color: #FFFFFF;
}

.submit-btn:hover:not(:disabled) {
  background: #45A049;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
}

.submit-btn:disabled {
  background: #CCCCCC;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}
</style>

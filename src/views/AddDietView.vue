<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import { dietPlanApi } from '@/api'
import { formatDate } from '@/utils'
import { VueDatePicker } from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'

const router = useRouter()

// 폼 데이터
const formData = ref({
  title: '',
  content: '',
  startDate: null,
  endDate: null
})

// 날짜 표시용 포맷 함수 (VueDatePicker용 - "2025년 12월 11일" 형식)
const formatDateDisplay = (date) => {
  if (!date) return ''

  const d = new Date(date)
  const year = d.getFullYear()
  const month = d.getMonth() + 1
  const day = d.getDate()

  return `${year}년 ${month}월 ${day}일`
}

// 토스트 메시지
const showToast = ref(false)
const toastMessage = ref('')

// 네트워크 오류
const networkError = ref(false)
const errorMessage = ref('')

// 제출 중 상태
const isSubmitting = ref(false)

// 폼 유효성 검증
const isFormValid = computed(() => {
  return formData.value.title.trim() !== '' &&
         formData.value.content.trim() !== '' &&
         formData.value.startDate !== null &&
         formData.value.endDate !== null
})

// 날짜 유효성 검증
const isDateRangeValid = computed(() => {
  if (!formData.value.startDate || !formData.value.endDate) return true
  return new Date(formData.value.startDate) <= new Date(formData.value.endDate)
})

const displayToast = (message) => {
  toastMessage.value = message
  showToast.value = true
  setTimeout(() => {
    showToast.value = false
  }, 3000)
}

const handleSubmit = async () => {
  if (!isFormValid.value) {
    displayToast('모든 필드를 입력해주세요')
    return
  }

  if (!isDateRangeValid.value) {
    displayToast('종료일은 시작일 이후여야 합니다')
    return
  }

  isSubmitting.value = true
  networkError.value = false

  try {
    const requestData = {
      title: formData.value.title,
      content: formData.value.content,
      startDate: formatDate(formData.value.startDate),
      endDate: formatDate(formData.value.endDate)
    }

    const response = await dietPlanApi.create(requestData)

    displayToast('식단 계획이 생성되었습니다!')

    // Location header에서 생성된 ID 추출
    const locationHeader = response.headers.location
    let dietPlanId = null

    if (locationHeader) {
      // Location: /api/diet-plans/{id} 형식에서 ID 추출
      const matches = locationHeader.match(/\/(\d+)$/)
      if (matches) {
        dietPlanId = matches[1]
      }
    }

    // 0.5초 후 상세 페이지로 이동
    setTimeout(() => {
      if (dietPlanId) {
        router.push(`/diet/edit?id=${dietPlanId}`)
      } else {
        router.push('/diet')
      }
    }, 500)
  } catch (error) {
    console.error('식단 계획 생성 실패:', error)
    networkError.value = true
    errorMessage.value = error.response?.data?.message || '네트워크 오류입니다'

    // 3초 후 에러 메시지 자동 숨김
    setTimeout(() => {
      networkError.value = false
    }, 3000)
  } finally {
    isSubmitting.value = false
  }
}

const handleCancel = () => {
  router.back()
}
</script>

<template>
  <div class="add-diet-plan-container">
    <!-- 상단 네비게이션 -->
    <AppHeader active-page="diet" />

    <!-- 메인 콘텐츠 -->
    <main class="main-content">
      <div class="content-wrapper">
        <div class="page-header">
          <h1 class="page-title">새 식단 계획</h1>
        </div>

        <div class="form-card">
          <!-- 네트워크 오류 메시지 -->
          <div v-if="networkError" class="network-error">
            {{ errorMessage }}
          </div>

          <form @submit.prevent="handleSubmit">
            <!-- 제목 입력 -->
            <div class="form-section">
              <label class="form-label">제목</label>
              <input
                v-model="formData.title"
                type="text"
                placeholder="예: 1월 다이어트 식단"
                class="form-input"
                required
                maxlength="100"
              />
            </div>

            <!-- 내용 입력 -->
            <div class="form-section">
              <label class="form-label">내용</label>
              <textarea
                v-model="formData.content"
                placeholder="식단 계획에 대한 설명을 입력해주세요"
                class="form-textarea"
                required
                rows="5"
                maxlength="500"
              ></textarea>
            </div>

            <!-- 날짜 범위 입력 -->
            <div class="form-section">
              <label class="form-label">기간</label>
              <div class="date-range-inputs">
                <div class="date-input-group">
                  <label class="date-label">시작일</label>
                  <VueDatePicker
                    v-model="formData.startDate"
                    :enable-time-picker="false"
                    placeholder="시작일"
                    auto-apply
                    :format="formatDateDisplay"
                    model-type="yyyy-MM-dd"
                    class="custom-datepicker"
                  />
                </div>
                <span class="date-separator">~</span>
                <div class="date-input-group">
                  <label class="date-label">종료일</label>
                  <VueDatePicker
                    v-model="formData.endDate"
                    :enable-time-picker="false"
                    placeholder="종료일"
                    auto-apply
                    :format="formatDateDisplay"
                    model-type="yyyy-MM-dd"
                    :min-date="formData.startDate"
                    class="custom-datepicker"
                  />
                </div>
              </div>
              <p v-if="!isDateRangeValid" class="error-text">
                종료일은 시작일 이후여야 합니다
              </p>
            </div>

            <!-- 버튼 -->
            <div class="form-actions">
              <button
                type="button"
                class="cancel-btn"
                @click="handleCancel"
                :disabled="isSubmitting"
              >
                취소
              </button>
              <button
                type="submit"
                class="submit-btn"
                :disabled="!isFormValid || !isDateRangeValid || isSubmitting"
                :class="{ disabled: !isFormValid || !isDateRangeValid || isSubmitting }"
              >
                {{ isSubmitting ? '생성 중...' : '생성' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>

    <!-- 토스트 메시지 -->
    <div v-if="showToast" class="toast-message">
      <div class="toast-icon">✓</div>
      <span class="toast-text">{{ toastMessage }}</span>
    </div>
  </div>
</template>

<style scoped>
.add-diet-plan-container {
  min-height: 100vh;
  background-color: #F5F7FA;
}

/* 메인 콘텐츠 */
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

/* 폼 카드 */
.form-card {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 40px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

/* 네트워크 오류 메시지 */
.network-error {
  background: #FFEBEE;
  color: #D32F2F;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 24px;
  font-size: 14px;
  font-weight: 600;
  text-align: center;
  border: 1px solid #FFCDD2;
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    transform: translateY(-10px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.form-section {
  margin-bottom: 32px;
}

.form-label {
  display: block;
  font-size: 16px;
  font-weight: 700;
  color: #333333;
  margin-bottom: 12px;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 14px 16px;
  border: 1px solid #E0E0E0;
  border-radius: 8px;
  font-size: 15px;
  color: #333333;
  background: #FFFFFF;
  transition: border-color 0.3s ease;
  font-family: inherit;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #4CAF50;
}

.form-input::placeholder,
.form-textarea::placeholder {
  color: #AAAAAA;
}

.form-textarea {
  resize: vertical;
  min-height: 120px;
}

/* 날짜 범위 입력 */
.date-range-inputs {
  display: flex;
  align-items: flex-end;
  gap: 16px;
}

.date-input-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.date-label {
  font-size: 14px;
  font-weight: 600;
  color: #666666;
}

/* 커스텀 데이트피커 스타일 */
.custom-datepicker {
  width: 100%;
}

.custom-datepicker :deep(.dp__input_wrap) {
  width: 100%;
}

.custom-datepicker :deep(.dp__input) {
  padding: 14px 40px 14px 16px;
  border: 1px solid #E0E0E0;
  border-radius: 8px;
  font-size: 15px;
  color: #333333;
  background: #FFFFFF;
  cursor: pointer;
  transition: border-color 0.3s ease;
  font-family: inherit;
  width: 100%;
}

.custom-datepicker :deep(.dp__input::placeholder) {
  color: #AAAAAA;
}

.custom-datepicker :deep(.dp__input:hover) {
  border-color: #4CAF50;
}

.custom-datepicker :deep(.dp__input:focus) {
  outline: none;
  border-color: #4CAF50;
}

.custom-datepicker :deep(.dp__input_icon) {
  right: 40px;
  left: auto;
  color: #666666;
}

.custom-datepicker :deep(.dp__input_icon svg) {
  width: 20px;
  height: 20px;
}

.custom-datepicker :deep(.dp__clear_icon) {
  right: 12px;
  left: auto;
}

.custom-datepicker :deep(.dp__action_buttons) {
  display: none;
}

.custom-datepicker :deep(.dp__active_date) {
  background-color: #4CAF50;
}

.custom-datepicker :deep(.dp__today) {
  border-color: #4CAF50;
}

.custom-datepicker :deep(.dp__cell_inner.dp__active_date) {
  background: #4CAF50;
  color: #FFFFFF;
}

.custom-datepicker :deep(.dp__cell_inner:hover) {
  background: #E8F5E9;
  color: #4CAF50;
}

.date-separator {
  font-size: 18px;
  font-weight: 600;
  color: #666666;
  padding-bottom: 14px;
}

.error-text {
  margin-top: 8px;
  font-size: 14px;
  color: #F44336;
  font-weight: 500;
}

/* 액션 버튼 */
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

.cancel-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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

.submit-btn.disabled {
  background: #CCCCCC;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
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
  z-index: 1000;
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
@media (max-width: 768px) {
  .main-content {
    padding: 20px;
  }

  .form-card {
    padding: 24px;
  }

  .date-range-inputs {
    flex-direction: column;
    align-items: stretch;
  }

  .date-separator {
    display: none;
  }

  .form-actions {
    flex-direction: column;
  }

  .cancel-btn,
  .submit-btn {
    width: 100%;
  }

  .toast-message {
    bottom: 20px;
    max-width: 90%;
  }
}
</style>

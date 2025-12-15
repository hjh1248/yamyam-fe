<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { dietPlanApi } from '@/api';
import AppHeader from '@/components/AppHeader.vue';
import { VueDatePicker } from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';

const router = useRouter();
const route = useRoute();

const dietPlanId = ref(null);
const form = ref({
  startDate: '',
  endDate: '',
  content: '',
});
const isLoading = ref(true);
const isSubmitting = ref(false);
const errorMessage = ref('');

const formatDateDisplay = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();
  return `${year}년 ${month}월 ${day}일`;
};

onMounted(async () => {
  dietPlanId.value = route.query.id;
  if (!dietPlanId.value) {
    router.push('/diet');
    return;
  }

  try {
    const response = await dietPlanApi.getById(dietPlanId.value);
    const { startDate, endDate, content } = response.data;
    form.value = { startDate, endDate, content };
  } catch (error) {
    console.error('식단 계획 정보 조회 실패:', error);
    errorMessage.value = '식단 정보를 불러오는데 실패했습니다.';
  } finally {
    isLoading.value = false;
  }
});

const handleSubmit = async () => {
  if (isSubmitting.value) return;
  isSubmitting.value = true;
  errorMessage.value = '';

  try {
    await dietPlanApi.update(dietPlanId.value, form.value);
    router.push({ path: '/diet/detail', query: { id: dietPlanId.value } });
  } catch (error) {
    console.error('식단 계획 수정 실패:', error);
    errorMessage.value = '식단 계획 수정에 실패했습니다.';
  } finally {
    isSubmitting.value = false;
  }
};

const handleCancel = () => {
  router.back();
};
</script>

<template>
  <div class="update-diet-plan-container">
    <AppHeader active-page="diet" />
    <main class="main-content">
      <div class="form-wrapper">
        <h1 class="page-title">식단 계획 수정</h1>
        <div v-if="isLoading" class="loading-state">
          데이터를 불러오는 중...
        </div>
        <form v-else @submit.prevent="handleSubmit">
          <div class="form-group">
            <label for="startDate">시작일</label>
            <VueDatePicker
              id="startDate"
              v-model="form.startDate"
              :enable-time-picker="false"
              placeholder="시작일"
              auto-apply
              :format="formatDateDisplay"
              model-type="yyyy-MM-dd"
              class="custom-datepicker"
              required
            />
          </div>
          <div class="form-group">
            <label for="endDate">종료일</label>
            <VueDatePicker
              id="endDate"
              v-model="form.endDate"
              :enable-time-picker="false"
              placeholder="종료일"
              auto-apply
              :format="formatDateDisplay"
              model-type="yyyy-MM-dd"
              :min-date="form.startDate"
              class="custom-datepicker"
              required
            />
          </div>
          <div class="form-group">
            <label for="content">설명</label>
            <textarea id="content" v-model="form.content" rows="5"></textarea>
          </div>

          <div v-if="errorMessage" class="error-message">
            {{ errorMessage }}
          </div>

          <div class="form-actions">
            <button type="button" class="cancel-btn" @click="handleCancel" :disabled="isSubmitting">
              취소
            </button>
            <button type="submit" class="submit-btn" :disabled="isSubmitting">
              {{ isSubmitting ? '수정 중...' : '수정 완료' }}
            </button>
          </div>
        </form>
      </div>
    </main>
  </div>
</template>

<style scoped>
.update-diet-plan-container {
  min-height: 100vh;
  background-color: #F5F7FA;
}

.main-content {
  padding: 40px;
  display: flex;
  justify-content: center;
}

.form-wrapper {
  max-width: 600px;
  width: 100%;
  background: #FFFFFF;
  border-radius: 12px;
  padding: 40px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: #333;
  text-align: center;
  margin-bottom: 32px;
}

.loading-state {
  text-align: center;
  padding: 40px;
  color: #666;
}

.form-group {
  margin-bottom: 24px;
}

.form-group label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #555;
  margin-bottom: 8px;
}

.form-group textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #E0E0E0;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.3s ease;
  background-color: #FFFFFF;
  color: #333333;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #4CAF50;
}

.form-group textarea {
  resize: vertical;
}

.error-message {
  background: #FFEBEE;
  color: #D32F2F;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 24px;
  text-align: center;
  font-weight: 600;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 32px;
}

.cancel-btn,
.submit-btn {
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
}

.cancel-btn {
  background: #F0F0F0;
  color: #555;
}

.cancel-btn:hover {
  background: #E0E0E0;
}

.submit-btn {
  background: #4CAF50;
  color: #FFFFFF;
}

.submit-btn:hover:not(:disabled) {
  background: #45A049;
}

.submit-btn:disabled {
  background: #CCCCCC;
  cursor: not-allowed;
}

/* Custom Datepicker Styles */
.custom-datepicker {
  width: 100%;
}

.custom-datepicker :deep(.dp__input_wrap) {
  width: 100%;
}

.custom-datepicker :deep(.dp__input) {
  padding: 14px 40px 14px 16px; /* Adjusted padding to make space for icons */
  border: 1px solid #E0E0E0;
  border-radius: 8px;
  font-size: 16px;
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

.custom-datepicker :deep(.dp__clear_icon) {
  right: 12px;
  left: auto;
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
</style>

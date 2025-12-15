import apiClient from './axios'

/**
 * 식단 계획 API
 */
export const dietPlanApi = {
  /**
   * 식단 계획 생성
   */
  create(data) {
    return apiClient.post('/api/diet-plans', data)
  },

  /**
   * 식단 계획 조회 (단건)
   */
  getById(dietPlanId) {
    return apiClient.get(`/api/diet-plans/${dietPlanId}`)
  },

  /**
   * 내 식단 계획 목록 조회
   */
  getMyList() {
    return apiClient.get('/api/diet-plans/my')
  },

  /**
   * 대표 식단 계획 조회
   */
  getPrimary() {
    return apiClient.get('/api/diet-plans/my/primary')
  },

  /**
   * 대표 식단 변경
   */
  updatePrimary(dietPlanId) {
    return apiClient.patch(`/api/diet-plans/${dietPlanId}/primary`)
  },

  /**
   * 식단 계획 수정
   */
  update(dietPlanId, data) {
    return apiClient.patch(`/api/diet-plans/${dietPlanId}`, data)
  },

  /**
   * 식단 계획 삭제
   */
  delete(dietPlanId) {
    return apiClient.delete(`/api/diet-plans/${dietPlanId}`)
  }
}

/**
 * 일일 식단 API
 */
export const dailyDietApi = {
  /**
   * 일일 식단 생성
   */
  create(dietPlanId, data) {
    return apiClient.post(`/api/diet-plans/${dietPlanId}/daily-diets`, {
      dietPlanId,
      ...data
    })
  },

  /**
   * 식단 계획의 일일 식단 목록 조회
   */
  getList(dietPlanId) {
    return apiClient.get(`/api/diet-plans/${dietPlanId}/daily-diets`)
  },

  /**
   * 일일 식단 상세 조회 (특정 날짜)
   */
  getByDate(dietPlanId, date) {
    return apiClient.get(`/api/diet-plans/${dietPlanId}/daily-diets/${date}`)
  },

  /**
   * 일일 식단 수정
   */
  update(dietPlanId, dailyDietId, data) {
    return apiClient.patch(`/api/diet-plans/${dietPlanId}/daily-diets/${dailyDietId}`, data)
  },

  /**
   * 일일 식단 삭제
   */
  delete(dietPlanId, dailyDietId) {
    return apiClient.delete(`/api/diet-plans/${dietPlanId}/daily-diets/${dailyDietId}`)
  }
}

/**
 * 식사 API
 */
export const mealApi = {
  /**
   * 식사 등록
   */
  create(dietPlanId, dailyDietId, data) {
    return apiClient.post(
      `/api/diet-plans/${dietPlanId}/daily-diets/${dailyDietId}/meals`,
      data
    )
  },

  /**
   * 식사 조회
   */
  getById(dietPlanId, dailyDietId, mealId) {
    return apiClient.get(
      `/api/diet-plans/${dietPlanId}/daily-diets/${dailyDietId}/meals/${mealId}`
    )
  },

  /**
   * 식사 수정
   */
  update(dietPlanId, dailyDietId, mealId, data) {
    return apiClient.patch(
      `/api/diet-plans/${dietPlanId}/daily-diets/${dailyDietId}/meals/${mealId}`,
      data
    )
  },

  /**
   * 식사 삭제
   */
  delete(dietPlanId, dailyDietId, mealId) {
    return apiClient.delete(
      `/api/diet-plans/${dietPlanId}/daily-diets/${dailyDietId}/meals/${mealId}`
    )
  }
}

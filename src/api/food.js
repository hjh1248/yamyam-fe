import apiClient from './axios'

/**
 * 음식 API
 */
export const foodApi = {
  /**
   * 음식 검색
   */
  search(name) {
    return apiClient.get('/api/foods/search', {
      params: { name }
    })
  }
}

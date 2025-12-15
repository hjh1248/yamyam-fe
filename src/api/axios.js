import axios from 'axios'

// Axios 인스턴스 생성
const apiClient = axios.create({
  baseURL: 'http://localhost:8080',
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000
})

// 요청 인터셉터
apiClient.interceptors.request.use(
  (config) => {
    // TODO: 추후 JWT 토큰 인증 구현 시 여기에 추가
    // const token = localStorage.getItem('accessToken')
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`
    // }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 응답 인터셉터
apiClient.interceptors.response.use(
  (response) => {
    console.log('API Response:', {
      status: response.status,
      url: response.config.url,
      method: response.config.method,
      data: response.data,
      headers: response.headers
    });
    return response
  },
  (error) => {
    // 에러 처리
    if (error.response) {
      // 서버가 응답을 반환한 경우
      const { status, data } = error.response

      switch (status) {
        case 400:
          console.error('잘못된 요청:', data.message)
          break
        case 401:
          console.error('인증 실패:', data.message)
          // TODO: 로그인 페이지로 리다이렉트
          break
        case 403:
          console.error('권한 없음:', data.message)
          break
        case 404:
          console.error('리소스를 찾을 수 없음:', data.message)
          break
        case 500:
          console.error('서버 오류:', data.message)
          break
        default:
          console.error('에러 발생:', data.message)
      }
    } else if (error.request) {
      // 요청이 전송되었지만 응답이 없는 경우
      console.error('네트워크 오류: 서버에 연결할 수 없습니다')
    } else {
      // 요청 설정 중 오류가 발생한 경우
      console.error('요청 오류:', error.message)
    }

    return Promise.reject(error)
  }
)

export default apiClient

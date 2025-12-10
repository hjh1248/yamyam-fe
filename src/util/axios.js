import axios from 'axios'
import router from '@/router' // 라우터 가져오기 (페이지 이동용)

// 1. axios 인스턴스 생성 (기본 설정)
const instance = axios.create({
  baseURL: 'http://localhost:8080', // 백엔드 주소 미리 박아두기
  headers: {
    'Content-Type': 'application/json'
  }
})

// 2. 요청 인터셉터 (요청 보내기 전에 실행)
// 매 요청마다 헤더에 토큰을 자동으로 실어 보내줌!
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 3. 응답 인터셉터 (응답 받은 후에 실행) -> 여기가 핵심! 🔥
instance.interceptors.response.use(
  (response) => {
    return response // 성공하면 그냥 통과
  },
  (error) => {
    // 서버가 "401 Unauthorized" (토큰 만료 등) 에러를 주면?
    if (error.response && error.response.status === 401) {
      console.log('토큰이 만료되어 로그아웃됩니다.')
      
      // 1. 저장소 비우기
      localStorage.removeItem('accessToken')
      localStorage.removeItem('nickname')
      
      // 2. 로그인 페이지로 강제 이동 (새로고침 효과)
      // router.push 대신 window.location을 쓰면 페이지가 리프레시되면서 상태가 확실히 초기화됨
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default instance
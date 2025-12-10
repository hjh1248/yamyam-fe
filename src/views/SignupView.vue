<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from '@/util/axios' // 1. axios 불러오기

const router = useRouter()

// 기본 정보
const email = ref('')
const password = ref('')
const passwordConfirm = ref('')
const nickname = ref('')
const name = ref('')

// 토스트
const showToast = ref(false)
const toastMessage = ref('')

const displayToast = (message) => {
  toastMessage.value = message
  showToast.value = true
  setTimeout(() => {
    showToast.value = false
  }, 3000)
}

// async 키워드 추가 (비동기 통신을 위해)
const handleSignup = async () => {
  // 1. 비밀번호 확인 (프론트엔드 유효성 검사)
  if (password.value !== passwordConfirm.value) {
    displayToast('비밀번호가 일치하지 않습니다.')
    return
  }

  try {
    // 2. 백엔드로 회원가입 요청 보내기
    // 주소: http://localhost:8080/api/users/signup
    // 데이터: JoinRequest DTO 구조와 똑같이 맞춰야 해
    const response = await axios.post('http://localhost:8080/api/users/signup', {
      email: email.value,
      password: password.value,
      nickname: nickname.value,
      name: name.value
    })

    // 3. 성공 시 처리 (200 OK)
    console.log('회원가입 성공:', response.data)
    displayToast('회원가입이 완료되었습니다! 로그인해주세요.')

    // 토스트 메시지를 볼 시간을 조금 주고 이동 (1.5초)
    setTimeout(() => {
      router.push('/login')
    }, 1500)

  } catch (error) {
    // 4. 실패 시 처리 (중복 이메일 등)
    console.error('회원가입 실패:', error)

    if (error.response) {
      // 백엔드에서 보낸 에러 메시지가 있다면 그걸 보여줌
      // 예: "이미 존재하는 이메일입니다." (우리가 UserService에서 throw한 메시지)
      // Spring Boot 설정에 따라 error.response.data 자체가 메시지일 수도 있고, 객체일 수도 있어.
      const msg = error.response.data.message || error.response.data || '회원가입 중 오류가 발생했습니다.'
      displayToast(msg)
    } else {
      displayToast('서버와 연결할 수 없습니다.')
    }
  }
}
</script>

<template>
  <div class="signup-container">
    <!-- 왼쪽: 브랜딩 영역 -->
    <div class="branding-section">
      <div class="branding-content">
        <div class="logo">
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="40" cy="40" r="36" stroke="#FFFFFF" stroke-width="4"/>
            <path d="M26 40 L36 50 L56 28" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <h1 class="brand-title">냠냠 코치</h1>
        <p class="brand-description">당신의 건강한 식단을 위한<br/>스마트한 관리 파트너</p>
      </div>
    </div>

    <!-- 오른쪽: 회원가입 폼 -->
    <div class="form-section">
      <div class="form-container">
        <h2 class="form-title">회원가입</h2>
        <p class="form-subtitle">냠냠 코치와 함께 건강한 식단 관리를 시작하세요</p>

        <form @submit.prevent="handleSignup" class="signup-form">
          <!-- 기본 정보 -->
          <div class="section-title">기본 정보</div>

          <div class="input-group">
            <label class="input-label">이메일</label>
            <input
              v-model="email"
              type="email"
              placeholder="example@yamyam.com"
              required
              class="input-field"
            />
          </div>

          <div class="input-row">
            <div class="input-group">
              <label class="input-label">비밀번호</label>
              <input
                v-model="password"
                type="password"
                placeholder="비밀번호"
                required
                class="input-field"
              />
            </div>

            <div class="input-group">
              <label class="input-label">비밀번호 확인</label>
              <input
                v-model="passwordConfirm"
                type="password"
                placeholder="비밀번호 확인"
                required
                class="input-field"
              />
            </div>
          </div>

          <div class="input-row">
            <div class="input-group">
              <label class="input-label">이름</label>
              <input
                v-model="name"
                type="text"
                placeholder="홍길동"
                required
                class="input-field"
              />
            </div>

            <div class="input-group">
              <label class="input-label">닉네임</label>
              <input
                v-model="nickname"
                type="text"
                placeholder="닉네임"
                required
                class="input-field"
              />
            </div>
          </div>

          <button type="submit" class="signup-button">
            회원가입
          </button>
        </form>

        <div class="login-link">
          이미 계정이 있으신가요? <router-link to="/login" class="link">로그인</router-link>
        </div>
      </div>
    </div>

    <!-- Toast Message -->
    <transition name="slideUp">
      <div v-if="showToast" class="toast">
        <span class="toast-icon">✓</span>
        <span class="toast-message">{{ toastMessage }}</span>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.signup-container {
  min-height: 100vh;
  width: 100%;
  display: flex;
  margin: 0;
  padding: 0;
}

/* 왼쪽: 브랜딩 영역 */
.branding-section {
  flex: 1;
  background: linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  position: relative;
  overflow: hidden;
}

.branding-section::before {
  content: '';
  position: absolute;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
  top: -50%;
  left: -50%;
}

.branding-content {
  position: relative;
  text-align: center;
  color: #FFFFFF;
  z-index: 1;
}

.logo {
  margin-bottom: 32px;
  display: flex;
  justify-content: center;
}

.brand-title {
  font-size: 48px;
  font-weight: 700;
  margin-bottom: 16px;
  letter-spacing: -1px;
}

.brand-description {
  font-size: 18px;
  line-height: 1.6;
  opacity: 0.95;
}

/* 오른쪽: 회원가입 폼 */
.form-section {
  flex: 1;
  background: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px 40px;
  overflow-y: auto;
}

.form-container {
  width: 100%;
  max-width: 500px;
  padding: 40px 0;
}

.form-title {
  font-size: 32px;
  font-weight: 700;
  color: #333333;
  margin-bottom: 8px;
}

.form-subtitle {
  font-size: 15px;
  color: #888888;
  margin-bottom: 40px;
}

.signup-form {
  margin-bottom: 24px;
}

.section-title {
  font-size: 18px;
  font-weight: 700;
  color: #4CAF50;
  margin-bottom: 20px;
  margin-top: 32px;
}

.section-title:first-of-type {
  margin-top: 0;
}

.input-group {
  margin-bottom: 24px;
  flex: 1;
}

.input-row {
  display: flex;
  gap: 16px;
  width: 100%;
}

.input-label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #555555;
  margin-bottom: 8px;
}

.input-field {
  width: 100%;
  padding: 14px 0;
  font-size: 15px;
  color: #333333;
  border: none;
  border-bottom: 2px solid #E0E0E0;
  outline: none;
  background: transparent;
  transition: border-color 0.3s ease;
}

.input-field::placeholder {
  color: #AAAAAA;
}

.input-field:focus {
  border-bottom-color: #4CAF50;
}

.signup-button {
  width: 100%;
  padding: 16px;
  font-size: 16px;
  font-weight: 600;
  color: #FFFFFF;
  background: #4CAF50;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 32px;
}

.signup-button:hover {
  background: #45A049;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(76, 175, 80, 0.3);
}

.signup-button:active {
  transform: translateY(0);
}

.login-link {
  font-size: 14px;
  color: #666666;
  text-align: center;
  margin-top: 24px;
}

.link {
  color: #FFA726;
  text-decoration: none;
  font-weight: 600;
  transition: color 0.3s ease;
}

.link:hover {
  color: #FB8C00;
  text-decoration: underline;
}

/* 반응형 */
@media (max-width: 968px) {
  .signup-container {
    flex-direction: column;
  }

  .branding-section {
    padding: 40px;
    min-height: 40vh;
  }

  .form-section {
    padding: 40px 20px;
  }

  .brand-title {
    font-size: 36px;
  }

  .brand-description {
    font-size: 16px;
  }

  .input-row {
    flex-direction: column;
    gap: 0;
  }
}

/* Toast */
.toast {
  position: fixed;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  background: #FFFFFF;
  padding: 16px 24px;
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 1000;
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
  font-weight: bold;
  font-size: 14px;
}

.toast-message {
  color: #333333;
  font-weight: 500;
}

.slideUp-enter-active {
  animation: slideUp 0.3s ease-out;
}

.slideUp-leave-active {
  animation: slideUp 0.3s ease-out reverse;
}

@keyframes slideUp {
  from {
    transform: translate(-50%, 20px);
    opacity: 0;
  }
  to {
    transform: translate(-50%, 0);
    opacity: 1;
  }
}
</style>
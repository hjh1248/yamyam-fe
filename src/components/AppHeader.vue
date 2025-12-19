<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

defineProps({
  activePage: {
    type: String,
    default: ''
  }
})

const router = useRouter()
const nickname = ref('게스트')
const isLoggedIn = ref(false) // 1. 로그인 상태 체크 변수 추가

onMounted(() => {
  const token = localStorage.getItem('accessToken') // 토큰 확인
  const storedNickname = localStorage.getItem('nickname')

  // 2. 토큰도 있고 닉네임도 있어야 진짜 로그인 성공!
  if (token && storedNickname) {
    isLoggedIn.value = true
    nickname.value = storedNickname
  } else {
    isLoggedIn.value = false
    nickname.value = '' 
  }
})

const logout = () => {
  if (confirm('정말 로그아웃 하시겠습니까?')) {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('nickname')
    
    // 상태 초기화 및 이동
    isLoggedIn.value = false
    nickname.value = ''
    router.push('/login')
  }
}
</script>

<template>
  <header class="header">
    <div class="header-content">
      <router-link to="/main" class="logo">냠냠 코치</router-link>
      
      <nav class="nav">
        <router-link to="/main" :class="{ active: activePage === 'main' }">대시보드</router-link>
        <router-link to="/diet" :class="{ active: activePage === 'diet' }">식단 관리</router-link>
        <router-link to="/board" :class="{ active: activePage === 'board' }">게시판</router-link>
        <router-link to="/challenge" :class="{ active: activePage === 'challenge' }">챌린지</router-link>
        <router-link to="/friends" :class="{ active: activePage === 'friends' }">친구 검색</router-link>
      </nav>

      <div class="user-menu">
        <template v-if="isLoggedIn">
          <span class="username">{{ nickname }}님</span>
          <button class="logout-btn" @click="logout">로그아웃</button>
        </template>

        <template v-else>
          <router-link to="/login" class="login-btn">로그인</router-link>
        </template>
      </div>
    </div>
  </header>
</template>

<style scoped>
/* Header */
.header {
  background: #FFFFFF;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 40px;
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo {
  font-size: 24px;
  font-weight: bold;
  color: #4CAF50;
  text-decoration: none;
}

.nav {
  display: flex;
  gap: 30px;
}

.nav a {
  color: #666666;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.3s ease;
}

.nav a:hover,
.nav a.active {
  color: #4CAF50;
}

.user-menu {
  display: flex;
  align-items: center;
  gap: 15px;
}

.username {
  color: #333333;
  font-weight: 500;
}

.logout-btn {
  padding: 8px 16px;
  background: transparent;
  border: 1px solid #E0E0E0;
  border-radius: 6px;
  color: #666666;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.logout-btn:hover {
  border-color: #4CAF50;
  color: #4CAF50;
}

/* Responsive */
@media (max-width: 768px) {
  .header-content {
    padding: 0 20px;
  }

  .nav {
    display: none;
  }
}

.login-btn {
  padding: 8px 20px;
  background-color: #4CAF50; /* 로그인 버튼은 눈에 띄게 초록색 배경 */
  color: white;
  text-decoration: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  transition: background-color 0.3s ease;
}

.login-btn:hover {
  background-color: #45A049;
}
</style>

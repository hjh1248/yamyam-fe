<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// 폼 데이터
const title = ref('')
const content = ref('')
const images = ref([]) // { id, name, file, preview }
const showLogoutModal = ref(false)
const showToast = ref(false)
const toastMessage = ref('')
const showDietModal = ref(false)
const selectedDiet = ref(null)
const showPreviewModal = ref(false)
const contentTextarea = ref(null)
let imageIdCounter = 0

// 더미 데이터 - 사용자의 식단 목록
const dietPlans = ref([
  {
    id: 1,
    date: '2025-01-20',
    mealType: '아침',
    foods: [
      { name: '현미밥', amount: '1공기', calories: 300 },
      { name: '계란후라이', amount: '2개', calories: 150 }
    ],
    totalCalories: 450
  },
  {
    id: 2,
    date: '2025-01-20',
    mealType: '점심',
    foods: [
      { name: '닭가슴살 샐러드', amount: '1접시', calories: 350 },
      { name: '고구마', amount: '1개', calories: 130 }
    ],
    totalCalories: 480
  },
  {
    id: 3,
    date: '2025-01-21',
    mealType: '저녁',
    foods: [
      { name: '연어스테이크', amount: '150g', calories: 280 },
      { name: '브로콜리', amount: '1컵', calories: 55 }
    ],
    totalCalories: 335
  }
])

// 이미지 업로드 처리
const handleImageUpload = (event) => {
  const file = event.target.files[0]
  if (!file) return

  // 파일명에서 확장자 분리
  const originalName = file.name
  const lastDotIndex = originalName.lastIndexOf('.')
  const nameWithoutExt = lastDotIndex !== -1 ? originalName.substring(0, lastDotIndex) : originalName
  const extension = lastDotIndex !== -1 ? originalName.substring(lastDotIndex) : ''

  // 중복 이름 체크 및 넘버링
  let finalName = nameWithoutExt
  let counter = 1
  while (images.value.some(img => img.name === finalName)) {
    finalName = `${nameWithoutExt}${counter}`
    counter++
  }

  // 이미지 미리보기 생성
  const reader = new FileReader()
  reader.onload = (e) => {
    images.value.push({
      id: ++imageIdCounter,
      name: finalName,
      file: file,
      preview: e.target.result,
      fullName: finalName + extension
    })
    showToastMessage(`"${finalName}" 이미지가 추가되었습니다`)
  }
  reader.readAsDataURL(file)

  // input 초기화 (같은 파일을 다시 선택할 수 있도록)
  event.target.value = ''
}

// 이미지 제거
const removeImage = (imageId) => {
  const index = images.value.findIndex(img => img.id === imageId)
  if (index !== -1) {
    const imageName = images.value[index].name
    images.value.splice(index, 1)
    showToastMessage(`"${imageName}" 이미지가 제거되었습니다`)
  }
}

// 본문에 이미지 삽입
const insertImageToContent = (imageName) => {
  const textarea = contentTextarea.value
  if (!textarea) return

  const cursorPosition = textarea.selectionStart
  const textBefore = content.value.substring(0, cursorPosition)
  const textAfter = content.value.substring(cursorPosition)

  const placeholder = `[${imageName}]`
  content.value = textBefore + placeholder + textAfter

  // 커서 위치를 플레이스홀더 뒤로 이동
  setTimeout(() => {
    textarea.focus()
    const newPosition = cursorPosition + placeholder.length
    textarea.setSelectionRange(newPosition, newPosition)
  }, 0)

  showToastMessage(`"${imageName}" 이미지가 본문에 삽입되었습니다`)
}

// 식단 선택 모달 열기
const openDietModal = () => {
  showDietModal.value = true
}

// 식단 선택
const selectDiet = (diet) => {
  selectedDiet.value = diet
  showDietModal.value = false
  showToastMessage(`${diet.date} ${diet.mealType} 식단이 선택되었습니다`)
}

// 선택된 식단 제거
const removeDiet = () => {
  selectedDiet.value = null
}

// 글 작성 제출
const handleSubmit = () => {
  if (!title.value.trim() || !content.value.trim()) {
    showToastMessage('제목과 내용을 모두 입력해주세요')
    return
  }

  // 게시글 데이터 생성
  const postData = {
    id: Date.now(),
    title: title.value,
    content: content.value,
    author: '홍길동',
    createdAt: new Date().toLocaleDateString('ko-KR'),
    images: images.value.map(img => ({
      name: img.name,
      preview: img.preview
    })),
    selectedDiet: selectedDiet.value
  }

  showToastMessage('게시글이 작성되었습니다')
  setTimeout(() => {
    router.push({
      path: '/board/detail',
      query: { data: encodeURIComponent(JSON.stringify(postData)) }
    })
  }, 1000)
}

// 취소 (게시판으로 돌아가기)
const handleCancel = () => {
  if (title.value || content.value || images.value.length > 0) {
    if (confirm('작성 중인 내용이 있습니다. 정말 취소하시겠습니까?')) {
      router.push('/board')
    }
  } else {
    router.push('/board')
  }
}

// 토스트 메시지
const showToastMessage = (message) => {
  toastMessage.value = message
  showToast.value = true
  setTimeout(() => {
    showToast.value = false
  }, 3000)
}

// 로그아웃
const handleLogout = () => {
  showLogoutModal.value = true
}

const confirmLogout = () => {
  showLogoutModal.value = false
  router.push('/login')
}

const goToMain = () => {
  router.push('/main')
}

// 미리보기
const openPreview = () => {
  if (!title.value.trim() && !content.value.trim()) {
    showToastMessage('제목이나 내용을 입력해주세요')
    return
  }
  showPreviewModal.value = true
}

// 본문 내용을 파싱 (이미지 플레이스홀더 처리)
const parsedContent = computed(() => {
  if (!content.value) return []

  const result = []
  let currentText = content.value
  let currentIndex = 0

  // [이미지명] 패턴을 찾아서 파싱
  const regex = /\[([^\]]+)\]/g
  let match

  while ((match = regex.exec(content.value)) !== null) {
    // 매치 이전의 텍스트
    if (match.index > currentIndex) {
      const textBefore = content.value.substring(currentIndex, match.index)
      if (textBefore) {
        result.push({ type: 'text', content: textBefore })
      }
    }

    // 이미지명 확인
    const imageName = match[1]
    const image = images.value.find(img => img.name === imageName)

    if (image) {
      result.push({ type: 'image', name: imageName, image: image })
    } else {
      // 이미지를 찾지 못한 경우 텍스트로 처리
      result.push({ type: 'text', content: match[0] })
    }

    currentIndex = match.index + match[0].length
  }

  // 남은 텍스트
  if (currentIndex < content.value.length) {
    const remainingText = content.value.substring(currentIndex)
    if (remainingText) {
      result.push({ type: 'text', content: remainingText })
    }
  }

  return result
})
</script>

<template>
  <div class="write-container">
    <!-- 상단 네비게이션 -->
    <header class="header">
      <div class="header-content">
        <div class="logo" @click="goToMain">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="20" cy="20" r="18" stroke="#4CAF50" stroke-width="2"/>
            <path d="M13 20 L18 25 L28 14" stroke="#4CAF50" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span class="logo-text">냠냠 코치</span>
        </div>

        <nav class="nav-menu">
          <router-link to="/main" class="nav-item">대시보드</router-link>
          <router-link to="/diet" class="nav-item">식단 관리</router-link>
          <router-link to="/board" class="nav-item active">게시판</router-link>
          <router-link to="/challenge" class="nav-item">챌린지</router-link>
          <router-link to="/mypage" class="nav-item">마이페이지</router-link>
        </nav>

        <div class="user-menu">
          <span class="username">홍길동님</span>
          <button class="logout-btn" @click="handleLogout">로그아웃</button>
        </div>
      </div>
    </header>

    <!-- 메인 콘텐츠 -->
    <main class="main-content">
      <div class="content-wrapper">
        <div class="page-header">
          <h1 class="page-title">게시글 작성</h1>
        </div>

        <!-- 글쓰기 폼 -->
        <form @submit.prevent="handleSubmit" class="write-form">
          <!-- 제목 입력 -->
          <div class="form-group">
            <label class="form-label">제목</label>
            <input
              v-model="title"
              type="text"
              placeholder="제목을 입력하세요"
              class="form-input"
              maxlength="100"
            />
          </div>

          <!-- 내용 입력 -->
          <div class="form-group">
            <label class="form-label">내용</label>
            <textarea
              ref="contentTextarea"
              v-model="content"
              placeholder="내용을 입력하세요"
              class="form-textarea"
              rows="12"
            ></textarea>
          </div>

          <!-- 이미지 업로드 -->
          <div class="form-group">
            <label class="form-label">이미지 첨부</label>
            <div class="image-upload-section">
              <input
                type="file"
                ref="fileInput"
                @change="handleImageUpload"
                accept="image/*"
                class="file-input"
                id="imageUpload"
              />
              <label for="imageUpload" class="upload-btn">
                📷 이미지 선택
              </label>

              <!-- 이미지 목록 -->
              <div v-if="images.length > 0" class="images-list">
                <div
                  v-for="image in images"
                  :key="image.id"
                  class="image-item"
                >
                  <div class="image-preview-wrapper">
                    <img :src="image.preview" alt="미리보기" class="image-thumbnail" />
                  </div>
                  <div class="image-info">
                    <div class="image-name">{{ image.name }}</div>
                    <div class="image-filename">{{ image.fullName }}</div>
                  </div>
                  <div class="image-actions">
                    <button
                      type="button"
                      @click="insertImageToContent(image.name)"
                      class="insert-image-btn"
                    >
                      📝 삽입
                    </button>
                    <button
                      type="button"
                      @click="removeImage(image.id)"
                      class="remove-image-btn-small"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 식단 선택 -->
          <div class="form-group">
            <label class="form-label">식단 첨부</label>
            <button
              type="button"
              @click="openDietModal"
              class="select-diet-btn"
            >
              🍽️ 식단 선택하기
            </button>

            <!-- 선택된 식단 표시 -->
            <div v-if="selectedDiet" class="selected-diet-card">
              <div class="selected-diet-header">
                <div class="diet-info">
                  <span class="diet-badge">식단 포함</span>
                  <span class="diet-date">{{ selectedDiet.date }} {{ selectedDiet.mealType }}</span>
                </div>
                <button type="button" @click="removeDiet" class="remove-diet-btn">✕</button>
              </div>
              <div class="diet-foods">
                <div v-for="food in selectedDiet.foods" :key="food.name" class="food-item">
                  {{ food.name }} ({{ food.amount }}) - {{ food.calories }}kcal
                </div>
              </div>
              <div class="diet-total">
                총 {{ selectedDiet.totalCalories }}kcal
              </div>
            </div>
          </div>

          <!-- 버튼 그룹 -->
          <div class="button-group">
            <button type="button" @click="handleCancel" class="cancel-btn">
              취소
            </button>
            <button type="button" @click="openPreview" class="preview-btn">
              👁️ 미리보기
            </button>
            <button type="submit" class="submit-btn">
              작성 완료
            </button>
          </div>
        </form>
      </div>
    </main>

    <!-- 로그아웃 모달 -->
    <div v-if="showLogoutModal" class="modal-overlay" @click="showLogoutModal = false">
      <div class="modal-content logout-modal" @click.stop>
        <div class="modal-header">
          <h2 class="modal-title">로그아웃</h2>
          <button class="modal-close" @click="showLogoutModal = false">✕</button>
        </div>
        <div class="modal-body">
          <p class="modal-message">로그아웃 하시겠습니까?</p>
        </div>
        <div class="modal-footer">
          <button class="modal-btn cancel-btn-modal" @click="showLogoutModal = false">취소</button>
          <button class="modal-btn logout-confirm-btn" @click="confirmLogout">로그아웃</button>
        </div>
      </div>
    </div>

    <!-- 식단 선택 모달 -->
    <div v-if="showDietModal" class="modal-overlay" @click="showDietModal = false">
      <div class="modal-content diet-modal" @click.stop>
        <div class="modal-header">
          <h2 class="modal-title">식단 선택</h2>
          <button class="modal-close" @click="showDietModal = false">✕</button>
        </div>
        <div class="modal-body">
          <div class="diet-list">
            <div
              v-for="diet in dietPlans"
              :key="diet.id"
              class="diet-card"
              @click="selectDiet(diet)"
            >
              <div class="diet-card-header">
                <span class="diet-card-date">{{ diet.date }}</span>
                <span class="diet-card-meal">{{ diet.mealType }}</span>
              </div>
              <div class="diet-card-foods">
                <div v-for="food in diet.foods" :key="food.name" class="diet-card-food">
                  {{ food.name }} ({{ food.amount }})
                </div>
              </div>
              <div class="diet-card-calories">
                총 {{ diet.totalCalories }}kcal
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 미리보기 모달 -->
    <div v-if="showPreviewModal" class="modal-overlay" @click="showPreviewModal = false">
      <div class="modal-content preview-modal" @click.stop>
        <div class="modal-header">
          <h2 class="modal-title">미리보기</h2>
          <button class="modal-close" @click="showPreviewModal = false">✕</button>
        </div>
        <div class="modal-body preview-body">
          <!-- 게시글 미리보기 -->
          <div class="preview-post">
            <div class="preview-post-header">
              <h1 class="preview-post-title">{{ title || '제목 없음' }}</h1>
              <div class="preview-post-meta">
                <span class="preview-author">홍길동</span>
                <span class="preview-date">{{ new Date().toLocaleDateString('ko-KR') }}</span>
              </div>
            </div>

            <div class="preview-post-content">
              <template v-if="parsedContent.length > 0">
                <div v-for="(part, index) in parsedContent" :key="index">
                  <p v-if="part.type === 'text'" class="preview-content-text">{{ part.content }}</p>
                  <div v-else-if="part.type === 'image' && part.image" class="preview-image-section">
                    <img :src="part.image.preview" :alt="part.name" class="preview-image" />
                  </div>
                  <p v-else-if="part.type === 'image' && !part.image" class="preview-image-placeholder">
                    [{{ part.name }}] - 이미지를 찾을 수 없습니다
                  </p>
                </div>
              </template>
              <p v-else class="preview-empty">내용 없음</p>
            </div>

            <!-- 식단 미리보기 -->
            <div v-if="selectedDiet" class="preview-diet-section">
              <div class="preview-diet-header">
                <span class="preview-diet-badge">식단 포함</span>
                <span class="preview-diet-date">{{ selectedDiet.date }} {{ selectedDiet.mealType }}</span>
              </div>
              <div class="preview-diet-foods">
                <div v-for="food in selectedDiet.foods" :key="food.name" class="preview-diet-food">
                  {{ food.name }} ({{ food.amount }}) - {{ food.calories }}kcal
                </div>
              </div>
              <div class="preview-diet-total">
                총 {{ selectedDiet.totalCalories }}kcal
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 토스트 메시지 -->
    <div v-if="showToast" class="toast-message">
      <span class="toast-icon">✓</span>
      <span class="toast-text">{{ toastMessage }}</span>
    </div>
  </div>
</template>

<style scoped>
.write-container {
  min-height: 100vh;
  background-color: #F5F7FA;
}

/* 헤더 */
.header {
  background: #FFFFFF;
  border-bottom: 1px solid #E0E0E0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 80px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: opacity 0.3s ease;
}

.logo:hover {
  opacity: 0.8;
}

.logo-text {
  font-size: 24px;
  font-weight: 700;
  color: #333333;
}

.nav-menu {
  display: flex;
  gap: 8px;
}

.nav-item {
  padding: 12px 20px;
  color: #666666;
  text-decoration: none;
  font-weight: 600;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.nav-item:hover {
  background: #F5F7FA;
  color: #333333;
}

.nav-item.active {
  background: #E8F5E9;
  color: #4CAF50;
}

.user-menu {
  display: flex;
  align-items: center;
  gap: 16px;
}

.username {
  font-weight: 600;
  color: #333333;
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

/* 메인 콘텐츠 */
.main-content {
  padding: 40px;
}

.content-wrapper {
  max-width: 900px;
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

/* 글쓰기 폼 */
.write-form {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.form-group {
  margin-bottom: 28px;
}

.form-label {
  display: block;
  font-size: 15px;
  font-weight: 600;
  color: #333333;
  margin-bottom: 12px;
}

.form-input {
  width: 100%;
  padding: 14px 16px;
  font-size: 15px;
  color: #333333;
  background: #FFFFFF;
  border: 1px solid #E0E0E0;
  border-radius: 8px;
  outline: none;
  transition: all 0.3s ease;
  box-sizing: border-box;
}

.form-input:focus {
  border-color: #4CAF50;
  box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1);
}

.form-textarea {
  width: 100%;
  padding: 14px 16px;
  font-size: 15px;
  color: #333333;
  background: #FFFFFF;
  border: 1px solid #E0E0E0;
  border-radius: 8px;
  outline: none;
  transition: all 0.3s ease;
  resize: vertical;
  font-family: inherit;
  line-height: 1.6;
  box-sizing: border-box;
}

.form-textarea:focus {
  border-color: #4CAF50;
  box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1);
}

/* 이미지 업로드 */
.image-upload-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.file-input {
  display: none;
}

.upload-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: #F5F7FA;
  border: 1px solid #E0E0E0;
  border-radius: 8px;
  color: #666666;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  width: fit-content;
}

.upload-btn:hover {
  background: #E8EAF0;
  border-color: #BDBDBD;
  color: #333333;
}

/* 이미지 목록 */
.images-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 16px;
}

.image-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px;
  background: #F8F9FA;
  border: 1px solid #E0E0E0;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.image-item:hover {
  background: #F0F2F5;
  border-color: #4CAF50;
}

.image-preview-wrapper {
  flex-shrink: 0;
  width: 80px;
  height: 80px;
  border-radius: 6px;
  overflow: hidden;
  background: #FFFFFF;
  border: 1px solid #E0E0E0;
}

.image-thumbnail {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-info {
  flex: 1;
  min-width: 0;
}

.image-name {
  font-size: 15px;
  font-weight: 600;
  color: #333333;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.image-filename {
  font-size: 13px;
  color: #888888;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.image-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.insert-image-btn {
  padding: 8px 16px;
  background: #4CAF50;
  border: none;
  border-radius: 6px;
  color: #FFFFFF;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.insert-image-btn:hover {
  background: #45A049;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
}

.remove-image-btn-small {
  width: 32px;
  height: 32px;
  background: #F44336;
  border: none;
  border-radius: 50%;
  color: #FFFFFF;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.remove-image-btn-small:hover {
  background: #D32F2F;
  transform: scale(1.1);
}

/* 식단 선택 */
.select-diet-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: #E8F5E9;
  border: 1px solid #4CAF50;
  border-radius: 8px;
  color: #4CAF50;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.select-diet-btn:hover {
  background: #4CAF50;
  color: #FFFFFF;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
}

/* 선택된 식단 카드 */
.selected-diet-card {
  margin-top: 16px;
  padding: 20px;
  background: #F8F9FA;
  border: 2px solid #4CAF50;
  border-radius: 12px;
}

.selected-diet-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.diet-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.diet-badge {
  padding: 4px 12px;
  background: #4CAF50;
  color: #FFFFFF;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 600;
}

.diet-date {
  font-size: 15px;
  font-weight: 600;
  color: #333333;
}

.remove-diet-btn {
  width: 28px;
  height: 28px;
  background: #F44336;
  border: none;
  border-radius: 50%;
  color: #FFFFFF;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.remove-diet-btn:hover {
  background: #D32F2F;
  transform: scale(1.1);
}

.diet-foods {
  margin-bottom: 12px;
}

.food-item {
  padding: 8px 0;
  font-size: 14px;
  color: #666666;
  border-bottom: 1px solid #E0E0E0;
}

.food-item:last-child {
  border-bottom: none;
}

.diet-total {
  font-size: 15px;
  font-weight: 700;
  color: #4CAF50;
  text-align: right;
}

/* 버튼 그룹 */
.button-group {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 32px;
}

.cancel-btn {
  padding: 14px 32px;
  background: #F5F7FA;
  border: 1px solid #E0E0E0;
  border-radius: 8px;
  color: #666666;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.cancel-btn:hover {
  background: #E8EAF0;
  border-color: #BDBDBD;
  color: #333333;
}

.preview-btn {
  padding: 14px 32px;
  background: #FFFFFF;
  border: 1px solid #4CAF50;
  border-radius: 8px;
  color: #4CAF50;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.preview-btn:hover {
  background: #E8F5E9;
  border-color: #45A049;
  color: #45A049;
}

.submit-btn {
  padding: 14px 32px;
  background: #4CAF50;
  border: none;
  border-radius: 8px;
  color: #FFFFFF;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.submit-btn:hover {
  background: #45A049;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
}

.submit-btn:active {
  transform: translateY(0);
}

/* 로그아웃 모달 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: #FFFFFF;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  width: 90%;
  max-width: 500px;
}

.logout-modal {
  max-width: 400px;
}

.modal-header {
  padding: 24px 28px 16px;
  border-bottom: 1px solid #E0E0E0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-title {
  font-size: 20px;
  font-weight: 700;
  color: #333333;
}

.modal-close {
  background: none;
  border: none;
  font-size: 24px;
  color: #888888;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.modal-close:hover {
  background: #F8F9FA;
  color: #333333;
}

.logout-modal .modal-body {
  padding: 32px 28px;
  text-align: center;
}

.logout-modal .modal-message {
  font-size: 16px;
  color: #333333;
  line-height: 1.6;
  margin: 8px 0;
}

.logout-modal .modal-footer {
  padding: 24px 28px;
  border-top: 1px solid #E0E0E0;
  display: flex;
  gap: 12px;
  justify-content: center;
}

.logout-modal .modal-btn {
  padding: 12px 32px;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 100px;
}

.logout-modal .cancel-btn-modal {
  background: #F5F7FA;
  border: 1px solid #E0E0E0;
  color: #666666;
}

.logout-modal .cancel-btn-modal:hover {
  background: #E8EAF0;
  border-color: #BDBDBD;
  color: #333333;
}

.logout-confirm-btn {
  background: #4CAF50;
  border: none;
  color: #FFFFFF;
  padding: 12px 32px;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 100px;
}

.logout-confirm-btn:hover {
  background: #45A049;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
}

/* 식단 선택 모달 */
.diet-modal {
  max-width: 600px;
}

.diet-modal .modal-body {
  padding: 24px 28px;
  max-height: 500px;
  overflow-y: auto;
}

.diet-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.diet-card {
  padding: 16px;
  background: #F8F9FA;
  border: 2px solid #E0E0E0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.diet-card:hover {
  border-color: #4CAF50;
  background: #E8F5E9;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.2);
}

.diet-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.diet-card-date {
  font-size: 14px;
  font-weight: 600;
  color: #666666;
}

.diet-card-meal {
  padding: 4px 12px;
  background: #4CAF50;
  color: #FFFFFF;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 600;
}

.diet-card-foods {
  margin-bottom: 12px;
}

.diet-card-food {
  padding: 4px 0;
  font-size: 14px;
  color: #666666;
}

.diet-card-calories {
  font-size: 15px;
  font-weight: 700;
  color: #4CAF50;
  text-align: right;
}

/* 미리보기 모달 */
.preview-modal {
  max-width: 800px;
  max-height: 90vh;
}

.preview-body {
  padding: 0;
  max-height: calc(90vh - 150px);
  overflow-y: auto;
}

.preview-post {
  padding: 32px;
}

.preview-post-header {
  border-bottom: 2px solid #E0E0E0;
  padding-bottom: 20px;
  margin-bottom: 24px;
}

.preview-post-title {
  font-size: 28px;
  font-weight: 700;
  color: #333333;
  margin-bottom: 12px;
  line-height: 1.4;
}

.preview-post-meta {
  display: flex;
  gap: 16px;
  align-items: center;
}

.preview-author {
  font-size: 15px;
  font-weight: 600;
  color: #333333;
}

.preview-date {
  font-size: 14px;
  color: #888888;
}

.preview-post-content {
  margin-bottom: 24px;
}

.preview-content-text {
  font-size: 16px;
  color: #333333;
  line-height: 1.8;
  white-space: pre-wrap;
  word-break: break-word;
}

.preview-empty {
  font-size: 15px;
  color: #AAAAAA;
  font-style: italic;
}

.preview-image-section {
  margin-bottom: 24px;
}

.preview-image-label {
  font-size: 14px;
  font-weight: 600;
  color: #4CAF50;
  margin-bottom: 8px;
  padding: 6px 12px;
  background: #E8F5E9;
  border-radius: 6px;
  display: inline-block;
}

.preview-image {
  width: 100%;
  max-height: 500px;
  object-fit: contain;
  border-radius: 12px;
  border: 1px solid #E0E0E0;
}

.preview-image-placeholder {
  padding: 40px;
  background: #F5F7FA;
  border: 2px dashed #E0E0E0;
  border-radius: 12px;
  text-align: center;
  color: #AAAAAA;
  font-size: 15px;
  font-style: italic;
  margin: 16px 0;
}

.preview-diet-section {
  padding: 20px;
  background: #F8F9FA;
  border: 2px solid #4CAF50;
  border-radius: 12px;
}

.preview-diet-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.preview-diet-badge {
  padding: 6px 14px;
  background: #4CAF50;
  color: #FFFFFF;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 600;
}

.preview-diet-date {
  font-size: 15px;
  font-weight: 600;
  color: #333333;
}

.preview-diet-foods {
  margin-bottom: 12px;
}

.preview-diet-food {
  padding: 8px 0;
  font-size: 14px;
  color: #666666;
  border-bottom: 1px solid #E0E0E0;
}

.preview-diet-food:last-child {
  border-bottom: none;
}

.preview-diet-total {
  font-size: 16px;
  font-weight: 700;
  color: #4CAF50;
  text-align: right;
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
  background: #333333;
  color: #FFFFFF;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  z-index: 1001;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translate(-50%, 20px);
  }
  to {
    opacity: 1;
    transform: translate(-50%, 0);
  }
}

.toast-icon {
  width: 24px;
  height: 24px;
  background: #4CAF50;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
}

.toast-text {
  font-size: 15px;
  font-weight: 500;
}

/* 반응형 */
@media (max-width: 968px) {
  .header-content {
    padding: 0 20px;
  }

  .nav-menu {
    display: none;
  }

  .main-content {
    padding: 20px;
  }

  .write-form {
    padding: 24px;
  }

  .button-group {
    flex-direction: column;
  }

  .cancel-btn,
  .preview-btn,
  .submit-btn {
    width: 100%;
  }
}
</style>

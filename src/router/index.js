import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import SignupView from '../views/SignupView.vue'
import MainView from '../views/MainView.vue'
import DietView from '../views/DietView.vue'
import AddDietView from '../views/AddDietView.vue'
import EditDietView from '../views/EditDietView.vue'
import BoardView from '../views/BoardView.vue'
import WriteBoardView from '../views/WriteBoardView.vue'
import BoardDetailView from '../views/BoardDetailView.vue'
import ChallengeView from '../views/ChallengeView.vue'
import MyPageView from '../views/MyPageView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/login'
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView
    },
    {
      path: '/signup',
      name: 'signup',
      component: SignupView
    },
    {
      path: '/main',
      name: 'main',
      component: MainView
    },
    {
      path: '/diet',
      name: 'diet',
      component: DietView
    },
    {
      path: '/diet/add',
      name: 'add-diet',
      component: AddDietView
    },
    {
      path: '/diet/edit',
      name: 'edit-diet',
      component: EditDietView
    },
    {
      path: '/board',
      name: 'board',
      component: BoardView
    },
    {
      path: '/board/write',
      name: 'write-board',
      component: WriteBoardView
    },
    {
      path: '/board/detail',
      name: 'board-detail',
      component: BoardDetailView
    },
    {
      path: '/challenge',
      name: 'challenge',
      component: ChallengeView
    },
    {
      path: '/mypage',
      name: 'mypage',
      component: MyPageView
    }
  ]
})

export default router

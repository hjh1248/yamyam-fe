import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import SignupView from '../views/SignupView.vue'
import MainView from '../views/MainView.vue'
import DietView from '../views/DietView.vue'
import AddDietView from '../views/AddDietView.vue'
import MealDetailView from '../views/MealDetailView.vue'
import CreateDailyDietView from '../views/CreateDailyDietView.vue'
import DietPlanDetailView from '../views/DietPlanDetailView.vue' // Renamed from EditDietView
import BoardView from '../views/BoardView.vue'
import PostDetailView from '../views/PostDetailView.vue'
import PostFormView from '../views/PostFormView.vue'
import ChallengeView from '../views/ChallengeView.vue'
import ChallengeDetailView from '../views/ChallengeDetailView.vue'
import FriendsView from '../views/FriendsView.vue'
import UserProfileView from '../views/UserProfileView.vue'

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
      path: '/diet/detail', // Changed from /diet/edit
      name: 'diet-plan-detail', // Changed from edit-diet
      component: DietPlanDetailView // Renamed component
    },
    {
      path: '/diet/meal',
      name: 'meal-detail',
      component: MealDetailView
    },
    {
      path: '/diet/daily/create',
      name: 'create-daily-diet',
      component: CreateDailyDietView
    },
    {
      path: '/diet/plan/update',
      name: 'update-diet-plan',
      component: () => import('@/views/UpdateDietPlanView.vue')
    },
    {
      path: '/board',
      name: 'board',
      component: BoardView
    },
    {
      path: '/board/write',
      name: 'post-write',
      component: PostFormView
    },
    {
      path: '/board/edit/:id',
      name: 'post-edit',
      component: PostFormView
    },
    {
      path: '/board/:id',
      name: 'post-detail',
      component: PostDetailView
    },
    {
      path: '/challenge',
      name: 'challenge',
      component: ChallengeView
    },
    {
      path: '/challenge/:id',
      name: 'challenge-detail',
      component: ChallengeDetailView
    },
    {
      path: '/friends',
      name: 'friends',
      component: FriendsView
    },
    {
      path: '/user/:id',
      name: 'user-profile',
      component: UserProfileView
    },
    {
      path: '/follow',
      name: 'Follow',
      component: () => import('@/views/FollowView.vue')
    }
  ]
})

export default router

import { createBrowserRouter } from 'react-router-dom'
import LoginForm from './pages/auth/LoginForm'
import RegisterForm from './pages/auth/RegisterForm'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LoginForm />
  },
  {
    path: '/login',
    element: <LoginForm />
  },
  {
    path: '/register',
    element: <RegisterForm />
  },
  // 其他路由配置可以在这里添加
])
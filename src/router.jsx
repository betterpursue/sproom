import AdminAuth from './middleware/adminAuth';
import { createBrowserRouter } from 'react-router-dom'
import LoginForm from './pages/auth/LoginForm'
import RegisterForm from './pages/auth/RegisterForm'
import ActivityManagement from './pages/admin/ActivityManagement'
import ActivityDetail from './pages/admin/ActivityDetail';
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
    {
    path: '/activity-management',
    element: <ActivityManagement />,
    loader: AdminAuth
  }
  ,
  {
    path: '/activities/:id',
    element: <ActivityDetail />
  }
])
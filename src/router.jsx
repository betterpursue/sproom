import AdminAuth from './middleware/adminAuth';
import Auth from './middleware/auth';
import { createBrowserRouter, redirect } from 'react-router-dom';
import LoginForm from './pages/auth/LoginForm';
import RegisterForm from './pages/auth/RegisterForm';
import ActivityManagement from './pages/admin/ActivityManagement';
import ActivityDetail from './pages/admin/ActivityDetail';
import ActivityRegistration from './pages/ActivityRegistration';
import MyBookings from './pages/MyBookings';
import UserProfile from './pages/user/UserProfile';

// 通用的认证检查函数
const checkAuth = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    return redirect('/login');
  }
  return null;
};

// 检查管理员权限的函数
const checkAdminAuth = () => {
  const userRole = localStorage.getItem('userRole');
  if (!userRole || userRole !== 'admin') {
    return redirect('/login');
  }
  return null;
};

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
    // 先进行登录验证，再进行管理员权限验证
    loader: () => {
      const authRedirect = checkAuth();
      if (authRedirect) return authRedirect;
      return checkAdminAuth();
    }
  },
  {
    path: '/activities/:id',
    element: <ActivityDetail />,
    // 进行登录验证
    loader: checkAuth
  },
  {
    path: '/activity-registration',
    element: <ActivityRegistration />,
    // 进行登录验证
    loader: checkAuth
  },
  {
    path: '/my-bookings',
    element: <MyBookings />,
    // 进行登录验证
    loader: checkAuth
  },
  {
    path: '/profile',
    element: <UserProfile />,
    // 进行登录验证
    loader: checkAuth
  }
]);
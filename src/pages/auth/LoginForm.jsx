import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import bgImage from '/src/assets/background.png'  // 根据你的实际图片名称调整
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { userApi } from '../../services/api';

export default function LoginForm() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    usernameOrEmail: '',
    password: '',
    rememberMe: false
  });
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    setError('') // 清除之前的错误信息
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.usernameOrEmail || !formData.password) {
      setError('请填写用户名或邮箱和密码');
      toast.error('请填写用户名或邮箱和密码', { autoClose: 3000 });
      return;
    }

    setIsLoading(true);
    try {
      const response = await userApi.login({
        usernameOrEmail: formData.usernameOrEmail.trim(),
        password: formData.password.trim()
      });

      // 登录成功 - 修正：响应拦截器已返回data对象
      localStorage.setItem('token', response.token);
      localStorage.setItem('currentUser', response.user.username);
      localStorage.setItem('userRole', response.user.role);

      if (formData.rememberMe) {
        localStorage.setItem('rememberedUser', formData.usernameOrEmail);
      } else {
        localStorage.removeItem('rememberedUser');
      }

      // 登录成功提示
      toast.success('登录成功！', { autoClose: 3000 });

      // 3秒后根据角色跳转到不同页面
      setTimeout(() => {
        if (response.user.role === 'admin') {
          navigate('/activity-management');
        } else {
          navigate('/activity-registration');
        }
      }, 3000);
    } catch (error) {
      const errorMessage = error.response?.data?.message || '用户名或密码不正确';
      setError(errorMessage);
      toast.error(errorMessage, { autoClose: 3000 });
    } finally {
      setIsLoading(false);
    }
  };
  const handleRegister = () => {
    navigate('/register')
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center relative"
      style={{
        backgroundImage: `url(${bgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* 添加半透明遮罩，提高登录框可读性 */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"></div>
      
      {/* 登录框容器 */}
      <div className="max-w-md w-full space-y-8 p-8 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg transform transition-all hover:scale-105 relative z-10">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            欢迎登录
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            体育活动预约平台
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="username" className="sr-only">用户名</label>
              <input
                id="username"
                name="usernameOrEmail"
                type="text"
                required
                className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="用户名或邮箱"
                value={formData.usernameOrEmail}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="relative">
              <label htmlFor="password" className="sr-only">密码</label>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="密码"
                value={formData.password}
                onChange={handleInputChange}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                ) : (
                  <EyeIcon className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="rememberMe"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                checked={formData.rememberMe}
                onChange={handleInputChange}
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                记住我
              </label>
            </div>

            <div className="text-sm">
              <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
                忘记密码？
              </a>
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {isLoading ? (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : '登录'}
            </button>

            <button
              type="button"
              onClick={handleRegister}
              className="group relative w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
            >
              注册新账号
            </button>
          </div>
        </form>
      </div>
      <ToastContainer position="top-center" />
    </div>
  );
}
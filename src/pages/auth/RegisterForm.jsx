import { useState } from 'react'
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import bgImage from '/src/assets/background.png'

export default function RegisterForm() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    role: 'user' // 新增角色选择，默认普通用户
    })
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    const validatePassword = (password) => {
      // 验证密码至少8位且包含字母和数字
      const minLength = password.length >= 8
      const hasLetter = /[a-zA-Z]/.test(password)
      const hasNumber = /[0-9]/.test(password)
      return minLength && hasLetter && hasNumber
    }

    const handleInputChange = (e) => {
      const { name, value } = e.target
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
      setError('')
      setSuccess('')
    }

    const handleSubmit = async (e) => {
      e.preventDefault()
  
      // 表单验证
      if (!formData.username || !formData.password || !formData.confirmPassword) {
        toast.error('请填写所有字段', { autoClose: 3000 })
        return
      }
  
      if (formData.password !== formData.confirmPassword) {
        toast.error('密码不一致', { autoClose: 3000 })
        return
      }
  
      if (!validatePassword(formData.password)) {
        toast.error('密码必须至少8位且包含字母和数字', { autoClose: 3000 })
        return
      }
  
      setIsLoading(true)
      try {
        // 模拟注册请求
        console.log('注册信息：', formData)
        await new Promise(resolve => setTimeout(resolve, 1500))

        // 获取现有用户或创建新对象
        const existingUsers = JSON.parse(localStorage.getItem('users') || '{}');
        // 添加新用户
        existingUsers[formData.username] = {
          password: formData.password,
          role: formData.role
        };
        // 保存用户数据到localStorage
        localStorage.setItem('users', JSON.stringify(existingUsers));

        // 存储当前用户角色
        localStorage.setItem('userRole', formData.role)

        // 注册成功提示
        toast.success('注册成功，即将跳转到登录页面...', { autoClose: 3000 })
        // 2秒后跳转到登录页
        setTimeout(() => {
          navigate('/login')
        }, 2000)
      } catch {
        toast.error('注册失败，请重试', { autoClose: 3000 })
      } finally {
        setIsLoading(false)
      }
    }

    const handleLogin = () => {
      navigate('/login')
    }

    return (
      <div 
        className="min-h-screen flex items-center justify-center relative"
        style={
          {
            backgroundImage: `url(${bgImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }
        }
      >
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"></div>

        <div className="max-w-md w-full space-y-8 p-8 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg transform transition-all hover:scale-105 relative z-10">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              创建账号
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
                  name="username"
                  type="text"
                  required
                  className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="用户名"
                  value={formData.username}
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
                  placeholder="密码 (至少8位且包含字母和数字)"
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

              <div className="relative">
                <label htmlFor="confirmPassword" className="sr-only">确认密码</label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="确认密码"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div className="relative">

              {/* 新增角色选择 */}
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700">角色</label>
                <select
                  id="role"
                  name="role"
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  value={formData.role}
                  onChange={handleInputChange}
                >
                  <option value="user">普通用户</option>
                  <option value="admin">管理员</option>
                </select>
              </div>
            </div>

            <ToastContainer />

            <div className="space-y-3">
              <button
                type="submit"
                disabled={isLoading || success}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {isLoading ? (
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : '注册'}
              </button>

              <button
                type="button"
                onClick={handleLogin}
                className="group relative w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              >
                已有账号？登录
              </button>
            </div>
          </form>
        </div>
      </div>
    )
}
import axios from 'axios';

// 配置axios实例
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

// 请求拦截器，自动添加token和禁用缓存
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // 禁用缓存的请求头
    config.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
    config.headers['Pragma'] = 'no-cache';
    config.headers['Expires'] = '0';
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器，统一处理响应
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response?.status === 401) {
      // 对于报名相关操作，不自动跳转，让调用方处理
      const skipAutoRedirect = error.config?.url?.includes('/registrations/') && 
                              (error.config?.method === 'delete' || error.config?.method === 'post' || error.config?.method === 'put');
      
      if (!skipAutoRedirect) {
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// 用户相关API
export const userApi = {
  // 用户注册
  register: (userData) => api.post('/users/register', userData),
  
  // 用户登录
  login: (loginData) => api.post('/users/login', loginData),
  
  // 获取当前用户信息
  getCurrentUser: () => api.get('/users/me'),
  
  // 更新当前用户信息
  updateCurrentUser: (updateData) => api.put('/users/me', updateData),
  
  // 根据ID获取用户信息
  getUserById: (id) => api.get(`/users/${id}`),
};

// 活动相关API
export const activityApi = {
  // 获取活动列表
  getActivities: (params = {}) => api.get('/activities', { params }),
  
  // 获取活动详情
  getActivityDetail: (id) => api.get(`/activities/${id}`),
  
  // 创建活动（管理员）
  createActivity: (activityData) => api.post('/activities', activityData),
  
  // 更新活动（管理员）
  updateActivity: (id, activityData) => api.put(`/activities/${id}`, activityData),
  
  // 删除活动（管理员）
  deleteActivity: (id) => api.delete(`/activities/${id}`),
  
  // 创建活动评论
  createComment: (activityId, commentData) => 
    api.post(`/activities/${activityId}/comments`, commentData),
};

// 活动报名相关API
export const registrationApi = {
  // 创建活动报名
  createRegistration: (registrationData) => 
    api.post('/registrations', registrationData),
  
  // 获取我的报名记录
  getMyRegistrations: (params = {}) => 
    api.get('/registrations/my', { params }),
  
  // 获取活动的报名列表（管理员）
  getActivityRegistrations: (activityId, params = {}) => 
    api.get(`/registrations/activity/${activityId}`, { params }),
  
  // 更新报名状态（管理员）
  updateRegistrationStatus: (registrationId, statusData) => 
    api.put(`/registrations/${registrationId}/status`, statusData),
  
  // 更新报名信息（管理员）
  updateRegistration: (activityId, updateData) => 
    api.put(`/registrations/activity/${activityId}`, updateData),
  

  
  // 删除报名记录
  deleteRegistration: (registrationId) => 
    api.delete(`/registrations/${registrationId}/delete`),
  
  // 获取报名详情
  getRegistrationById: (id) => api.get(`/registrations/${id}`),
};

export default api;
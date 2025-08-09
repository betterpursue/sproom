import React, { useState, useEffect } from 'react';
import { userApi } from '../../services/api';
import bgImage from '/src/assets/background.png';

const UserProfile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    realName: '',
    phone: '',
    avatar: ''
  });

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      setLoading(true);
      const response = await userApi.getCurrentUser();
      const userData = response.data || response;
      setUser(userData);
      setFormData({
        username: userData.username || '',
        email: userData.email || '',
        realName: userData.realName || '',
        phone: userData.phone || '',
        avatar: userData.avatar || ''
      });
    } catch (error) {
      alert('获取用户信息失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const updateData = {
        realName: formData.realName,
        phone: formData.phone,
        avatar: formData.avatar,
      };
      const updatedUser = await userApi.updateCurrentUser(updateData);
      setUser(updatedUser);
      alert('个人信息更新成功');
      console.log('Updated user data:', updatedUser);
    } catch (error) {
      alert('更新失败：' + (error.response?.data?.message || error.message));
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading) {
    return <div className="flex justify-center items-center h-96">加载中...</div>;
  }

  return (
    <div 
      className="min-h-screen py-8 bg-cover bg-center bg-fixed"
      style={{ backgroundImage: `linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 51, 234, 0.1) 100%), url(${bgImage})` }}
    >
      <div className="max-w-2xl mx-auto">
        <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">个人信息</h2>
            <button
              onClick={() => window.history.back()}
              className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
            >
              返回
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">头像</label>
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                  {formData.avatar && formData.avatar !== 'null' && formData.avatar !== '' ? (
                    <img src={formData.avatar} alt="头像" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <span className="text-white text-2xl font-bold">
                      {formData.username ? formData.username.charAt(0).toUpperCase() : 'U'}
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  name="avatar"
                  value={formData.avatar}
                  onChange={handleInputChange}
                  placeholder="头像URL"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">用户名</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">邮箱</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">真实姓名</label>
              <input
                type="text"
                name="realName"
                value={formData.realName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="请输入真实姓名"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">手机号</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="请输入手机号"
                pattern="^1[3-9]\d{9}$"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {submitting ? '更新中...' : '更新信息'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
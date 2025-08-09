import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { registrationApi } from '../../services/api';

const RegistrationManagement = ({ activities }) => {
  const [registrations, setRegistrations] = useState([]);
  const [selectedActivity, setSelectedActivity] = useState('');
  const [loading, setLoading] = useState(false);

  // 报名状态映射
  const statusMap = {
    PENDING: '待确认',
    CONFIRMED: '已确认'
  };

  // 状态颜色映射
  const statusColors = {
    PENDING: 'text-yellow-600 bg-yellow-100',
    CONFIRMED: 'text-green-600 bg-green-100'
  };

  // 加载报名信息
  const loadRegistrations = async (activityId) => {
    if (!activityId) return;
    
    setLoading(true);
    try {
      const response = await registrationApi.getActivityRegistrations(activityId);
      setRegistrations(response.registrations || []);
    } catch (error) {
      console.error('Failed to load registrations:', error);
      toast.error('加载报名信息失败');
    } finally {
      setLoading(false);
    }
  };

  // 处理活动选择变化
  const handleActivityChange = (activityId) => {
    setSelectedActivity(activityId);
    loadRegistrations(activityId);
  };

  // 更新报名状态
  const handleStatusUpdate = async (registrationId, newStatus) => {
    try {
      await registrationApi.updateRegistrationStatus(registrationId, { status: newStatus });
      
      // 更新本地状态
      setRegistrations(prev => 
        prev.map(reg => 
          reg.id === registrationId ? { ...reg, status: newStatus } : reg
        )
      );
      
      toast.success('状态更新成功');
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error('状态更新失败');
    }
  };

  // 删除报名记录
  const handleDeleteRegistration = async (registrationId) => {
    if (!window.confirm('确定要删除这条报名记录吗？此操作不可恢复。')) {
      return;
    }

    try {
      await registrationApi.deleteRegistration(registrationId);
      
      // 从本地状态中移除
      setRegistrations(prev => prev.filter(reg => reg.id !== registrationId));
      
      toast.success('报名记录删除成功');
    } catch (error) {
      console.error('Failed to delete registration:', error);
      toast.error('删除失败：' + (error.response?.data?.message || '未知错误'));
    }
  };

  // 获取用户信息显示
  const getUserDisplay = (user) => {
    if (!user) return '未知用户';
    return user.nickname || user.username || '未知用户';
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">活动订单管理</h2>
      
      {/* 活动选择下拉框 */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          选择活动
        </label>
        <select
          value={selectedActivity}
          onChange={(e) => handleActivityChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">请选择活动</option>
          {activities.map(activity => (
            <option key={activity.id} value={activity.id}>
              {activity.name} ({activity.startTime ? new Date(activity.startTime).toLocaleDateString('zh-CN') : '无日期'})
            </option>
          ))}
        </select>
      </div>

      {/* 报名信息列表 */}
      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">加载中...</p>
        </div>
      ) : selectedActivity && registrations.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">该活动暂无报名信息</p>
        </div>
      ) : selectedActivity && registrations.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  用户
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  手机号
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  邮箱
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  真实姓名
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态管理
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {registrations.map((registration) => (
                <tr key={registration.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {getUserDisplay(registration.user)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {registration.user?.phone || '无手机号'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {registration.user?.email || '无邮箱'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {registration.user?.realName || '未填写'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[registration.status]}`}>
                      {statusMap[registration.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <select
                      value={registration.status}
                      onChange={(e) => handleStatusUpdate(registration.id, e.target.value)}
                      className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="PENDING">待确认</option>
                      <option value="CONFIRMED">已确认</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleDeleteRegistration(registration.id)}
                      className="text-red-600 hover:text-red-900 font-medium"
                      title="删除报名记录"
                    >
                      删除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500">请先选择一个活动</p>
        </div>
      )}
    </div>
  );
};

export default RegistrationManagement;
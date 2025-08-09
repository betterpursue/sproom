import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import bgImage from '/src/assets/activityManage.png';
import { v4 as uuidv4 } from 'uuid';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import CreateActivity from './CreateActivity';
import ActivityList from './ActivityList';
import RegistrationManagement from './RegistrationManagement';
import { activityApi } from '../../services/api';

const ActivityManagement = () => {
  const [activities, setActivities] = useState([]);
  const [activeView, setActiveView] = useState('activities'); // 'activities' or 'registrations'
  const navigate = useNavigate();

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    try {
      const response = await activityApi.getActivities();
      // 后端返回格式: { activities: [...], total: number }
      // 映射后端字段到前端使用的字段名
      const mappedActivities = (response.activities || []).map(activity => ({
        id: activity.id,
        name: activity.title, // 后端使用title，前端使用name
        location: activity.location,
        startTime: activity.startTime,
        endTime: activity.endTime,
        description: activity.description,
        image: activity.imageUrl, // 后端使用imageUrl，前端使用image
        maxParticipants: activity.maxParticipants,
        currentParticipants: activity.currentParticipants,
        status: activity.status
      }));
      setActivities(mappedActivities);
    } catch (error) {
      console.error('Failed to load activities:', error);
      toast.error('加载活动列表失败');
    }
  };

  const handleActivityCreate = async (newActivity) => {
    try {
      const createdActivity = await activityApi.createActivity(newActivity);
      
      // 将后端返回的活动映射到前端格式
      const mappedActivity = {
        id: createdActivity.id,
        name: createdActivity.title,
        location: createdActivity.location,
        startTime: createdActivity.startTime,
        endTime: createdActivity.endTime,
        description: createdActivity.description,
        image: createdActivity.imageUrl,
        maxParticipants: createdActivity.maxParticipants,
        currentParticipants: createdActivity.currentParticipants || 0,
        status: createdActivity.status
      };
      
      setActivities([...activities, mappedActivity]);
      toast.success('活动创建成功');
    } catch (error) {
      console.error('Failed to create activity:', error);
      
      // 显示更详细的错误信息
      if (error.response?.data?.message) {
        toast.error(`创建活动失败: ${error.response.data.message}`);
      } else {
        toast.error('创建活动失败');
      }
    }
  };

  const handleActivityDelete = async (activityId) => {
    try {
      await activityApi.deleteActivity(activityId);
      setActivities(activities.filter(activity => activity.id !== activityId));
      toast.success('活动已成功删除');
    } catch (error) {
      console.error('Failed to delete activity:', error);
      toast.error('删除活动失败');
    }
  };

  const handleLogout = () => {
    // 显示确认弹窗
    if (window.confirm('确定要退出登录吗？')) {
      // 显示退出成功提示
      toast.success('退出成功！');
      
      // 延迟一段时间后执行退出操作
      setTimeout(() => {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('userRole');
        localStorage.removeItem('rememberedUser');
        navigate('/login');
      }, 1500); // 延迟1.5秒
    }
  };

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
      {/* 添加半透明遮罩，提高可读性 */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"></div>
      
      {/* 管理面板容器 */}
      <div className="max-w-4xl w-full p-8 bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl transform transition-all hover:scale-102 relative z-10">
        {/* 退出登录按钮 */}
        <div className="flex justify-end mb-4">
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            退出登录
          </button>
        </div>
        
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-black mb-2">活动管理系统</h1>
          <p className="text-lg text-gray-600">
            {activeView === 'activities' ? '管理所有活动的创建、编辑和删除' : '管理活动的报名信息和修改报名状态'}
          </p>
        </div>
        
        {/* 视图切换按钮 */}
        <div className="flex justify-center mb-6">
          <div className="bg-gray-100 rounded-lg p-1 flex">
            <button
              onClick={() => setActiveView('activities')}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                activeView === 'activities'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              活动管理
            </button>
            <button
              onClick={() => setActiveView('registrations')}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                activeView === 'registrations'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              订单管理
            </button>
          </div>
        </div>
        
        {/* 条件渲染不同视图 */}
        {activeView === 'activities' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <CreateActivity onActivityCreate={handleActivityCreate} />
            </div>
            <div>
              <ActivityList activities={activities} onActivityDelete={handleActivityDelete} />
            </div>
          </div>
        ) : (
          <div>
            <RegistrationManagement activities={activities} />
          </div>
        )}
      </div>
      <ToastContainer position="top-center" />
    </div>
  );
};

export default ActivityManagement;
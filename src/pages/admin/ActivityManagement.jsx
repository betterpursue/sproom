import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import bgImage from '/src/assets/activityManage.png';
import { v4 as uuidv4 } from 'uuid';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import CreateActivity from './CreateActivity';
import ActivityList from './ActivityList';

const ActivityManagement = () => {
  const [activities, setActivities] = useState([
    // 模拟数据
    {
      id: uuidv4(),
      name: '示例活动1',
      location: '示例地点1',
      startTime: '2023-12-01T09:00',
      endTime: '2023-12-01T17:00',
      description: '示例描述1',
      image: ''
    },
    {
      id: uuidv4(),
      name: '示例活动2',
      location: '示例地点2',
      startTime: '2023-12-10T10:00',
      endTime: '2023-12-10T18:00',
      description: '示例描述2',
      image: ''
    }
  ]);
  const navigate = useNavigate();

  useEffect(() => {
    // 从localStorage加载活动数据
    const loadActivities = () => {
      try {
        const savedActivities = localStorage.getItem('activities');
        if (savedActivities) {
          setActivities(JSON.parse(savedActivities));
        } else {
          // 使用默认模拟数据
          setActivities([
            {
              id: uuidv4(),
              name: '示例活动1',
              location: '示例地点1',
              time: '示例时间1',
              description: '示例描述1',
              image: ''
            },
            {
              id: uuidv4(),
              name: '示例活动2',
              location: '示例地点2',
              time: '示例时间2',
              description: '示例描述2',
              image: ''
            }
          ]);
        }
      } catch (error) {
        console.error('Failed to load activities from localStorage:', error);
      }
    };

    loadActivities();
  }, []);

  const handleActivityCreate = (newActivity) => {
    const updatedActivities = [...activities, newActivity];
    setActivities(updatedActivities);
    // 保存到localStorage
    localStorage.setItem('activities', JSON.stringify(updatedActivities));
  };

  const handleActivityDelete = (activityId) => {
    const updatedActivities = activities.filter(activity => activity.id !== activityId);
    setActivities(updatedActivities);
    // 保存到localStorage
    localStorage.setItem('activities', JSON.stringify(updatedActivities));
    toast.success('活动已成功删除');
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
          <p className="text-lg text-gray-600">管理所有活动的创建、编辑和删除</p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-1/2">
            <CreateActivity onActivityCreate={handleActivityCreate} />
          </div>
          <div className="w-full md:w-1/2">
            <ActivityList activities={activities} onActivityDelete={handleActivityDelete} />
          </div>
        </div>
      </div>
      <ToastContainer position="top-center" />
    </div>
  );
};

export default ActivityManagement;
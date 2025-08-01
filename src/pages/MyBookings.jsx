import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import bgImage from '/src/assets/activityManage.png';
import BackButton from '/src/components/BackButton';

// 确保整个页面高度正确并允许滚动，同时固定背景
const GlobalStyle = () => {
  return (
    <style>
      {`
        body {
          height: 100vh;
          overflow: auto;
        }
      `}
    </style>
  );
};

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [allActivities, setAllActivities] = useState([]); // 新增：保存所有活动列表
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const userData = localStorage.getItem('currentUser');
      if (!userData) {
        navigate('/login');
        return;
      }
      
      const user = JSON.parse(userData);
      setCurrentUser(user);
      
      // 1. 先获取所有活动列表，作为“数据源”
      const activities = JSON.parse(localStorage.getItem('activities') || '[]');
      setAllActivities(activities); // 将活动列表存入 state
      const validActivityIds = new Set(activities.map(a => a.id));
      
      // 2. 从localStorage获取用户的报名记录
      const bookingsData = localStorage.getItem(`bookings_${user.username}`);
      if (bookingsData) {
        const allBookings = JSON.parse(bookingsData);
        // 3. 过滤掉已删除的活动
        const validBookings = allBookings.filter(booking => validActivityIds.has(booking.activityId));
        setBookings(validBookings);

        if (validBookings.length !== allBookings.length) {
            localStorage.setItem(`bookings_${user.username}`, JSON.stringify(validBookings));
        }
      }
    } catch (error) {
      console.error('获取用户信息失败:', error);
      localStorage.removeItem('currentUser');
      navigate('/login');
    }
  }, [navigate]);

  const handleCancelBooking = (activityId) => {
    if (window.confirm('确认要取消报名吗？')) {
      const updatedBookings = bookings.filter(booking => booking.activityId !== activityId);
      setBookings(updatedBookings);
      localStorage.setItem(`bookings_${currentUser.username}`, JSON.stringify(updatedBookings));
      
      const updatedActivities = allActivities.map(activity => {
        if (activity.id === activityId && activity.participants) {
          activity.participants = activity.participants.filter(p => p !== currentUser.username);
        }
        return activity;
      });
      setAllActivities(updatedActivities); // 更新 state
      localStorage.setItem('activities', JSON.stringify(updatedActivities));
      
      toast.success('取消报名成功！');
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '未设置';
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('zh-CN', options);
  };

  return (
    <>
      <GlobalStyle />
      <div 
        className="fixed inset-0 -z-10" 
        style={{ backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', backgroundAttachment: 'fixed' }}
      />

      <div className="min-h-screen flex items-start justify-center p-4">
        <div className="bg-white/20 p-8 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto my-8 md:my-12">
          <BackButton backPath="/activity-registration" />
          <h2 className="text-3xl font-bold mb-6 text-center text-white">我的报名</h2>
          
          {bookings.length === 0 ? (
            <div className="text-center text-white/80">
              <p className="text-xl mb-4">暂无报名记录</p>
              <button 
                onClick={() => navigate('/activity-registration')}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                去参加活动
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map(booking => {
                // 关键修改：通过 activityId 查找最新的活动详情
                const activityDetail = allActivities.find(a => a.id === booking.activityId);

                // 如果活动详情找不到（理论上已经被过滤了），则不渲染
                if (!activityDetail) {
                    return null;
                }

                return (
                  <div key={booking.activityId} className="bg-white/90 p-6 rounded-lg shadow-lg">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        {/* 关键修改：从 activityDetail 中获取名称 */}
                        <h3 className="text-xl font-semibold mb-2">{activityDetail.name}</h3>
                        <p className="text-gray-700 mb-1">
                          <strong>报名时间：</strong>{formatDateTime(booking.registrationTime)}
                        </p>
                        <p className="text-gray-700 mb-1">
                          {/* 关键修改：从 activityDetail 中获取时间地点 */}
                          <strong>活动时间：</strong>{formatDateTime(activityDetail.startTime)} - {formatDateTime(activityDetail.endTime)}
                        </p>
                        <p className="text-gray-700 mb-1">
                          <strong>活动地点：</strong>{activityDetail.location}
                        </p>
                        <p className="text-gray-700">
                          <strong>状态：</strong>
                          <span className={`px-2 py-1 rounded text-sm ${
                            booking.status === 'confirmed' ? 'bg-green-100 text-green-800' : 
                            booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                            'bg-red-100 text-red-800'
                          }`}>
                            {booking.status === 'confirmed' ? '已确认' : 
                             booking.status === 'pending' ? '待确认' : '已取消'}
                          </span>
                        </p>
                      </div>
                      <div className="ml-4">
                        <button
                          onClick={() => handleCancelBooking(booking.activityId)}
                          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                          disabled={booking.status === 'cancelled'}
                        >
                          取消报名
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <ToastContainer position="top-center" />
    </>
  );
};

export default MyBookings;

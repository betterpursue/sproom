import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import bgImage from '/src/assets/background.png' ;

const ActivityRegistration = () => {
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentUser, setCurrentUser] = useState(() => {
    // 安全读取currentUser
    const userData = localStorage.getItem('currentUser');
    if (userData) {
      try {
        return JSON.parse(userData);
      } catch (error) {
        console.error('Failed to parse currentUser:', error);
      }
    }
    
    // 如果currentUser解析失败或不存在，尝试读取userRole作为兜底
    const userRole = localStorage.getItem('userRole');
    if (userRole) {
      const rememberedUser = localStorage.getItem('rememberedUser');
      return {
        username: rememberedUser || '用户',
        role: userRole
      };
    }
    
    return null;
  });

  useEffect(() => {
    // 仅在确认未登录时才跳转
    const checkAuth = () => {
      const userData = localStorage.getItem('currentUser');
      const userRole = localStorage.getItem('userRole');
      
      if (!userData && !userRole) {
        navigate('/login');
      }
    };
    
    checkAuth();
    const storedActivities = JSON.parse(localStorage.getItem('activities') || '[]');
    // 过滤掉已删除的活动
    const validActivities = storedActivities.filter(activity => !activity.deleted);
    setActivities(validActivities);
  }, [navigate]);

  const handleViewDetails = (activityId) => {
    navigate(`/activities/${activityId}`);
  };

  const filteredActivities = activities.filter(activity => 
    (activity.title?.toLowerCase() ?? '').includes(searchTerm.toLowerCase()) ||
    (activity.description?.toLowerCase() ?? '').includes(searchTerm.toLowerCase()) ||
    (activity.location?.toLowerCase() ?? '').includes(searchTerm.toLowerCase())
  );

  const handleRegister = (activityId) => {
    const userDataStr = localStorage.getItem('currentUser');
    if (!userDataStr) {
      toast.error('请先登录', { autoClose: 3000 });
      navigate('/login');
      return;
    }
    
    let userData;
    try {
      userData = JSON.parse(userDataStr);
    } catch (error) {
      console.error('Failed to parse user data:', error);
      toast.error('用户数据异常，请重新登录', { autoClose: 3000 });
      navigate('/login');
      return;
    }
    
    if (!userData.username) {
      toast.error('请先登录', { autoClose: 3000 });
      navigate('/login');
      return;
    }

    const targetActivity = activities.find(a => a.id === activityId);
    if (!targetActivity) return;

    // 检查是否已报名
    if (targetActivity.participants && targetActivity.participants.includes(userData.username)) {
      toast.info('您已报名该活动，无需重复报名', { 
        position: "top-center",
        autoClose: 3000 
      });
      return;
    }

    // 检查人数上限
    if (targetActivity.participants && targetActivity.capacity && targetActivity.participants.length >= targetActivity.capacity) {
      toast.error('该活动已达报名人数上限', { 
        position: "top-center",
        autoClose: 3000 
      });
      return;
    }

    const updatedActivities = activities.map(activity => {
      if (activity.id === activityId) {
        return {
          ...activity,
          participants: [...(activity.participants || []), userData.username]
        };
      }
      return activity;
    });

    localStorage.setItem('activities', JSON.stringify(updatedActivities));
    setActivities(updatedActivities);

    // 添加报名记录到用户个人记录
    const bookingRecord = {
      activityId: activityId,
      activityName: targetActivity.title,
      registrationTime: new Date().toISOString(),
      startTime: targetActivity.startTime,
      endTime: targetActivity.endTime,
      location: targetActivity.location,
      status: 'confirmed'
    };

    const userBookingsKey = `bookings_${userData.username}`;
    const existingBookings = JSON.parse(localStorage.getItem(userBookingsKey) || '[]');
    existingBookings.push(bookingRecord);
    localStorage.setItem(userBookingsKey, JSON.stringify(existingBookings));

    toast.success('报名成功！', { 
      position: "top-center",
      autoClose: 3000 
    });
  };

  const handleCancelRegistration = (activityId) => {
    // 添加确认弹窗
    if (!window.confirm('确定要取消报名吗？')) {
      return; // 用户点击取消，不执行取消报名操作
    }
    
    const userDataStr = localStorage.getItem('currentUser');
    if (!userDataStr) {
      toast.error('请先登录', { autoClose: 3000 });
      navigate('/login');
      return;
    }
    
    let userData;
    try {
      userData = JSON.parse(userDataStr);
    } catch (error) {
      console.error('Failed to parse user data:', error);
      toast.error('用户数据异常，请重新登录', { autoClose: 3000 });
      navigate('/login');
      return;
    }
    
    if (!userData.username) {
      toast.error('请先登录', { autoClose: 3000 });
      navigate('/login');
      return;
    }

    const targetActivity = activities.find(a => a.id === activityId);
    if (!targetActivity) return;

    // 检查是否已报名
    if (!targetActivity.participants || !targetActivity.participants.includes(userData.username)) {
      toast.info('您尚未报名该活动', { 
        position: "top-center",
        autoClose: 3000 
      });
      return;
    }

    const updatedActivities = activities.map(activity => {
      if (activity.id === activityId) {
        return {
          ...activity,
          participants: activity.participants.filter(participant => participant !== userData.username)
        };
      }
      return activity;
    });

    localStorage.setItem('activities', JSON.stringify(updatedActivities));
    setActivities(updatedActivities);

    // 从用户个人记录中移除报名记录
    const userBookingsKey = `bookings_${userData.username}`;
    const existingBookings = JSON.parse(localStorage.getItem(userBookingsKey) || '[]');
    const updatedBookings = existingBookings.filter(booking => booking.activityId !== activityId);
    localStorage.setItem(userBookingsKey, JSON.stringify(updatedBookings));

    toast.success('取消报名成功！', { 
      position: "top-center",
      autoClose: 3000 
    });
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
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* 背景图 - 固定定位覆盖整个视口 */}
      <div className="fixed inset-0 z-0">
        <img src={bgImage} alt="background" className="w-full h-full object-cover" style={{ backgroundAttachment: 'fixed' }} />
      </div>
      
      {/* 固定顶部区域 */}
      <div className="sticky top-0 z-20 bg-white/20 backdrop-blur-sm py-4 px-4 shadow-md">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h2 className="text-3xl font-bold text-white">活动列表</h2>
          <div className="flex space-x-2">
            <button
              onClick={() => navigate('/my-bookings')}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              我的报名
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              退出登录
            </button>
          </div>
        </div>
      </div>
      
      {/* 可滚动内容区域 */}
      <div className="flex-grow overflow-y-auto relative z-10 pt-6 pb-12">
        <div className="max-w-6xl mx-auto px-4">
          {/* 搜索框 */}
          <div className="mb-6 bg-white/20 py-4 rounded-lg">
            <input
              type="text"
              placeholder="搜索活动名称、描述或地点..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-white/90 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredActivities.map(activity => (
              <div key={activity.id} className="bg-white/90 p-6 rounded-lg shadow-lg">
                <h3 className="text-xl font-semibold mb-2">{activity.name}</h3>
                {activity.image && (
                  <img src={activity.image} alt={activity.name} className="w-full h-48 object-cover rounded-md mb-4"/>
                )}
                <p className="text-gray-700 mb-2">{activity.description}</p>
                <p className="text-gray-600 mb-1">地点: {activity.location}</p>
                <p className="text-gray-600 mb-1">开始: {new Date(activity.startTime).toLocaleString('zh-CN')}</p>
                <p className="text-gray-600 mb-1">结束: {new Date(activity.endTime).toLocaleString('zh-CN')}</p>
                <p className="text-gray-600 mb-2">
                  报名人数: {activity.participants?.length || 0} / {activity.capacity || '无限制'}
                </p>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleViewDetails(activity.id)}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    查看详情
                  </button>
                  <button
                    onClick={() => {
                      if (activity.participants?.includes(currentUser?.username)) {
                        handleCancelRegistration(activity.id);
                      } else {
                        handleRegister(activity.id);
                      }
                    }}
                    className={`flex-1 px-4 py-2 rounded-md transition-colors ${activity.participants?.includes(currentUser?.username) 
                      ? 'bg-yellow-500 hover:bg-yellow-600 text-white' 
                      : activity.capacity && activity.participants?.length >= activity.capacity 
                      ? 'bg-gray-400 cursor-not-allowed text-gray-200' 
                      : 'bg-green-600 hover:bg-green-700 text-white'}`}
                    disabled={!activity.participants?.includes(currentUser?.username) && 
                             activity.capacity && activity.participants?.length >= activity.capacity}
                  >
                    {activity.participants?.includes(currentUser?.username) 
                      ? '取消报名' 
                      : (activity.capacity && activity.participants?.length >= activity.capacity 
                      ? '人数已满' 
                      : '立即报名')}
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          {filteredActivities.length === 0 && (
            <div className="text-center text-white/80">
              <p className="text-xl">
                {searchTerm ? '未找到匹配的活动' : '暂无活动'}
              </p>
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  清空搜索
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      <ToastContainer position="top-center" />
    </div>
  );
};

export default ActivityRegistration;
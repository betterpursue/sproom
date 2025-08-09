import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { activityApi, registrationApi, userApi } from '../services/api';
import bgImage from '/src/assets/background.png';

const ActivityRegistration = () => {
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [myRegistrations, setMyRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);

  const [processingActivities, setProcessingActivities] = useState(new Set());
  const [registrationStatus, setRegistrationStatus] = useState({});
  const refreshTimeoutRef = useRef(null);
  const isRefreshingRef = useRef(false);

  useEffect(() => {
    const initializePage = async () => {
      try {
        setLoading(true);
        
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }
        
        const [userResponse, activitiesResponse, registrationsResponse] = await Promise.all([
          userApi.getCurrentUser(),
          activityApi.getActivities(),
          registrationApi.getMyRegistrations().catch(() => ({ registrations: [] }))
        ]);
        
        const userData = userResponse.data || userResponse;
        setCurrentUser(userData);
        setMyRegistrations(registrationsResponse.registrations || []);
        
        // 映射后端字段到前端使用的字段名
        const mappedActivities = (activitiesResponse.activities || []).map(activity => ({
          id: activity.id,
          title: activity.title, // 后端使用title
          location: activity.location,
          startTime: activity.startTime,
          endTime: activity.endTime,
          description: activity.description,
          imageUrl: activity.imageUrl, // 后端使用imageUrl
          maxParticipants: activity.maxParticipants,
          currentParticipants: activity.currentParticipants,
          status: activity.status
        }));
        
        const validActivities = mappedActivities.filter(activity => 
          activity.status !== 'DELETED'
        );
        setActivities(validActivities);
      } catch (error) {
        console.error('Failed to initialize page:', error);
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        } else {
          toast.error('加载失败，请刷新页面重试');
        }
      } finally {
        setLoading(false);
      }
    };
    
    initializePage();
  }, [navigate]);
useEffect(() => {
  if (currentUser) {
    console.log('Current user updated:', currentUser);
    console.log('Current user avatar updated:', currentUser.avatar);
  }
}, [currentUser]);
  useEffect(() => {
    const statusMap = {};
    
    activities.forEach(activity => {
      const activityId = Number(activity.id);
      const registration = myRegistrations.find(r => {
        const regActivityId = Number(r.activity?.id || r.activityId || r.activity_id);
        return (regActivityId === activityId);
      });
      
      const isRegistered = !!registration;
      
      statusMap[activity.id] = {
        isRegistered,
        isFull: activity.currentParticipants >= activity.maxParticipants,
        status: registration?.status || null
      };
    });
    
    setRegistrationStatus(statusMap);
  }, [myRegistrations, activities]);



  const refreshRegistrationStatus = useCallback(async (showUserMessage = false) => {
    if (!currentUser || isRefreshingRef.current) return;
    
    isRefreshingRef.current = true;
    try {
      const [registrationsResponse, updatedActivitiesResponse] = await Promise.all([
        registrationApi.getMyRegistrations(),
        activityApi.getActivities()
      ]);
      
      const freshRegistrations = registrationsResponse.registrations || [];
      
      // 映射后端字段到前端使用的字段名
      const mappedActivities = (updatedActivitiesResponse.activities || []).map(activity => ({
        id: activity.id,
        title: activity.title,
        location: activity.location,
        startTime: activity.startTime,
        endTime: activity.endTime,
        description: activity.description,
        imageUrl: activity.imageUrl,
        maxParticipants: activity.maxParticipants,
        currentParticipants: activity.currentParticipants,
        status: activity.status
      }));
      
      const freshActivities = mappedActivities.filter(activity => 
        activity.status !== 'CANCELLED' && activity.status !== 'DELETED'
      );
      
      setMyRegistrations(freshRegistrations);
      setActivities(freshActivities);
      
      if (showUserMessage) {
        toast.success('状态已更新');
      }
    } catch (error) {
      console.error('Failed to refresh registration status:', error);
      if (showUserMessage) {
        toast.error('更新失败，请稍后重试');
      }
    } finally {
      isRefreshingRef.current = false;
    }
  }, [currentUser]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && currentUser && !isRefreshingRef.current) {
        // 延迟刷新，避免频繁切换导致的重复请求
        if (refreshTimeoutRef.current) {
          clearTimeout(refreshTimeoutRef.current);
        }
        refreshTimeoutRef.current = setTimeout(() => {
          refreshRegistrationStatus();
        }, 1000);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [currentUser, refreshRegistrationStatus]);

  const handleViewDetails = (activityId) => {
    navigate(`/activities/${activityId}`);
  };

  // 调试方法：输出所有活动的isRegistered状态
  const debugRegistrationStatus = () => {
    console.log('=== 当前所有活动的报名状态 ===');
    activities.forEach(activity => {
      const status = registrationStatus[activity.id];
      console.log(`活动 ${activity.id} (${activity.title}): isRegistered = ${status?.isRegistered}`);
    });
    console.log('=== 我的报名记录 ===');
    console.log(myRegistrations);
  };

  // 在控制台添加全局调试方法
  useEffect(() => {
    window.debugRegistration = debugRegistrationStatus;
    return () => {
      delete window.debugRegistration;
    };
  }, [activities, registrationStatus, myRegistrations]);

  const filteredActivities = activities.filter(activity => 
    (activity.title?.toLowerCase() ?? '').includes(searchTerm.toLowerCase()) ||
    (activity.description?.toLowerCase() ?? '').includes(searchTerm.toLowerCase()) ||
    (activity.location?.toLowerCase() ?? '').includes(searchTerm.toLowerCase())
  );

  const handleRegister = async (activityId) => {
    if (!currentUser) {
      toast.error('请先登录');
      navigate('/login');
      return;
    }

    if (processingActivities.has(activityId)) {
      return;
    }

    const validActivityId = Number(activityId);
    if (isNaN(validActivityId) || validActivityId <= 0) {
      toast.error('活动ID无效');
      return;
    }

    setProcessingActivities(prev => new Set(prev).add(activityId));

    try {
      // 检查当前状态
      const currentStatus = registrationStatus[activityId];
      if (currentStatus?.isRegistered) {
        toast.info('您已报名该活动');
        return;
      }

      // 检查活动状态
      const activity = activities.find(a => a.id === validActivityId);
      if (activity && activity.status !== 'open') {
        let statusMessage = '';
        switch(activity.status) {
          case 'closed':
            statusMessage = '该活动报名已截止，无法报名';
            break;
          case 'cancelled':
            statusMessage = '该活动已取消，无法报名';
            break;
          case 'full':
            statusMessage = '该活动名额已满，无法报名';
            break;
          default:
            statusMessage = '该活动未开放报名';
        }
        toast.error(statusMessage);
        return;
      }

      // 执行报名
      await registrationApi.createRegistration({
        activityId: validActivityId
      });
      
      toast.success('报名成功！');
      
      // 成功后刷新状态
      await refreshRegistrationStatus();
      
    } catch (error) {
      console.error('Registration error:', error);
      let errorMessage = '报名失败，请重试';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 409) {
        errorMessage = '您已报名该活动，请勿重复报名';
      } else if (error.response?.status === 400) {
        errorMessage = '活动名额已满';
      }
      toast.error(errorMessage);
      
      // 发生错误时刷新状态
      await refreshRegistrationStatus();
    } finally {
      setProcessingActivities(prev => {
        const newSet = new Set(prev);
        newSet.delete(activityId);
        return newSet;
      });
    }
  };

  const handleDeleteRegistration = async (activityId) => {
    if (!currentUser) {
      toast.error('请先登录');
      navigate('/login');
      return;
    }

    const validActivityId = Number(activityId);
    if (isNaN(validActivityId) || validActivityId <= 0) {
      toast.error('活动ID无效');
      return;
    }

    // 调试：输出当前isRegistered值
    console.log('当前活动', activityId, '的isRegistered值:', registrationStatus[activityId]?.isRegistered);

    setProcessingActivities(prev => new Set(prev).add(activityId));

    try {
      // 查找对应的报名记录
      const registrationToDelete = myRegistrations.find(r => {
        const regActivityId = Number(r.activity?.id || r.activityId || r.activity_id);
        return regActivityId === validActivityId;
      });
  
      if (!registrationToDelete) {
        toast.info('您尚未报名该活动');
        return;
      }
  
      // 检查报名状态 - 已确认的状态不能取消
      if (registrationToDelete.status === 'CONFIRMED') {
        toast.error('报名信息已确认，无法取消报名');
        setProcessingActivities(prev => {
          const newSet = new Set(prev);
          newSet.delete(activityId);
          return newSet;
        });
        return;
      }
  
      // 验证权限
      const registrationUserId = Number(registrationToDelete.user?.id || registrationToDelete.user_id);
      const currentUserId = Number(currentUser?.id);
      
      if (registrationUserId !== currentUserId) {
        toast.error('您只能删除自己的报名记录');
        return;
      }

      // 确认删除
      if (!window.confirm('确定要取消报名吗？')) {
        setProcessingActivities(prev => {
          const newSet = new Set(prev);
          newSet.delete(activityId);
          return newSet;
        });
        return;
      }
  
      // 执行删除报名记录
      console.log('删除报名前 - myRegistrations:', myRegistrations);
      await registrationApi.deleteRegistration(registrationToDelete.id);
      
      // 立即从本地状态中移除该报名记录
      setMyRegistrations(prev => 
        prev.filter(reg => reg.id !== registrationToDelete.id)
      );
      
      // 刷新活动列表和状态
      await refreshRegistrationStatus();
      
      console.log('删除报名后 - myRegistrations:', myRegistrations);
      console.log('registrationStatus:', registrationStatus);
      
      toast.success('删除报名记录成功！');
      
      
    } catch (error) {
      console.error('Delete registration error:', error);
      
      // 在handleDeleteRegistration的catch块中
      let errorMessage = '删除报名记录失败，请重试';
      
      // 优先处理错误消息
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 401) {
        errorMessage = '登录状态异常，请重新登录后重试';
        setTimeout(() => {
          localStorage.removeItem('token');
          navigate('/login');
        }, 2000);
      } else if (error.response?.status === 403) {
        errorMessage = '您只能删除自己创建的报名记录';
      } else if (error.response?.status === 404) {
        errorMessage = '未找到对应的报名记录';
      }
      
      toast.error(errorMessage);
      
      // 发生错误时刷新状态（与立即报名按钮保持一致）
      await refreshRegistrationStatus();
    } finally {
      setProcessingActivities(prev => {
        const newSet = new Set(prev);
        newSet.delete(activityId);
        return newSet;
      });
    }
  };

  const handleLogout = () => {
    // 显示确认弹窗
    if (window.confirm('确定要退出登录吗？')) {
      // 显示退出成功提示
      toast.success('退出成功！');
      
      // 延迟一段时间后执行退出操作
      setTimeout(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        navigate('/login');
      }, 1500); // 延迟1.5秒
    }
  };



  return (
    <>
      <style>
        {`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .group:hover .group-hover:opacity-100 {
          opacity: 1;
        }
        .group:hover .group-hover:visible {
          visibility: visible;
        }
        .group:hover .group-hover:translate-y-0 {
          transform: translateY(0);
        }
      `}
      </style>
      <div className="min-h-screen flex flex-col bg-gray-100">
        {/* 背景图 - 固定定位覆盖整个视口 */}
        <div className="fixed inset-0 z-0">
          <img src={bgImage} alt="background" className="w-full h-full object-cover" style={{ backgroundAttachment: 'fixed' }} />
        </div>
        
        {/* 固定顶部区域 */}
        <div className="sticky top-0 z-20 bg-white/20 backdrop-blur-sm py-4 px-4 shadow-md">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <h2 className="text-3xl font-bold text-white flex-1 text-center">活动列表</h2>
            <div className="flex items-center space-x-4">
              <div className="flex-1 relative hidden sm:block">
                <input
                  type="text"
                  placeholder="搜索活动标题或描述..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 pl-10 rounded-md bg-white/90 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <button
                onClick={() => refreshRegistrationStatus(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                disabled={isRefreshingRef.current}
              >
                {isRefreshingRef.current ? (
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                )}
                刷新状态
              </button>
              
              {/* 头像悬停菜单 */}
<div className="relative group">
  <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center border-2 border-white shadow-lg" title={`用户: ${currentUser?.username || '未知'}`}>
    {!currentUser || loading ? (
      // 加载中状态
      <span className="text-gray-600 font-bold text-lg">?</span>
    ) : currentUser?.avatar ? (
      <img 
        src={currentUser.avatar} 
        alt={currentUser.username || '用户头像'}
        className="w-full h-full object-cover"
        onError={(e) => {
          console.log('Avatar image failed to load, falling back to text');
          e.target.style.display = 'none';
          e.target.parentElement.innerHTML = `<span class="text-white font-bold text-lg">${currentUser.username ? currentUser.username.charAt(0).toUpperCase() : 'U'}</span>`;
          e.target.parentElement.className = "w-10 h-10 rounded-full overflow-hidden bg-blue-500 flex items-center justify-center border-2 border-white shadow-lg";
        }}
        onLoad={(e) => {
          console.log('Avatar image loaded successfully');
        }}
      />
    ) : (
      <span className="text-white font-bold text-lg">{currentUser.username ? currentUser.username.charAt(0).toUpperCase() : 'U'}</span>
    )}
  </div>
                
                {/* 悬停菜单 */}
                <div className="absolute right-0 top-12 w-48 bg-white rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-2 group-hover:translate-y-0">
                  <div className="py-2 max-h-64 overflow-y-auto">
                    <div className="px-4 py-2 border-b border-gray-200">
                      <p className="text-sm font-semibold text-gray-800">{currentUser?.username || '用户'}</p>
                      <p className="text-xs text-gray-500">{currentUser?.email || ''}</p>
                    </div>
                    
                    <button
                      onClick={() => {
                        const token = localStorage.getItem('token');
                        if (!token) {
                          navigate('/login');
                          return;
                        }
                        navigate('/profile');
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      个人信息
                    </button>
                    
                    <button
                      onClick={() => {
                        const token = localStorage.getItem('token');
                        if (!token) {
                          navigate('/login');
                          return;
                        }
                        navigate('/my-bookings');
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      我的报名
                    </button>
                    
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      退出登录
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      
      {/* 可滚动内容区域 */}
      <div className="flex-grow overflow-y-auto relative z-10 pt-6 pb-12">
        <div className="max-w-6xl mx-auto px-4">
          {/* 搜索框 - 移动端显示 */}
          <div className="mb-6 bg-white/20 py-4 rounded-lg sm:hidden">
            <div className="relative">
              <input
                type="text"
                placeholder="搜索活动名称、描述或地点..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 pl-10 rounded-lg bg-white/90 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="bg-white/90 p-6 rounded-lg shadow-lg animate-pulse">
                  <div className="h-6 bg-gray-300 rounded mb-2"></div>
                  <div className="h-48 bg-gray-300 rounded-md mb-4"></div>
                  <div className="h-4 bg-gray-300 rounded mb-2"></div>
                  <div className="h-4 bg-gray-300 rounded mb-1"></div>
                  <div className="h-4 bg-gray-300 rounded mb-1"></div>
                  <div className="h-4 bg-gray-300 rounded mb-2"></div>
                  <div className="flex space-x-2">
                    <div className="flex-1 h-10 bg-gray-300 rounded"></div>
                    <div className="flex-1 h-10 bg-gray-300 rounded"></div>
                  </div>
                </div>
              ))
            ) : filteredActivities.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-600 text-lg">
                  {searchTerm ? '没有找到匹配的活动' : '暂无活动'}
                </p>
              </div>
            ) : (
              filteredActivities.map(activity => (
                <div key={activity.id} className="bg-white/90 p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
                  <h3 className="text-xl font-semibold mb-2">{activity.title}</h3>
                  {activity.imageUrl && (
                    <img src={activity.imageUrl} alt={activity.title} className="w-full h-48 object-cover rounded-md mb-4"/>
                  )}
                  <p className="text-gray-700 mb-2 line-clamp-2">{activity.description}</p>
                  <p className="text-gray-600 mb-1"><span className="font-medium">地点:</span> {activity.location}</p>
                  <p className="text-gray-600 mb-1"><span className="font-medium">开始:</span> {new Date(activity.startTime).toLocaleString('zh-CN')}</p>
                  <p className="text-gray-600 mb-1"><span className="font-medium">结束:</span> {new Date(activity.endTime).toLocaleString('zh-CN')}</p>
                  <p className="text-gray-600 mb-1">
                  <span className="font-medium">报名人数:</span> {activity.currentParticipants || 0} / {activity.maxParticipants || '无限制'}
                </p>
                <p className="text-gray-600 mb-1">
                  <span className="font-medium">活动状态:</span>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ml-1 ${
                    activity.status === 'open' ? 'bg-green-100 text-green-800' :
                    activity.status === 'full' ? 'bg-red-100 text-red-800' :
                    activity.status === 'closed' ? 'bg-gray-100 text-gray-800' :
                    activity.status === 'cancelled' ? 'bg-orange-100 text-orange-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {activity.status === 'open' ? '开放报名' :
                     activity.status === 'full' ? '名额已满' :
                     activity.status === 'closed' ? '报名截止' :
                     activity.status === 'cancelled' ? '已取消' :
                     '待发布'}
                  </span>
                </p>
                {registrationStatus[activity.id]?.isRegistered && (
                  <p className="text-gray-600 mb-2">
                    <span className="font-medium">报名状态:</span>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ml-1 ${
                      registrationStatus[activity.id]?.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                      registrationStatus[activity.id]?.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {registrationStatus[activity.id]?.status === 'CONFIRMED' ? '已确认' :
                       registrationStatus[activity.id]?.status === 'PENDING' ? '待确认' :
                       '已报名'}
                    </span>
                  </p>
                )}
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleViewDetails(activity.id)}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                    >
                      查看详情
                    </button>
                    <button
                      onClick={() => {
                        if (processingActivities.has(activity.id)) return;
                        
                        const status = registrationStatus[activity.id];
                        if (status?.isRegistered) {
                          handleDeleteRegistration(activity.id);
                        } else {
                          handleRegister(activity.id);
                        }
                      }}
                      disabled={processingActivities.has(activity.id) || (registrationStatus[activity.id]?.isRegistered && registrationStatus[activity.id]?.status === 'CONFIRMED')}
                      title={registrationStatus[activity.id]?.isRegistered && registrationStatus[activity.id]?.status === 'CONFIRMED' ? '报名信息已确认，无法取消' : ''}
                      className={`flex-1 px-4 py-2 rounded-md transition-colors text-sm font-medium ${
                        processingActivities.has(activity.id)
                          ? 'bg-gray-400 text-white cursor-not-allowed'
                          : registrationStatus[activity.id]?.isRegistered
                          ? registrationStatus[activity.id]?.status === 'CONFIRMED' 
                            ? 'bg-gray-400 text-white cursor-not-allowed'
                            : 'bg-red-600 text-white hover:bg-red-700'
                          : registrationStatus[activity.id]?.isFull
                          ? 'bg-gray-400 text-white cursor-not-allowed'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      {processingActivities.has(activity.id) ? '处理中...' :
                        registrationStatus[activity.id]?.isRegistered ? 
                          registrationStatus[activity.id]?.status === 'CONFIRMED' ? '已确认无法取消' : '取消报名' :
                        registrationStatus[activity.id]?.isFull ? '名额已满' : '立即报名'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
      <ToastContainer position="top-center" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
    </>
  );
};

export default ActivityRegistration;
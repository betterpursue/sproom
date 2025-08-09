import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { registrationApi, activityApi, userApi } from '../services/api';
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
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      
      const userData = localStorage.getItem('currentUser');
      if (userData) {
        try {
          const user = JSON.parse(userData);
          setCurrentUser(user);
        } catch (parseError) {
          console.error('解析用户信息失败:', parseError);
          localStorage.removeItem('currentUser');
          // 继续执行，不影响页面加载
        }
      }
      
      loadBookings();
    } catch (error) {
      console.error('获取用户信息失败:', error);
      localStorage.removeItem('currentUser');
      localStorage.removeItem('token');
      navigate('/login');
    }
  }, [navigate]);

  // 添加全局调试方法
  useEffect(() => {
    window.debugMyBookings = () => {
      console.log('=== MyBookings 调试信息 ===');
      console.log('当前bookings状态:', bookings);
      console.log('当前用户token:', localStorage.getItem('token'));
      console.log('当前currentUser:', currentUser);
      console.log('浏览器本地存储:', {
        token: localStorage.getItem('token'),
        currentUser: localStorage.getItem('currentUser'),
        userRole: localStorage.getItem('userRole')
      });
      
      // 重新加载数据
      loadBookings();
    };
    
    return () => {
      delete window.debugMyBookings;
    };
  }, [bookings, currentUser]);

  const loadBookings = async () => {
    try {
      console.log('开始加载报名记录...');
      
      // 获取当前用户信息
      const userResponse = await userApi.getCurrentUser().catch(() => null);
      console.log('当前用户信息:', userResponse);
      
      // 调用API获取报名记录（不传递userId，让后端从token解析）
      const response = await registrationApi.getMyRegistrations();
      console.log('API原始响应:', response);
      
      // 根据API响应格式获取正确的数据
      const registrations = response.registrations || response.data || response || [];
      console.log('解析后的报名记录:', registrations);
      console.log('报名记录数量:', registrations.length);
      
      if (registrations.length === 0) {
        console.log('该用户暂无报名记录');
        // 添加调试：检查是否真的没有报名记录
        console.log('检查当前用户token:', localStorage.getItem('token'));
      }
      
      // 获取对应的活动详情
      const enrichedBookings = await Promise.all(
        registrations.map(async (registration) => {
          try {
            console.log('处理单个报名记录:', registration);
            const activityId = registration.activityId || registration.activity?.id || registration.activity_id;
            if (!activityId) {
              console.warn('报名记录缺少activityId:', registration);
              return { ...registration, activityDetails: null };
            }
            
            console.log('获取活动详情，activityId:', activityId);
            const activityResponse = await activityApi.getActivityDetail(activityId);
            console.log('活动详情响应:', activityResponse);
            
            return {
              ...registration,
              activityDetails: activityResponse.data || activityResponse
            };
          } catch (error) {
            console.error('Failed to load activity details:', error);
            return {
              ...registration,
              activityDetails: null
            };
          }
        })
      );
      
      console.log('最终处理后的报名记录:', enrichedBookings);
      setBookings(enrichedBookings);
    } catch (error) {
      console.error('Failed to load bookings:', error);
      console.error('错误详情:', error.response?.data, error.response?.status);
      toast.error('加载报名记录失败');
    }
  };

  const handleCancelBooking = async (registrationId) => {
    if (window.confirm('确认要取消报名吗？')) {
      try {
        await registrationApi.deleteRegistration(registrationId);
        toast.success('取消报名成功！');
        // 重新加载报名记录
        loadBookings();
      } catch (error) {
        console.error('Failed to cancel booking:', error);
        const errorMessage = error.response?.data?.message || error.message || '取消报名失败';
        toast.error(errorMessage);
      }
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '未设置';
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('zh-CN', options);
  };

  // 添加调试方法
  const debugMyBookings = () => {
    console.log('=== 我的报名调试信息 ===');
    console.log('原始报名记录:', bookings);
    bookings.forEach((booking, index) => {
      console.log(`报名记录 ${index + 1}:`, {
        id: booking.id,
        status: booking.status,
        activityId: booking.activityId || booking.activity?.id || booking.activity_id,
        activityName: booking.activityDetails?.name,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt
      });
    });
    console.log('=== 调试信息结束 ===');
  };

  // 在控制台添加全局调试方法
  useEffect(() => {
    window.debugMyBookings = debugMyBookings;
    return () => {
      delete window.debugMyBookings;
    };
  }, [bookings]);

  return (
    <div>
      <GlobalStyle />
      <div 
        className="fixed inset-0 -z-10" 
        style={{ backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', backgroundAttachment: 'fixed' }}
      />

      <div className="min-h-screen flex items-start justify-center p-4">
        <div className="bg-white/20 p-8 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto my-8 md:my-12">
          <BackButton backPath="/activity-registration" />
          <h2 className="text-3xl font-bold mb-6 text-center text-white">我的报名</h2>
          <div className="text-center mb-4">
            <button
              onClick={() => navigate('/profile')}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors duration-200 mr-2"
            >
              个人信息
            </button>
          </div>
          <div className="text-center mb-4">
            <button
              onClick={loadBookings}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              刷新报名记录
            </button>
          </div>
          
          {bookings.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📋</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">暂无报名记录</h3>
              <p className="text-gray-600 mb-4">您还没有报名任何活动，或数据加载中</p>
              <p className="text-sm text-gray-500 mb-4">
                如果确认已报名活动但未显示，请按F12打开控制台，输入 <code className="bg-gray-200 px-1 rounded">debugMyBookings()</code> 查看调试信息
              </p>
              <button
                onClick={() => navigate('/activity-registration')}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mr-4"
              >
                去报名活动
              </button>
              <button
                onClick={loadBookings}
                className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                重新加载
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map(booking => {
                const activityDetail = booking.activityDetails;

                // 如果活动详情找不到，则不渲染
                if (!activityDetail) {
                    return null;
                }

                // 在bookings.map中修复状态显示逻辑
                return (
                  <div key={booking.id || booking.activityId} className="bg-white/95 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="flex-1">
                        {/* 活动图片和标题区域 */}
                        <div className="flex items-start gap-4 mb-3">
                          {activityDetail.imageUrl && (
                            <img 
                              src={activityDetail.imageUrl} 
                              alt={activityDetail.name}
                              className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          )}
                          <div className="flex-1">
                            <h3 className="text-2xl font-bold text-gray-900">{activityDetail.name}</h3>
                            <div className="flex gap-2 mt-2">
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' : 
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {booking.status === 'CONFIRMED' ? '已确认' : '待确认'}
                              </span>
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                activityDetail.type === 'workshop' ? 'bg-blue-100 text-blue-800' :
                                activityDetail.type === 'seminar' ? 'bg-purple-100 text-purple-800' :
                                activityDetail.type === 'competition' ? 'bg-orange-100 text-orange-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {activityDetail.type === 'workshop' ? '工作坊' :
                                 activityDetail.type === 'seminar' ? '讲座' :
                                 activityDetail.type === 'competition' ? '比赛' :
                                 activityDetail.type === 'social' ? '社交活动' : '其他'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* 活动描述 */}
                        {activityDetail.description && (
                          <p className="text-gray-600 mb-4 text-sm leading-relaxed line-clamp-2">
                            {activityDetail.description}
                          </p>
                        )}

                        {/* 活动信息卡片 */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <div className="flex items-center text-sm text-gray-700">
                              <span className="mr-2">📅</span>
                              <div>
                                <span className="font-medium">活动时间：</span>
                                <div>{formatDateTime(activityDetail.startTime)}</div>
                                <div>至 {formatDateTime(activityDetail.endTime)}</div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <div className="flex items-center text-sm text-gray-700">
                              <span className="mr-2">📍</span>
                              <div>
                                <span className="font-medium">活动地点：</span>
                                <div>{activityDetail.location}</div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="bg-gray-50 p-3 rounded-lg">
                             <div className="flex items-center text-sm text-gray-700">
                               <span className="mr-2">👥</span>
                               <div>
                                 <span className="font-medium">人数限制：</span>
                                 <div>{activityDetail.maxParticipants || '不限'}</div>
                               </div>
                             </div>
                           </div>
                        </div>

                        {/* 报名信息 */}
                        <div className="border-t pt-3">
                          {booking.notes && (
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">备注：</span>
                              {booking.notes}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* 操作按钮区域 */}
                      <div className="flex flex-col gap-2 md:ml-6">
                        <button
                          onClick={() => navigate(`/activities/${activityDetail.id}`)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm whitespace-nowrap"
                        >
                          查看详情
                        </button>
                        <button
                          onClick={() => handleCancelBooking(booking.id)}
                          disabled={booking.status === 'CONFIRMED'}
                          className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap ${
                            booking.status === 'CONFIRMED'
                              ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                              : 'bg-red-600 text-white hover:bg-red-700 transition-colors'
                          }`}
                          title={booking.status === 'CONFIRMED' ? '报名信息已确认，无法取消' : ''}
                        >
                          {booking.status === 'CONFIRMED' ? '已确认无法取消' : '取消报名'}
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
    </div>
  );
};

export default MyBookings;
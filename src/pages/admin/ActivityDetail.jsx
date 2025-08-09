import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import activityDetailBg from '/src/assets/activityDetail.png';
import BackButton from '/src/components/BackButton';
import ActivityComment from '/src/components/ActivityComment';
import { activityApi, registrationApi, userApi } from '/src/services/api';

// 添加全局样式
const GlobalStyle = () => {
  return (
    <style>
      {
        `
          html, body {
            height: 100%;
            margin: 0;
            padding: 0; // 确保内边距为0
            background-color: transparent; // 确保背景透明 
          }
        `
      }
    </style>
  );
};

const ActivityDetail = () => {
  const formatDateTime = (dateString) => {
    if (!dateString) return '未设置';
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('zh-CN', options);
  };

  const formatDateTimeForInput = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      // 处理时区问题，确保本地时间显示
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch (error) {
      return '';
    }
  };
  const { id } = useParams();
  const [activity, setActivity] = useState(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [comments, setComments] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const user = await userApi.getCurrentUser();
        setCurrentUser(user);
      } catch (error) {
        console.error('获取用户信息失败:', error);
        setCurrentUser(null);
      }
    };
    fetchCurrentUser();
  }, []);
  const isAdmin = currentUser && currentUser.role === 'admin';
  const userRole = currentUser?.role;



  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    // 重置表单为当前活动数据
    setEditForm({
      title: activity.title || activity.name,
      description: activity.description,
      startTime: activity.startTime,
      endTime: activity.endTime,
      location: activity.location,
      capacity: activity.maxParticipants || activity.capacity || '',
      image: activity.imageUrl || activity.image || '',
      status: activity.status || 'open'
    });
  };

  const handleSaveEdit = async () => {
    try {
      // 验证时间数据
      if (!editForm.startTime || !editForm.endTime) {
        toast.error('请设置活动的开始时间和结束时间');
        return;
      }

      const startTime = new Date(editForm.startTime);
      const endTime = new Date(editForm.endTime);
      const now = new Date();

      // 验证时间逻辑 - 允许当前时间后1分钟开始
      console.log('时间验证:', {
        当前时间: now.toISOString(),
        开始时间: startTime.toISOString(),
        结束时间: endTime.toISOString(),
        时间差: startTime.getTime() - now.getTime()
      });
      
      if (startTime <= new Date(now.getTime() - 60000)) {
        toast.error(`开始时间必须晚于当前时间 (${now.toLocaleString()})`);
        return;
      }

      if (endTime <= startTime) {
        toast.error('结束时间必须晚于开始时间');
        return;
      }

      // 准备更新数据
      const updateData = {
        title: editForm.title,
        description: editForm.description,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        location: editForm.location,
        maxParticipants: editForm.capacity ? parseInt(editForm.capacity) : null,
        imageUrl: editForm.image,
        status: editForm.status
      };

      // 调用API更新活动
      const response = await activityApi.updateActivity(id, updateData);
      
      if (response) {
        // 更新当前活动数据
        setActivity(response);
        
        toast.success('活动信息更新成功！', {
          position: "top-center",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
        });
        
        setIsEditing(false);
        
        // 延迟刷新页面以显示最新数据
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        throw new Error('更新失败');
      }
      
    } catch (error) {
      console.error('更新活动信息失败:', error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('更新失败，请重试！');
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        console.log('Fetching activity with id:', id);
        const response = await activityApi.getActivityDetail(id);
        console.log('Activity response:', response);
        
        // 后端API直接返回活动详情对象
        const foundActivity = response;
        
        if (!foundActivity) {
          throw new Error(`Activity with id ${id} not found`);
        }
        
        console.log('Found activity:', foundActivity);
        setActivity(foundActivity);
        setEditForm({
          title: foundActivity.title || foundActivity.name,
          description: foundActivity.description,
          startTime: foundActivity.startTime,
          endTime: foundActivity.endTime,
          location: foundActivity.location,
          capacity: foundActivity.maxParticipants || foundActivity.capacity || '',
          image: foundActivity.imageUrl || foundActivity.image || '',
          status: foundActivity.status || 'open'
        });
      } catch (error) {
        console.error('Failed to fetch activity:', error);
        setActivity({ error: error.message });
      }
    };

    fetchActivity();
  }, [id]);

  useEffect(() => {
    // 如果活动已加载且包含评论数据，使用后端返回的评论
    if (activity && activity.comments) {
      setComments(activity.comments);
    } else {
      // 从localStorage获取评论数据作为备选
      const commentsKey = `comments_${id}`;
      const commentsData = localStorage.getItem(commentsKey);
      if (commentsData) {
        setComments(JSON.parse(commentsData));
      }
    }
  }, [id, activity]);

  if (!activity) {
    return (
      <>
        <GlobalStyle />
        <div className="min-h-screen h-full flex items-center mt-0 justify-center" style={{ backgroundImage: `url(${activityDetailBg})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', backgroundAttachment: 'fixed' }}>
          <div className="bg-transparent">
            <h2 className="text-2xl font-bold mb-4">活动详情</h2>
            <p>加载中...</p>
            <BackButton backPath={userRole === 'admin' ? '/activity-management' : '/activity-registration'} />
          </div>
        </div>
      </>
    );
  }

  if (activity.error) {
    return (
      <>
        <GlobalStyle />
        <div className="min-h-screen h-full flex items-center mt-0 justify-center" style={{ backgroundImage: `url(${activityDetailBg})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', backgroundAttachment: 'fixed' }}>
          <div className="bg-white/90 p-6 rounded-2xl max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-4 text-red-600">加载失败</h2>
            <p className="text-gray-700 mb-4">无法加载活动详情：{activity.error}</p>
            <BackButton backPath={userRole === 'admin' ? '/activity-management' : '/activity-registration'} />
          </div>
        </div>
      </>
    );
  }
  return (
    <>
      <GlobalStyle />
      <div className="min-h-screen h-full flex items-center justify-center" style={{ backgroundImage: `url(${activityDetailBg})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', backgroundAttachment: 'fixed' }}>
        <div className="bg-white/90 p-6 rounded-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="py-4 mb-4 flex justify-between items-center">
            <div>
              <BackButton backPath={userRole === 'admin' ? '/activity-management' : '/activity-registration'} />
              <h2 className="text-2xl font-bold">活动详情 - {activity.title}</h2>
            </div>
            {isAdmin && (
              <button
                onClick={handleEditClick}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                编辑活动
              </button>
            )}
          </div>
          <div className="relative h-64 mb-4 rounded-lg overflow-hidden bg-gray-100">
            {activity.imageUrl ? (
              <img
                src={activity.imageUrl}
                alt={`${activity.name}`}
                className="w-full h-full object-cover transition-opacity duration-300"
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageLoaded(false)}
              />
            ) : (
              <div className="h-full flex items-center justify-center">
                <span>无活动图片</span>
              </div>
            )}
            {activity.imageUrl && !imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/70">
                <span>图片加载中...</span>
              </div>
            )}
            {activity.imageUrl && imageLoaded === false && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/70">
                <img src='/src/assets/placeholder.png' alt='默认图片' className="max-w-[100px]" />
              </div>
            )}
          </div>
          <p><strong>活动描述:</strong> {activity.description}</p>
          <p><strong>开始时间:</strong> {formatDateTime(activity.startTime)}</p>
          <p><strong>结束时间:</strong> {formatDateTime(activity.endTime)}</p>
          <p><strong>活动地点:</strong> {activity.location}</p>
          <p><strong>报名人数:</strong> {activity.currentParticipants || 0} / {activity.maxParticipants || '无限制'}</p>
          <p><strong>活动状态:</strong> 
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

          {/* 报名按钮 - 仅普通用户可见 */}
          {!isAdmin && <RegistrationButton activity={activity} activityId={id} />}

          {/* 活动评论 */}
          <ActivityComment activityId={id} />
        </div>
      </div>
      {isEditing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">编辑活动信息</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">活动名称</label>
                <input
                  type="text"
                  name="title"
                  value={editForm.title}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">活动描述</label>
                <textarea
                  name="description"
                  value={editForm.description}
                  onChange={handleInputChange}
                  rows="4"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">活动地点</label>
                <input
                  type="text"
                  name="location"
                  value={editForm.location}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">开始时间</label>
                <input
                  type="datetime-local"
                  name="startTime"
                  value={formatDateTimeForInput(editForm.startTime)}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">结束时间</label>
                <input
                  type="datetime-local"
                  name="endTime"
                  value={formatDateTimeForInput(editForm.endTime)}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">人数限制</label>
                <input
                  type="number"
                  name="capacity"
                  value={editForm.capacity}
                  onChange={handleInputChange}
                  placeholder="留空表示无限制"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">活动图片URL</label>
                <input
                  type="url"
                  name="image"
                  value={editForm.image}
                  onChange={handleInputChange}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">活动状态</label>
                <select
                  name="status"
                  value={editForm.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="open">开放报名</option>
                  <option value="full">名额已满</option>
                  <option value="closed">报名截止</option>
                  <option value="cancelled">已取消</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={handleCancelEdit}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
      
      <ToastContainer position="top-center" />
    </>
  );
};

const RegistrationButton = ({ activity, activityId }) => {
  const [hasRegistered, setHasRegistered] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkRegistrationStatus = async () => {
      try {
        // 获取当前用户信息
        const user = await userApi.getCurrentUser();
        if (!user) {
          setCurrentUser(null);
          return;
        }
        
        setCurrentUser(user);
        
        // 获取报名记录
        const response = await registrationApi.getMyRegistrations();
        const registrations = Array.isArray(response) ? response : (response.registrations || response.data || []);
        const isRegistered = registrations.some(reg => 
          String(reg.activityId) === String(activityId) || 
          String(reg.activity?.id) === String(activityId)
        );
        setHasRegistered(isRegistered);
      } catch (error) {
        console.error('检查报名状态失败:', error);
        if (error.response?.status === 401) {
          // 用户未登录或登录过期
          setCurrentUser(null);
        }
      }
    };
    
    checkRegistrationStatus();
  }, [activityId]);

  const handleCancelRegistration = async () => {
    try {
      if (!currentUser) {
        toast.error('请先登录！');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
        return;
      }

      if (!window.confirm('确定要取消报名吗？')) {
        return;
      }

      const response = await registrationApi.getMyRegistrations();
      const registrations = Array.isArray(response) ? response : (response.registrations || response.data || []);
      const userRegistration = registrations.find(reg => 
        String(reg.activityId) === String(activityId) || 
        String(reg.activity?.id) === String(activityId)
      );
      
      if (!userRegistration) {
        toast.info('您尚未报名该活动', {
          position: "top-center",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
        });
        return;
      }

      await registrationApi.deleteRegistration(userRegistration.id);

      toast.success('取消报名成功！', {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });

      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('取消报名失败:', error);
      if (error.response?.status === 401) {
        setCurrentUser(null);
        toast.error('登录已过期，请重新登录！');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        toast.error('取消报名失败，请重试！');
      }
    }
  };

  const handleRegistration = async () => {
    try {
      // 先检查当前用户是否已登录
      if (!currentUser) {
        toast.error('请先登录后再报名！');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
        return;
      }

      const response = await registrationApi.getMyRegistrations();
      const registrations = Array.isArray(response) ? response : (response.registrations || response.data || []);
      const existingRegistration = registrations.find(reg => 
        String(reg.activityId) === String(activityId) || 
        String(reg.activity?.id) === String(activityId)
      );
      
      if (existingRegistration) {
        toast.info('您已报名该活动', {
          position: "top-center",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
        });
        return;
      }

      if (activity.currentParticipants >= activity.maxParticipants) {
        toast.info('该活动已达报名人数上限', {
          position: "top-center",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
        });
        return;
      }

      // 检查活动状态
      if (activity.status !== 'open') {
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
        toast.error(statusMessage, {
          position: "top-center",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
        });
        return;
      }

      await registrationApi.createRegistration({
        activityId: activityId
      });

      toast.success('报名成功！', {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });

      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('报名失败:', error);
      if (error.response?.status === 401) {
        // 清除用户信息并跳转到登录
        setCurrentUser(null);
        toast.error('登录已过期，请重新登录！');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else if (error.response?.status === 409) {
        toast.error('您已报名该活动！');
      } else {
        toast.error('报名失败，请重试！');
      }
    }
  };

  if (!currentUser) return null;

  const isFull = activity.maxParticipants && (activity.currentParticipants || 0) >= activity.maxParticipants;
  const isNotOpen = activity.status !== 'open';
  const buttonText = hasRegistered ? '取消报名' : 
    (isNotOpen ? {
      'closed': '报名截止',
      'cancelled': '活动取消',
      'full': '人数已满',
      'draft': '待发布'
    }[activity.status] || '未开放' : 
    (isFull ? '人数已满' : '立即报名'));
  
  const buttonClass = hasRegistered
    ? 'bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded-md transition-colors'
    : (isFull || isNotOpen)
    ? 'bg-gray-400 cursor-not-allowed text-gray-200 px-6 py-2 rounded-md'
    : 'bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md transition-colors';

  const handleClick = hasRegistered ? handleCancelRegistration : handleRegistration;

  return (
    <div className="mt-6">
      <button
        onClick={handleClick}
        className={buttonClass}
        disabled={!hasRegistered && (isFull || isNotOpen)}
      >
        {buttonText}
      </button>
    </div>
  );
};

export default ActivityDetail;
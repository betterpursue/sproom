import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import activityDetailBg from '/src/assets/activityDetail.png';
import BackButton from '/src/components/BackButton';
import ActivityComment from '/src/components/ActivityComment';

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
  const { id } = useParams();
  const [activity, setActivity] = useState(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [comments, setComments] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const navigate = useNavigate();
  let currentUser = null;
  try {
    const userData = localStorage.getItem('currentUser');
    if (userData) {
      currentUser = JSON.parse(userData);
    }
  } catch (error) {
    console.error('Failed to parse currentUser:', error);
  }
  const isAdmin = currentUser && currentUser.role === 'admin';
  const userRole = localStorage.getItem('userRole');

  const handleDeleteComment = (commentId) => {
    if (!window.confirm('确定要删除这条评论吗？')) {
      return;
    }

    const commentsKey = `comments_${id}`;
    const updatedComments = comments.filter(comment => comment.id !== commentId);
    localStorage.setItem(commentsKey, JSON.stringify(updatedComments));
    setComments(updatedComments);

    toast.success('评论删除成功！', {
      position: "top-center",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "light",
    });
  };

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    // 重置表单为当前活动数据
    setEditForm({
      name: activity.name,
      description: activity.description,
      startTime: activity.startTime,
      endTime: activity.endTime,
      location: activity.location,
      capacity: activity.capacity || '',
      image: activity.image || ''
    });
  };

  const handleSaveEdit = () => {
    try {
      const activities = JSON.parse(localStorage.getItem('activities') || '[]');
      const updatedActivities = activities.map(act => {
        if (act.id === id) {
          return {
            ...act,
            name: editForm.name,
            description: editForm.description,
            startTime: editForm.startTime,
            endTime: editForm.endTime,
            location: editForm.location,
            capacity: editForm.capacity ? parseInt(editForm.capacity) : null,
            image: editForm.image
          };
        }
        return act;
      });
      
      localStorage.setItem('activities', JSON.stringify(updatedActivities));
      
      // 更新当前活动数据
      const updatedActivity = updatedActivities.find(act => act.id === id);
      setActivity(updatedActivity);
      
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
      
    } catch (error) {
      console.error('更新活动信息失败:', error);
      toast.error('更新失败，请重试！');
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
        // 从localStorage读取活动数据
        const activitiesJson = localStorage.getItem('activities');
        if (!activitiesJson) {
          throw new Error('No activities found in localStorage');
        }
        const activities = JSON.parse(activitiesJson);
        const foundActivity = activities.find(act => act.id === id);
        if (!foundActivity) {
          throw new Error(`Activity with id ${id} not found`);
        }
        setActivity(foundActivity);
        setEditForm({
          name: foundActivity.name,
          description: foundActivity.description,
          startTime: foundActivity.startTime,
          endTime: foundActivity.endTime,
          location: foundActivity.location,
          capacity: foundActivity.capacity || '',
          image: foundActivity.image || ''
        });
      } catch (error) {
        console.error('Failed to fetch activity:', error);
      }
    };

    fetchActivity();
  }, [id]);

  useEffect(() => {
    // 从localStorage获取评论数据
    const commentsKey = `comments_${id}`;
    const commentsData = localStorage.getItem(commentsKey);
    if (commentsData) {
      setComments(JSON.parse(commentsData));
    }
  }, [id]);

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
  return (
    <>
      <GlobalStyle />
      <div className="min-h-screen h-full flex items-center justify-center" style={{ backgroundImage: `url(${activityDetailBg})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', backgroundAttachment: 'fixed' }}>
        <div className="bg-white/90 p-6 rounded-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="py-4 mb-4 flex justify-between items-center">
            <div>
              <BackButton backPath={userRole === 'admin' ? '/activity-management' : '/activity-registration'} />
              <h2 className="text-2xl font-bold">活动详情 - {activity.name}</h2>
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
            {activity.image ? (
              <img
                src={activity.image}
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
            {activity.image && !imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/70">
                <span>图片加载中...</span>
              </div>
            )}
            {activity.image && imageLoaded === false && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/70">
                <img src='/src/assets/placeholder.png' alt='默认图片' className="max-w-[100px]" />
              </div>
            )}
          </div>
          <p><strong>活动描述:</strong> {activity.description}</p>
          <p><strong>开始时间:</strong> {formatDateTime(activity.startTime)}</p>
          <p><strong>结束时间:</strong> {formatDateTime(activity.endTime)}</p>
          <p><strong>活动地点:</strong> {activity.location}</p>
          <p><strong>报名人数:</strong> {(activity.participants || []).length} / {activity.capacity || '无限制'}</p>

          {/* 报名按钮 - 仅普通用户可见 */}
          {!isAdmin && (
            <div className="mt-6">
              {(() => {
                const userDataStr = localStorage.getItem('currentUser');
                if (!userDataStr) return null;

                let userData;
                try {
                  userData = JSON.parse(userDataStr);
                } catch (error) {
                  console.error('Failed to parse user data:', error);
                  return null;
                }

                const hasRegistered = activity.participants && activity.participants.includes(userData.username);
                const isFull = activity.capacity && (activity.participants || []).length >= activity.capacity;

                // 取消报名功能
                const handleCancelRegistration = (activityId) => {
                  // 添加确认弹窗
                  if (!window.confirm('确定要取消报名吗？')) {
                    return; // 用户点击取消，不执行取消报名操作
                  }

                  const activities = JSON.parse(localStorage.getItem('activities') || '[]');
                  const currentActivity = activities.find(a => a.id === activityId);

                  // 检查是否已报名
                  if (!currentActivity.participants || !currentActivity.participants.includes(userData.username)) {
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

                  // 更新活动参与人数
                  const updatedActivities = activities.map(a => {
                    if (a.id === activityId) {
                      return {
                        ...a,
                        participants: a.participants.filter(participant => participant !== userData.username)
                      };
                    }
                    return a;
                  });
                  localStorage.setItem('activities', JSON.stringify(updatedActivities));

                  // 从用户个人记录中移除报名记录
                  const userBookingsKey = `bookings_${userData.username}`;
                  const existingBookings = JSON.parse(localStorage.getItem(userBookingsKey) || '[]');
                  const updatedBookings = existingBookings.filter(booking => booking.activityId !== activityId);
                  localStorage.setItem(userBookingsKey, JSON.stringify(updatedBookings));

                  // 显示取消报名成功提示
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

                  // 延迟刷新页面以显示Toast
                  setTimeout(() => {
                    window.location.reload();
                  }, 1500);
                };

                const handleRegistration = () => {
                  const activities = JSON.parse(localStorage.getItem('activities') || '[]');
                  const currentActivity = activities.find(a => a.id === id);

                  if (currentActivity.participants && currentActivity.participants.includes(userData.username)) {
                    toast.success('您已报名该活动', {
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

                  if (currentActivity.participants && currentActivity.capacity && currentActivity.participants.length >= currentActivity.capacity) {
                    toast.success('该活动已达报名人数上限', {
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

                  // 更新活动参与人数
                  const updatedActivities = activities.map(a => {
                    if (a.id === id) {
                      a.participants = [...(a.participants || []), userData.username];
                    }
                    return a;
                  });
                  localStorage.setItem('activities', JSON.stringify(updatedActivities));

                  // 添加报名记录
                  const bookingRecord = {
                    activityId: id,
                    activityName: activity.name,
                    registrationTime: new Date().toISOString(),
                    startTime: activity.startTime,
                    endTime: activity.endTime,
                    location: activity.location,
                    status: 'confirmed'
                  };

                  const userBookingsKey = `bookings_${userData.username}`;
                  const existingBookings = JSON.parse(localStorage.getItem(userBookingsKey) || '[]');
                  existingBookings.push(bookingRecord);
                  localStorage.setItem(userBookingsKey, JSON.stringify(existingBookings));

                  // 立即显示报名成功提示
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

                  // 延迟刷新页面以显示Toast
                  setTimeout(() => {
                    window.location.reload();
                  }, 1500);
                };

                const buttonText = hasRegistered ? '取消报名' : (isFull ? '人数已满' : '立即报名');
                const buttonClass = hasRegistered
                  ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                  : isFull
                  ? 'bg-gray-400 cursor-not-allowed text-gray-200'
                  : 'bg-green-600 hover:bg-green-700 text-white';

                const handleClick = hasRegistered
                  ? () => handleCancelRegistration(id)
                  : handleRegistration;

                return (
                  <button
                    onClick={handleClick}
                    className={buttonClass}
                  >
                    {buttonText}
                  </button>
                );
              })()}
            </div>
          )}

          {/* 活动评论 */}
          <div className="mt-8">
            <h3 className="text-xl font-bold mb-4">活动评论</h3>

            {comments.length === 0 ? (
              <p className="text-gray-500">暂无评论</p>
            ) : (
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="p-4 border border-gray-200 rounded-lg relative">
                    {/* 修改此处，将删除按钮和日期放在 flex 容器中 */}
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="font-semibold">{comment.username}</span>
                        <div className="flex items-center mt-1">
                          {[...Array(5)].map((_, i) => (
                            <span
                              key={i}
                              className={`text-lg ${i < comment.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-col items-end"> {/* 使用 flex-col 和 items-end 来垂直堆叠并右对齐 */}
                        <span className="text-sm text-gray-500 mb-1"> {/* 添加 mb-1 给予一些间距 */}
                          {new Date(comment.createdAt).toLocaleDateString('zh-CN', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                        {isAdmin && (
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="text-red-500 hover:text-red-700 text-sm"
                            title="删除评论"
                          >
                            删除
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-gray-700">{comment.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
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
                  name="name"
                  value={editForm.name}
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
                  value={editForm.startTime ? new Date(editForm.startTime).toISOString().slice(0, 16) : ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">结束时间</label>
                <input
                  type="datetime-local"
                  name="endTime"
                  value={editForm.endTime ? new Date(editForm.endTime).toISOString().slice(0, 16) : ''}
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

export default ActivityDetail;
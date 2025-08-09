import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { registrationApi, userApi, activityApi } from '../services/api';

const ActivityComment = ({ activityId }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [rating, setRating] = useState(5);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // 获取当前用户信息
    const checkLoginStatus = async () => {
      try {
        const user = await userApi.getCurrentUser();
        setCurrentUser(user);
      } catch (error) {
        console.error('获取用户信息失败:', error);
        setCurrentUser(null);
      }
    };
    
    // 获取活动评论
    const fetchComments = async () => {
      try {
        const response = await activityApi.getActivityDetail(activityId);
        if (response && response.comments) {
          setComments(response.comments);
        }
      } catch (error) {
        console.error('获取评论失败:', error);
      }
    };
    
    // 初始检查登录状态和获取评论
    checkLoginStatus();
    fetchComments();
    
    // 监听storage变化，支持多个标签页同步登录状态
    const handleStorageChange = (e) => {
      if (e.key === 'currentUser') {
        checkLoginStatus();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [activityId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!newComment.trim()) {
      alert('请输入评论内容');
      return;
    }
    
    // 确保使用最新的用户信息
    const activeUser = currentUser;
    
    if (!activeUser) {
      alert('登录状态已过期，请重新登录');
      window.location.href = '/login';
      return;
    }
    
    // 更新用户信息
    if (!currentUser || currentUser.username !== activeUser.username) {
      setCurrentUser(activeUser);
    }
    
    // 检查用户是否已报名活动
    try {
      const response = await registrationApi.getMyRegistrations();
      // 处理API可能返回的不同数据结构
      const registrations = Array.isArray(response) ? response : (response.registrations || response.data || []);
      const hasParticipated = registrations.some(reg => 
        String(reg.activityId) === String(activityId) || 
        String(reg.activity?.id) === String(activityId)
      );
      
      if (!hasParticipated) {
        alert('您需要先报名活动才能发表评论');
        return;
      }
    } catch (error) {
      console.error('检查报名状态失败:', error);
      alert('检查报名状态失败，请稍后重试');
      return;
    }
    
    try {
      // 调用后端API创建评论
      const newCommentData = await activityApi.createComment(activityId, {
        content: newComment,
        rating: rating
      });
      
      // 重新获取最新评论列表
      const response = await activityApi.getActivityDetail(activityId);
      if (response && response.comments) {
        setComments(response.comments);
      }
      
      // 清空表单
      setNewComment('');
      setRating(5);
      
      // 显示评论成功提示
      toast.success('评论发布成功！感谢您的反馈');
    } catch (error) {
      console.error('发布评论失败:', error);
      toast.error(error.response?.data?.message || '发布评论失败，请稍后重试');
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('zh-CN', options);
  };

  return (
    <div className="mt-8">
      <h3 className="text-xl font-bold mb-4">活动评论</h3>
      
      {/* 评论表单 */}
      <div className="mb-8 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-lg font-semibold mb-3">发表评论</h4>
        
        {currentUser ? (
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="block mb-1 font-medium">评分</label>
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className={`text-2xl ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
                  >
                    ★
                  </button>
                ))}
                <span className="ml-2 text-gray-600">{rating} 星</span>
              </div>
            </div>
            
            <div className="mb-3">
              <label htmlFor="comment" className="block mb-1 font-medium">评论内容</label>
              <textarea
                id="comment"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
                rows="4"
                placeholder="请分享您对活动的看法..."
              />
            </div>
            
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              提交评论
            </button>
          </form>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">请先登录后再发表评论</p>
            <button
              onClick={() => window.location.href = '/login'}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              前往登录
            </button>
          </div>
        )}
      </div>
      
      {/* 评论列表 */}
      <div>
        <h4 className="text-lg font-semibold mb-3">评论 ({comments.length})</h4>
        
        {comments.length === 0 ? (
          <p className="text-gray-500">暂无评论，快来分享您的看法吧！</p>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="font-semibold">{comment.user?.username || '匿名用户'}</span>
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
                  <span className="text-sm text-gray-500">{formatDateTime(comment.createdAt)}</span>
                </div>
                <p className="text-gray-700">{comment.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityComment;
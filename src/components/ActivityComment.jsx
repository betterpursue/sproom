import React, { useState, useEffect } from 'react';

const ActivityComment = ({ activityId }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [rating, setRating] = useState(5);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // 获取当前用户信息
    try {
      const userData = localStorage.getItem('currentUser');
      if (userData) {
        setCurrentUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('获取用户信息失败:', error);
    }
    
    // 从localStorage获取评论数据
    const commentsKey = `comments_${activityId}`;
    const commentsData = localStorage.getItem(commentsKey);
    if (commentsData) {
      setComments(JSON.parse(commentsData));
    }
  }, [activityId]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!newComment.trim()) {
      alert('请输入评论内容');
      return;
    }
    
    if (!currentUser) {
      alert('请先登录');
      return;
    }
    
    // 检查用户是否已报名活动
    const userBookingsKey = `bookings_${currentUser.username}`;
    const bookingsData = localStorage.getItem(userBookingsKey);
    let hasParticipated = false;
    
    if (bookingsData) {
      try {
        const bookings = JSON.parse(bookingsData);
        hasParticipated = bookings.some(booking => booking.activityId === activityId);
      } catch (error) {
        console.error('解析预订数据失败:', error);
      }
    }
    
    if (!hasParticipated) {
      alert('您需要先报名活动才能发表评论');
      return;
    }
    
    // 创建新评论
    const comment = {
      id: Date.now(),
      username: currentUser.username,
      rating: rating,
      content: newComment,
      createdAt: new Date().toISOString()
    };
    
    // 保存到localStorage
    const commentsKey = `comments_${activityId}`;
    const updatedComments = [comment, ...comments];
    localStorage.setItem(commentsKey, JSON.stringify(updatedComments));
    
    // 更新状态
    setComments(updatedComments);
    setNewComment('');
    setRating(5);
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
      <form onSubmit={handleSubmit} className="mb-8 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-lg font-semibold mb-3">发表评论</h4>
        
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
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import activityDetailBg from '/src/assets/activityDetail.png';
import BackButton from '/src/components/BackButton';

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

const formatDateTime = (dateString) => {
  if (!dateString) return '未设置';
  const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
  return new Date(dateString).toLocaleDateString('zh-CN', options);
};

const ActivityDetail = () => {
  const { id } = useParams();
  const [activity, setActivity] = useState(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const navigate = useNavigate();

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
      } catch (error) {
        console.error('Failed to fetch activity:', error);
      }
    };

    fetchActivity();
  }, [id]);

  if (!activity) {
    return (
      <> 
        <GlobalStyle /> 
        <div className="min-h-screen h-full flex items-center mt-0 justify-center" style={{ backgroundImage: `url(${activityDetailBg})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', backgroundAttachment: 'fixed' }}>
          <div className="bg-transparent">
            <h2 className="text-2xl font-bold mb-4">活动详情</h2>
            <p>加载中...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <> 
      <GlobalStyle /> 
      <div className="min-h-screen h-full flex items-center mt-0 justify-center" style={{ backgroundImage: `url(${activityDetailBg})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', backgroundAttachment: 'fixed' }}>
        <div className="bg-transparent">
          <BackButton />
          <h2 className="text-2xl font-bold mb-4">活动详情 - {activity.name}</h2>
          <div style={{ position: 'relative', height: '300px', marginBottom: '1rem', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#f0f0f0' }}>
            {activity.image ? (
              <img
                src={activity.image}
                alt={`${activity.name}`}
                style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'opacity 0.3s ease-in-out' }}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageLoaded(false)}
              />
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span>无活动图片</span>
              </div>
            )}
            {activity.image && !imageLoaded && (
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.7)' }}>
                <span>图片加载中...</span>
              </div>
            )}
            {activity.image && imageLoaded === false && (
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.7)' }}>
                <img src='/src/assets/placeholder.png' alt='默认图片' style={{ maxWidth: '100px' }} />
              </div>
            )}
          </div>
          <p><strong>活动描述:</strong> {activity.description}</p>
          <p><strong>开始时间:</strong> {formatDateTime(activity.startTime)}</p>
          <p><strong>结束时间:</strong> {formatDateTime(activity.endTime)}</p>
          <p><strong>活动地点:</strong> {activity.location}</p>
        </div>
      </div>
    </>
  );
};

export default ActivityDetail;
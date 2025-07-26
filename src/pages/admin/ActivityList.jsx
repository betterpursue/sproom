import React from 'react';
import { useNavigate } from 'react-router-dom';

const ActivityList = ({ activities, onActivityDelete }) => { // 接收 onActivityDelete 属性
  const navigate = useNavigate();

  const handleViewDetails = (id) => {
    navigate(`/activities/${id}`);
  };

  return (
    <div className="bg-white/20 p-6 rounded-2xl max-h-96 overflow-y-auto">
      <ul className="space-y-4">
        {activities.length === 0 ? (
          <div className="text-center text-gray-600">暂无活动，创建一个新活动吧～</div>
        ) : (
          activities.map(activity => (
            <li key={activity.id} className="relative flex flex-col gap-4 p-4 bg-white/90 rounded-lg shadow-sm">
              <button
                onClick={() => {
                  if (window.confirm('确定要删除这个活动吗？')) {
                    onActivityDelete(activity.id); // 调用传入的删除函数
                  }
                }}
                className="absolute top-2 right-2 text-red-500 hover:text-red-700 text-xl"
              >
                ❌
              </button>
              <h3 className="text-xl font-semibold">{activity.name}</h3>
              {activity.image && (
                <img
                  src={activity.image}
                  alt={activity.name}
                  className="w-full h-auto rounded-md"
                />
              )}
              <div className="text-gray-700 space-y-1">
                <p>开始时间: {activity.startTime}</p>
                <p>结束时间: {activity.endTime}</p>
              </div>
              <button
                onClick={() => handleViewDetails(activity.id)}
                className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                查看详情
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
};

export default ActivityList;
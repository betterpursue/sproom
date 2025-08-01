import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const CreateActivity = ({ onActivityCreate }) => {
  const [newActivity, setNewActivity] = useState({ name: '', location: '', startTime: '', endTime: '', description: '', image: '', capacity: '' });

  const handleCreateActivity = async () => {
    try {
      const newActivityData = { ...newActivity, id: uuidv4() };
      onActivityCreate(newActivityData);
      setNewActivity({ name: '', location: '', time: '', description: '', image: '' });
      toast.success('创建成功', {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
    } catch (error) {
      console.error('Failed to create activity:', error);
    }
  };

  return (
    <div className="bg-white/20 p-6 rounded-2xl mb-8">
      <div className="flex flex-col gap-4">
        <input
          type="text"
          value={newActivity.name}
          onChange={(e) => setNewActivity({ ...newActivity, name: e.target.value })}
          placeholder="输入新活动名称"
          className="p-3 rounded-lg border border-gray-300 bg-white/90 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="text"
          value={newActivity.location}
          onChange={(e) => setNewActivity({ ...newActivity, location: e.target.value })}
          placeholder="输入活动地点"
          className="p-3 rounded-lg border border-gray-300 bg-white/90 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="datetime-local"
          value={newActivity.startTime}
          onChange={(e) => setNewActivity({ ...newActivity, startTime: e.target.value })}
          placeholder="选择开始时间"
          className="p-3 rounded-lg border border-gray-300 bg-white/90 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="datetime-local"
          value={newActivity.endTime}
          onChange={(e) => setNewActivity({ ...newActivity, endTime: e.target.value })}
          placeholder="选择结束时间"
          className="p-3 rounded-lg border border-gray-300 bg-white/90 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <textarea
          value={newActivity.description}
          onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })}
          placeholder="输入活动描述"
          className="p-3 rounded-lg border border-gray-300 bg-white/90 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="text"
          value={newActivity.image}
          onChange={(e) => setNewActivity({ ...newActivity, image: e.target.value })}
          placeholder="输入活动图URL"
          className="p-3 rounded-lg border border-gray-300 bg-white/90 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="number"
          value={newActivity.capacity}
          onChange={(e) => setNewActivity({ ...newActivity, capacity: parseInt(e.target.value) || '' })}
          placeholder="输入活动人数上限"
          min="1"
          className="p-3 rounded-lg border border-gray-300 bg-white/90 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleCreateActivity}
          className="px-6 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          创建活动
        </button>
      </div>
    </div>
  );
};

export default CreateActivity;
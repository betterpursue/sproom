import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const CreateActivity = ({ onActivityCreate }) => {
  const [newActivity, setNewActivity] = useState({ 
    name: '', 
    location: '', 
    startTime: '', 
    endTime: '', 
    description: '', 
    image: '', 
    capacity: '',
    type: 'basketball' // 默认类型
  });

  const handleCreateActivity = async () => {
    try {
      // 验证必填字段
      if (!newActivity.name) {
        toast.error('请输入活动名称');
        return;
      }
      if (!newActivity.startTime) {
        toast.error('请选择开始时间');
        return;
      }
      if (!newActivity.endTime) {
        toast.error('请选择结束时间');
        return;
      }
      if (!newActivity.description || newActivity.description.trim().length < 10) {
        toast.error('活动描述必须至少10个字符');
        return;
      }
      if (!newActivity.type) {
        toast.error('请选择活动类型');
        return;
      }

      // 时间验证：确保开始时间晚于当前时间（增加1分钟缓冲）
      const now = new Date();
      const nowWithBuffer = new Date(now.getTime() + 60000); // 当前时间+1分钟
      const selectedStartTime = new Date(newActivity.startTime);
      const selectedEndTime = new Date(newActivity.endTime);

      console.log('当前时间:', now.toLocaleString());
      console.log('缓冲时间:', nowWithBuffer.toLocaleString());
      console.log('选择的开始时间:', selectedStartTime.toLocaleString());

      if (selectedStartTime <= nowWithBuffer) {
        toast.error(`开始时间必须晚于当前时间 ${nowWithBuffer.toLocaleString()}，请选择更晚的时间`);
        return;
      }

      if (selectedEndTime <= selectedStartTime) {
        toast.error('结束时间必须晚于开始时间');
        return;
      }

      // 字段映射：将前端字段映射为后端要求的字段
      // 确保时间格式为ISO字符串，便于后端处理
      const newActivityData = {
        title: newActivity.name, // 前端使用name，后端要求title
        location: newActivity.location,
        startTime: selectedStartTime.toISOString(),
        endTime: selectedEndTime.toISOString(),
        description: newActivity.description,
        imageUrl: newActivity.image, // 前端使用image，后端要求imageUrl
        maxParticipants: newActivity.capacity || null,
        type: newActivity.type
      };
      
      onActivityCreate(newActivityData);
      setNewActivity({ name: '', location: '', startTime: '', endTime: '', description: '', image: '', capacity: '', type: 'basketball' });
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
        <select
          value={newActivity.type}
          onChange={(e) => setNewActivity({ ...newActivity, type: e.target.value })}
          className="p-3 rounded-lg border border-gray-300 bg-white/90 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">选择活动类型</option>
          <option value="basketball">篮球</option>
          <option value="football">足球</option>
          <option value="badminton">羽毛球</option>
          <option value="tennis">网球</option>
          <option value="swimming">游泳</option>
          <option value="yoga">瑜伽</option>
          <option value="fitness">健身</option>
          <option value="other">其他</option>
        </select>
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
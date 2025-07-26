import React from 'react';
import { useNavigate } from 'react-router-dom';

const BackButton = () => {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate('/activity-management')}
      className="px-4 py-2 rounded-md bg-gray-600 text-white hover:bg-gray-700 transition-colors fixed top-4 left-4"
    >
      返回
    </button>
  );
};

export default BackButton;
import { Navigate } from 'react-router-dom';

const Auth = ({ children }) => {
  const userRole = localStorage.getItem('userRole');

  // 如果 userRole 不存在，说明用户未登录，重定向到登录页面
  if (!userRole) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default Auth;

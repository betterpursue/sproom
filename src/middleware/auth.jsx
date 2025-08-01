import { Navigate } from 'react-router-dom';

const Auth = ({ children }) => {
  const userRole = localStorage.getItem('userRole');

  // ��� userRole �����ڣ�˵���û�δ��¼���ض��򵽵�¼ҳ��
  if (!userRole) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default Auth;

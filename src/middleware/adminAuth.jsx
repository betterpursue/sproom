import { Navigate } from 'react-router-dom';

const AdminAuth = ({ children }) => {
  const userRole = localStorage.getItem('userRole');

  if (userRole !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default AdminAuth;
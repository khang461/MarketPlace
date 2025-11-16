import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const StaffRedirect: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Nếu user đã đăng nhập và có role staff, redirect đến /staff
    if (isAuthenticated && user?.role === 'staff') {
      navigate('/staff', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  return null; // Component này không render gì cả
};

export default StaffRedirect;

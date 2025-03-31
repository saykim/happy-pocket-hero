import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import { useUser } from '@/context/UserContext';
import { useEffect } from 'react';

const Layout = () => {
  const { isLoading, currentUser } = useUser();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!isLoading && !currentUser) {
      navigate("/signin");
    }
  }, [isLoading, currentUser, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4 dark:border-blue-400"></div>
          <p className="text-gray-600 dark:text-gray-300">데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  const isAdmin = currentUser?.isAdmin;
  
  return (
    <div className="min-h-screen pb-24 md:pb-0 md:pt-20 dark:bg-gray-900">
      {/* Only show Navbar for non-admin users */}
      {!isAdmin && <Navbar />}
      
      <div className="container max-w-4xl px-4 py-8">
        <Outlet />
      </div>
    </div>
  );
};

export default Layout; 

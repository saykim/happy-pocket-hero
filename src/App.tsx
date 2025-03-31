import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from '@/components/Layout';
import Index from '@/pages/Index';
import SignIn from '@/pages/SignIn';
import NotFound from '@/pages/NotFound';
import { UserProvider } from '@/context/UserContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import BadgesPage from '@/components/BadgesPage';
import { resetBadgeProgress, debugBadgeProgress } from '@/lib/utils';

// Create a client
const queryClient = new QueryClient();

// 개발 모드에서만 디버깅 유틸리티 노출
if (process.env.NODE_ENV === 'development') {
  (window as any).badgeUtils = {
    resetBadgeProgress,
    debugBadgeProgress
  };
  console.log('🛠️ 개발 모드: 배지 디버깅 유틸리티가 활성화되었습니다.');
  console.log('window.badgeUtils.debugBadgeProgress(userId) 함수로 배지 상태를 확인할 수 있습니다.');
  console.log('window.badgeUtils.resetBadgeProgress(userId, category?) 함수로 배지를 초기화할 수 있습니다.');
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <UserProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Index />} />
              <Route path="badges" element={<BadgesPage />} />
            </Route>
            <Route path="/signin" element={<SignIn />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
        <Toaster richColors closeButton position="top-center" />
      </UserProvider>
    </QueryClientProvider>
  );
}

export default App;

import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { HashRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ProtectedRoute from '@/components/ProtectedRoute';

import Home from '@/pages/Home';
import LeaderboardPage from '@/pages/LeaderboardPage';
import NewsPage from '@/pages/NewsPage';
import UserProfilePage from '@/pages/UserProfilePage';
import ShopPage from '@/pages/ShopPage';
import AvatarSelectPage from '@/pages/AvatarSelectPage';
import MessagesPage from '@/pages/MessagesPage';
import ThreadsPage from '@/pages/ThreadsPage';
import PosterPage from '@/pages/PosterPage';
import FishingPage from '@/pages/FishingPage';
import RVPage from '@/pages/RVPage';
import LayerPage from '@/pages/LayerPage';
import BreadPage from '@/pages/BreadPage';
import BreadLeaderboardPage from '@/pages/BreadLeaderboardPage';
import EmporiumPage from '@/pages/EmporiumPage';
import InventoryPage from '@/pages/InventoryPage';
import JewelerPage from '@/pages/JewelerPage';
import TradingPage from '@/pages/TradingPage';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    }
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route path="/" element={<Home />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/news" element={<NewsPage />} />
        <Route path="/profile/:userId" element={<UserProfilePage />} />
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/avatar" element={<AvatarSelectPage />} />
        <Route path="/messages" element={<MessagesPage />} />
        <Route path="/threads" element={<ThreadsPage />} />
        <Route path="/poster" element={<PosterPage />} />
        <Route path="/fishing" element={<FishingPage />} />
        <Route path="/rv" element={<RVPage />} />
        <Route path="/layer" element={<LayerPage />} />
        <Route path="/bread" element={<BreadPage />} />
        <Route path="/bread-leaderboard" element={<BreadLeaderboardPage />} />
        <Route path="/emporium" element={<EmporiumPage />} />
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/jeweler" element={<JewelerPage />} />
        <Route path="/trading" element={<TradingPage />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
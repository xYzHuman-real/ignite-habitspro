import { useState, useCallback } from "react";
import { useBackButton } from "@/hooks/use-back-button";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/lib/auth";
import { Layout } from "@/components/Layout";
import { AnimatePresence } from "framer-motion";
import Dashboard from "./pages/Dashboard";
import Habits from "./pages/Habits";
import TimerPage from "./pages/TimerPage";
import Todos from "./pages/Todos";
import Challenges from "./pages/Challenges";
import Community from "./pages/Community";
import Leaderboard from "./pages/Leaderboard";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Shop from "./pages/Shop";
import UserProfile from "./pages/UserProfile";
import WeeklyReport from "./pages/WeeklyReport";
import Journal from "./pages/Journal";
import GoalsPage from "./pages/Goals";
import Partners from "./pages/Partners";
import FocusRooms from "./pages/FocusRooms";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import DailyPlanner from "./pages/DailyPlanner";
import NotFound from "./pages/NotFound";
import Install from "./pages/Install";
import { SplashScreen } from "@/components/SplashScreen";
import { SignupBenefitsDialog, isGuest } from "@/components/SignupBenefitsDialog";

const queryClient = new QueryClient();

function ProtectedRoutes() {
  const { user, loading } = useAuth();
  useBackButton();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user && !isGuest()) return <Navigate to="/auth" replace />;

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/habits" element={<Habits />} />
        <Route path="/timer" element={<TimerPage />} />
        <Route path="/todos" element={<Todos />} />
        <Route path="/challenges" element={<Challenges />} />
        <Route path="/community" element={<Community />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/reports" element={<WeeklyReport />} />
        <Route path="/journal" element={<Journal />} />
        <Route path="/goals" element={<GoalsPage />} />
        <Route path="/partners" element={<Partners />} />
        <Route path="/focus-rooms" element={<FocusRooms />} />
        <Route path="/user/:userId" element={<UserProfile />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/daily-planner" element={<DailyPlanner />} />
        <Route path="/install" element={<Install />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
}

function AuthRoute() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return <Auth />;
}

const App = () => {
  const [showSplash, setShowSplash] = useState(true);
  const handleSplashFinish = useCallback(() => setShowSplash(false), []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        {showSplash && <SplashScreen onFinish={handleSplashFinish} />}
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/auth" element={<AuthRoute />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms-of-service" element={<TermsOfService />} />
              <Route path="/*" element={<ProtectedRoutes />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;

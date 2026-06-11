import { useState, useCallback, lazy, Suspense } from "react";
import { useBackButton } from "@/hooks/use-back-button";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/lib/auth";
import { Layout } from "@/components/Layout";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import { SplashScreen } from "@/components/SplashScreen";
import { OnboardingCarousel, hasSeenOnboarding } from "@/components/OnboardingCarousel";
import { PermissionPrimerFlow, hasCompletedPermissionPrimer } from "@/components/PermissionPrimerFlow";
import { SignupBenefitsDialog, isGuest } from "@/components/SignupBenefitsDialog";

const Habits = lazy(() => import("./pages/Habits"));
const TimerPage = lazy(() => import("./pages/TimerPage"));
const Todos = lazy(() => import("./pages/Todos"));
const Challenges = lazy(() => import("./pages/Challenges"));
const Community = lazy(() => import("./pages/Community"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const Profile = lazy(() => import("./pages/Profile"));
const Settings = lazy(() => import("./pages/Settings"));
const Shop = lazy(() => import("./pages/Shop"));
const UserProfile = lazy(() => import("./pages/UserProfile"));
const WeeklyReport = lazy(() => import("./pages/WeeklyReport"));
const Journal = lazy(() => import("./pages/Journal"));
const GoalsPage = lazy(() => import("./pages/Goals"));
const Partners = lazy(() => import("./pages/Partners"));
const FocusRooms = lazy(() => import("./pages/FocusRooms"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const DailyPlanner = lazy(() => import("./pages/DailyPlanner"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Install = lazy(() => import("./pages/Install"));
const Pricing = lazy(() => import("./pages/Pricing"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      gcTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const RouteFallback = () => (
  <div className="min-h-[50vh] flex items-center justify-center">
    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
  </div>
);

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
      <SignupBenefitsDialog />
      <Suspense fallback={<RouteFallback />}>
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
          <Route path="/pricing" element={<Pricing />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
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
  const [showOnboarding, setShowOnboarding] = useState(() => !hasSeenOnboarding());
  const [showPermissions, setShowPermissions] = useState(() => !hasCompletedPermissionPrimer());
  const handleSplashFinish = useCallback(() => setShowSplash(false), []);
  const handleOnboardingFinish = useCallback(() => setShowOnboarding(false), []);
  const handlePermissionsFinish = useCallback(() => setShowPermissions(false), []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        {showSplash && <SplashScreen onFinish={handleSplashFinish} />}
        {!showSplash && showOnboarding && <OnboardingCarousel onFinish={handleOnboardingFinish} />}
        {!showSplash && !showOnboarding && showPermissions && (
          <PermissionPrimerFlow onFinish={handlePermissionsFinish} />
        )}
        <BrowserRouter>
          <AuthProvider>
            <Suspense fallback={<RouteFallback />}>
              <Routes>
                <Route path="/auth" element={<AuthRoute />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/terms-of-service" element={<TermsOfService />} />
                <Route path="/*" element={<ProtectedRoutes />} />
              </Routes>
            </Suspense>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;

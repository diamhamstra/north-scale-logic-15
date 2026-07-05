import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import AuthStorageSyncBridge from '@/components/AuthStorageSyncBridge';
import ScrollToTop from './components/ScrollToTop';
import Home from './pages/Home';
import Contact from './pages/Contact';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfUse from './pages/TermsOfUse';
import Disclaimer from './pages/Disclaimer';
import CookiePolicy from './pages/CookiePolicy';
import CookieBanner from './components/site/CookieBanner';
import EmailSubscribeModal from './components/site/EmailSubscribeModal';
import NewsletterUnsubscribe from './pages/NewsletterUnsubscribe';
import Start from './pages/Start';
import Portal from './pages/Portal';
import EngineSetup from './pages/EngineSetup';
import AdminPortal from './pages/AdminPortal';

import AccountSettings from './pages/AccountSettings';
import AdminLogin from './pages/AdminLogin';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import AdminCompliance from './pages/AdminCompliance';
import Notifications from './pages/Notifications';
import SystemHealth from './pages/SystemHealth';
import ClientManagement from './pages/ClientManagement';
import OperationsCenter from './pages/OperationsCenter';
import Careers from './pages/Careers.jsx';
import NorthFinance from './pages/NorthFinance.jsx';
import NorthHub from './pages/NorthHub.jsx';
import LogoDownload from './pages/LogoDownload.jsx';
import GdprNotice from './pages/GdprNotice.jsx';
import AuthCallback from './pages/AuthCallback';
import CompleteProfile from './pages/CompleteProfile';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/terms-of-use" element={<TermsOfUse />} />
      <Route path="/disclaimer" element={<Disclaimer />} />
      <Route path="/cookie-policy" element={<CookiePolicy />} />
      <Route path="/unsubscribe" element={<NewsletterUnsubscribe />} />
      <Route path="/start" element={<Start />} />
      <Route path="/portal" element={<Portal />} />
      <Route path="/portal/setup/:engine" element={<EngineSetup />} />
      <Route path="/admin-portal" element={<AdminPortal />} />

      <Route path="/account-settings" element={<AccountSettings />} />
      <Route path="/admin-login" element={<AdminLogin />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/portal/admin/compliance" element={<AdminCompliance />} />
      <Route path="/portal/notifications" element={<Notifications />} />
      <Route path="/portal/admin/system" element={<SystemHealth />} />
      <Route path="/admin/clients" element={<ClientManagement />} />
      <Route path="/operations" element={<OperationsCenter />} />
      <Route path="/careers" element={<Careers />} />
      <Route path="/north" element={<NorthHub />} />
      <Route path="/north-finance" element={<NorthFinance />} />
      <Route path="/logo" element={<LogoDownload />} />
      <Route path="/gdpr-notice" element={<GdprNotice />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/complete-profile" element={<CompleteProfile />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthStorageSyncBridge />
          <ScrollToTop />
          <AuthenticatedApp />
          <CookieBanner />
          <EmailSubscribeModal />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { RequireAuth, RequireStaff } from './components/ProtectedRoute';
import Masthead from './components/Masthead';
import Footer from './components/Footer';
import BackToTop from './components/BackToTop';
import Home from './pages/Home';
import Topic, { Search } from './pages/Topic';
import Story from './pages/Story';
import DailyBrief from './pages/DailyBrief';
import Saved from './pages/Saved';
import Premium from './pages/Premium';
import Register from './pages/Register';
import Login from './pages/Login';
import Account from './pages/Account';
import ChangePassword from './pages/ChangePassword';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import DeleteAccount from './pages/DeleteAccount';
import AdminLayout from './pages/admin/AdminLayout';
import AdminOverview from './pages/admin/AdminOverview';
import AdminNewsroom from './pages/admin/AdminNewsroom';
import AdminModeration from './pages/admin/AdminModeration';
import AdminMembers from './pages/admin/AdminMembers';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <a className="skip" href="#main">Skip to content</a>
        <Masthead />
        <main id="main">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/topic/:slug" element={<Topic />} />
            <Route path="/story/:slug" element={<Story />} />
            <Route path="/search" element={<Search />} />
            <Route path="/brief" element={<DailyBrief />} />
            <Route path="/premium" element={<Premium />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/delete-account" element={<DeleteAccount />} />
            <Route path="/saved" element={<RequireAuth><Saved /></RequireAuth>} />
            <Route path="/account" element={<RequireAuth><Account /></RequireAuth>} />
            <Route path="/change-password" element={<RequireAuth><ChangePassword /></RequireAuth>} />
            <Route path="/admin" element={<RequireStaff><AdminLayout /></RequireStaff>}>
              <Route index element={<AdminOverview />} />
              <Route path="newsroom" element={<AdminNewsroom />} />
              <Route path="moderation" element={<AdminModeration />} />
              <Route path="members" element={<AdminMembers />} />
            </Route>
            {/* Old Helio paths */}
            <Route path="/daily-brief" element={<Navigate to="/brief" replace />} />
            <Route path="/pricing" element={<Navigate to="/premium" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
        <BackToTop />
      </AuthProvider>
    </BrowserRouter>
  );
}

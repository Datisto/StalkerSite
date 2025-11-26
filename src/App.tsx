import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AdminAuthProvider } from './contexts/AdminAuthContext';
import LandingPage from './pages/LandingPage';
import PlayerCabinet from './pages/PlayerCabinet';
import CharacterCreate from './pages/CharacterCreate';
import AdminPanel from './pages/AdminPanel';
import AdminLogin from './pages/AdminLogin';
import RulesTest from './pages/RulesTest';
import ProtectedAdminRoute from './components/ProtectedAdminRoute';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AdminAuthProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/cabinet" element={<PlayerCabinet />} />
            <Route path="/character/new" element={<CharacterCreate />} />
            <Route path="/character/edit/:id" element={<CharacterCreate />} />
            <Route path="/rules-test" element={<RulesTest />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route
              path="/admin"
              element={
                <ProtectedAdminRoute>
                  <AdminPanel />
                </ProtectedAdminRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AdminAuthProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

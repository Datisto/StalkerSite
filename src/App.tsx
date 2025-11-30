import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AdminAuthProvider } from './contexts/AdminAuthContext';
import LandingPage from './pages/LandingPage';
import SteamAuth from './pages/SteamAuth';
import PlayerCabinet from './pages/PlayerCabinet';
import CharacterCreate from './pages/CharacterCreate';
import CharacterView from './pages/CharacterView';
import EditCharacterStory from './pages/EditCharacterStory';
import AdminPanel from './pages/AdminPanel';
import AdminLogin from './pages/AdminLogin';
import RulesTest from './pages/RulesTest';
import Rules from './pages/Rules';
import FAQ from './pages/FAQ';
import ProtectedAdminRoute from './components/ProtectedAdminRoute';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AdminAuthProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/steam-callback" element={<SteamAuth />} />
            <Route path="/cabinet" element={<PlayerCabinet />} />
            <Route path="/character/new" element={<CharacterCreate />} />
            <Route path="/character/edit/:id" element={<CharacterCreate />} />
            <Route path="/character/:id" element={<CharacterView />} />
            <Route path="/character/edit-story/:id" element={<EditCharacterStory />} />
            <Route path="/rules-test" element={<RulesTest />} />
            <Route path="/rules" element={<Rules />} />
            <Route path="/rules/category/:slug" element={<Rules />} />
            <Route path="/rules/rule/:ruleNumber" element={<Rules />} />
            <Route path="/faq" element={<FAQ />} />
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

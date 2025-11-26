import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import LandingPage from './pages/LandingPage';
import PlayerCabinet from './pages/PlayerCabinet';
import CharacterCreate from './pages/CharacterCreate';
import AdminPanel from './pages/AdminPanel';
import RulesTest from './pages/RulesTest';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/cabinet" element={<PlayerCabinet />} />
          <Route path="/character/new" element={<CharacterCreate />} />
          <Route path="/character/edit/:id" element={<CharacterCreate />} />
          <Route path="/rules-test" element={<RulesTest />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

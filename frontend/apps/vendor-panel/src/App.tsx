import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import VendorLoginPage from './features/auth/LoginPage';
import VendorRegisterPage from './features/auth/RegisterPage';
import './styles/global.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/register" element={<VendorRegisterPage />} />
        <Route path="/login" element={<VendorLoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;

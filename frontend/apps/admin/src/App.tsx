import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminLoginPage from './features/auth/AdminLoginPage';
import './styles/global.css';

function App() {
  return (
    <Router>
      <div className="admin-app">
        <Routes>
          <Route path="/login" element={<AdminLoginPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

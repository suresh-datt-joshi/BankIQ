import './App.css';
import './styles/chatbot.css';

import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Chatbot from './pages/Chatbot';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';

// ===============================
// APPLICATION ROUTING
// ===============================

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public chatbot */}

        <Route path="/" element={<Chatbot />} />

        {/* Firebase Admin Login */}

        <Route path="/admin" element={<AdminLogin />} />

        {/* Protected Admin Dashboard */}

        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

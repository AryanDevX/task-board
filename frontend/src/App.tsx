import {
  BrowserRouter as Router,
  Routes,
  Route,
  // Navigate,
} from 'react-router-dom';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { ProjectDetail } from './pages/ProjectDetail';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Navigate } from 'react-router-dom';

export default function App() {
  return (
    <Router>
      <Routes>
        //Login route
        <Route path="/login" element={<Login />} />
        //Register new user:
        <Route path="/register" element={<Register />} />
        //Dashboard route:
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        //Dynamic Project Route for different projects
        <Route path="/project/:id" element={<ProjectDetail />} />
        {/* Any other path: */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

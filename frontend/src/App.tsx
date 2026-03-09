import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { ProjectDetail } from './pages/ProjectDetail';

function App() {
  return (
    <Router>
      <Routes>
        //Login route
        <Route path="/login" element={<Login />} />
        //Register new user:
        <Route path="/register" element={<Register />} />
        //Dashboard route (not protected)
        <Route path="/dashboard" element={<Dashboard />} />
        //Dynamic Project Route for different projects
        <Route path="/project/:id" element={<ProjectDetail />} />
      </Routes>
    </Router>
  );
}

export default App;

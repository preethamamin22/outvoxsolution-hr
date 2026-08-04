import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Tasks from './pages/Tasks';
import Attendance from './pages/Attendance';
import Recruitment from './pages/Recruitment';
import AgentProfile from './pages/AgentProfile';
import Telecallers from './pages/Telecallers';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="employees" element={<Employees />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="recruitment" element={<Recruitment />} />
          <Route path="telecallers" element={<Telecallers />} />
          <Route path="my-profile" element={<AgentProfile />} />
          {/* Add more routes here as we build them */}
        </Route>
      </Routes>
    </Router>
  );
}

export default App;

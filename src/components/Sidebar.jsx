import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, Users, CalendarDays, CalendarCheck, 
  UserPlus, FileText, Building2, TrendingUp, Briefcase, 
  MonitorSmartphone, Megaphone, Folder, GraduationCap, 
  CheckSquare, Calendar, PieChart, Settings, LogOut 
} from 'lucide-react';
import './Sidebar.css';

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/employees', icon: Users, label: 'Employees' },
  { path: '/attendance', icon: CalendarDays, label: 'Attendance' },
  { path: '/leave', icon: CalendarCheck, label: 'Leave Management' },
  { path: '/recruitment', icon: UserPlus, label: 'Recruitment' },
  { path: '/payroll', icon: FileText, label: 'Payroll' },
  { path: '/departments', icon: Building2, label: 'Departments' },
  { path: '/performance', icon: TrendingUp, label: 'Performance' },
  { path: '/projects', icon: Briefcase, label: 'Projects' },
  { path: '/assets', icon: MonitorSmartphone, label: 'Assets' },
  { path: '/announcements', icon: Megaphone, label: 'Announcements' },
  { path: '/documents', icon: Folder, label: 'Documents' },
  { path: '/training', icon: GraduationCap, label: 'Training' },
  { path: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { path: '/calendar', icon: Calendar, label: 'Calendar' },
  { path: '/reports', icon: PieChart, label: 'Reports' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

function Sidebar() {
  return (
    <aside className="sidebar glass-panel">
      <div className="sidebar-header">
        <div className="logo-container">
          <div className="logo-icon">OS</div>
          <h2 className="logo-text">Outvox<span className="text-gradient">HR</span></h2>
        </div>
      </div>
      
      <div className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink 
            key={item.path} 
            to={item.path} 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <item.icon size={20} className="nav-icon" />
            <span className="nav-label">{item.label}</span>
          </NavLink>
        ))}
      </div>
      
      <div className="sidebar-footer">
        <NavLink to="/login" className="nav-item logout-btn">
          <LogOut size={20} className="nav-icon text-danger" />
          <span className="nav-label">Logout</span>
        </NavLink>
      </div>
    </aside>
  );
}

export default Sidebar;

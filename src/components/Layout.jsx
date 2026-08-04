import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

function Layout() {
  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <TopBar />
        <main className="content-area">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default Layout;

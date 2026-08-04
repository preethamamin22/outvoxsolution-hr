import React, { useState, useEffect } from 'react';
import { 
  Users, CheckCircle2, XCircle, Clock, 
  UserPlus, FileCheck, Search, Briefcase
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, PieChart, Pie, Cell
} from 'recharts';
import './Dashboard.css';

const KpiCard = ({ icon: Icon, title, value, trend, trendUp, color }) => (
  <div className="kpi-card glass-card">
    <div className="kpi-header">
      <div className="kpi-icon-wrapper" style={{ backgroundColor: `${color}20`, color }}>
        <Icon size={24} />
      </div>
      <div className={`kpi-trend ${trendUp ? 'text-success' : 'text-danger'}`}>
        {trendUp ? '↑' : '↓'} {trend}
      </div>
    </div>
    <div className="kpi-body">
      <h3>{value}</h3>
      <p>{title}</p>
    </div>
  </div>
);

function Dashboard() {
  const [kpis, setKpis] = useState(null);
  const [charts, setCharts] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [kpiRes, chartsRes] = await Promise.all([
          fetch('http://localhost:5000/api/dashboard/kpis'),
          fetch('http://localhost:5000/api/dashboard/charts')
        ]);
        
        const kpiData = await kpiRes.json();
        const chartsData = await chartsRes.json();
        
        setKpis(kpiData);
        setCharts(chartsData);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div style={{ padding: '2rem', color: 'var(--text-muted)' }}>Loading dashboard data from server...</div>;
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h2>Dashboard Overview</h2>
          <p className="text-muted">Welcome back, here's what's happening today.</p>
        </div>
        <button className="btn btn-primary">Download Report</button>
      </div>

      <div className="kpi-grid">
        <KpiCard icon={Users} title="Total Employees" value={kpis?.totalEmployees || 0} trend="12% vs last month" trendUp={true} color="#4F46E5" />
        <KpiCard icon={CheckCircle2} title="Present Today" value={kpis?.presentToday || 0} trend="3% vs yesterday" trendUp={true} color="#22C55E" />
        <KpiCard icon={XCircle} title="Absent" value={kpis?.absent || 0} trend="1% vs yesterday" trendUp={false} color="#EF4444" />
        <KpiCard icon={Clock} title="Late Check-ins" value={kpis?.lateCheckins || 0} trend="5% vs yesterday" trendUp={false} color="#F59E0B" />
        
        <KpiCard icon={UserPlus} title="New Joiners" value={kpis?.newJoiners || 0} trend="This Month" trendUp={true} color="#06B6D4" />
        <KpiCard icon={FileCheck} title="On Leave" value={kpis?.onLeave || 0} trend="Today" trendUp={false} color="#4F46E5" />
        <KpiCard icon={Briefcase} title="Open Positions" value={kpis?.openPositions || 0} trend="Across 4 depts" trendUp={true} color="#06B6D4" />
        <KpiCard icon={Search} title="Pending Approvals" value={kpis?.pendingApprovals || 0} trend="Needs action" trendUp={false} color="#F59E0B" />
      </div>

      <div className="charts-grid">
        <div className="chart-card glass-card">
          <div className="chart-header">
            <h3>Attendance Trend (This Week)</h3>
          </div>
          <div className="chart-body">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={charts?.attendanceTrend || []} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22C55E" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#22C55E" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorAbsent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-glass)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-muted)" />
                <YAxis stroke="var(--text-muted)" />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-glass)', borderRadius: '8px' }}
                  itemStyle={{ color: 'var(--text-main)' }}
                />
                <Area type="monotone" dataKey="present" stroke="#22C55E" fillOpacity={1} fill="url(#colorPresent)" name="Present" />
                <Area type="monotone" dataKey="absent" stroke="#EF4444" fillOpacity={1} fill="url(#colorAbsent)" name="Absent" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card glass-card">
          <div className="chart-header">
            <h3>Department Distribution</h3>
          </div>
          <div className="chart-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={charts?.departmentDistribution || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {(charts?.departmentDistribution || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-glass)', borderRadius: '8px' }}
                />
                <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ color: 'var(--text-main)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;

import React, { useState, useEffect } from 'react';
import { 
  Users, CheckCircle2, XCircle, Clock, 
  UserPlus, FileCheck, Search, Briefcase, Link, Copy, Check,
  Activity, ArrowRight, UserCheck, Mail, Calendar, Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import './Dashboard.css';

const KpiCard = ({ icon: Icon, title, value, trend, trendUp, color }) => (
  <div className="kpi-card glass-card" style={{ '--kpi-color': color }}>
    <div className="kpi-header">
      <div className="kpi-icon-wrapper" style={{ backgroundColor: `${color}15`, color }}>
        <Icon size={22} />
      </div>
      <span className={`kpi-trend ${trendUp ? 'text-success' : 'text-danger'}`} style={{ backgroundColor: trendUp ? 'rgba(34, 197, 94, 0.08)' : 'rgba(239, 68, 68, 0.08)' }}>
        {trendUp ? '↑' : '↓'} {trend}
      </span>
    </div>
    <div className="kpi-body">
      <h3>{value}</h3>
      <p>{title}</p>
    </div>
  </div>
);

function Dashboard() {
  const navigate = useNavigate();
  const [kpis, setKpis] = useState(null);
  const [charts, setCharts] = useState(null);
  const [activities, setActivities] = useState({ recentUpdates: [], recentOffers: [], recentClockIns: [] });
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [activeActivityTab, setActiveActivityTab] = useState('updates'); // 'updates' | 'clockins' | 'offers'

  const loginUrl = window.location.origin + '/login';
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleCopyLink = () => {
    navigator.clipboard.writeText(loginUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [kpiRes, chartsRes, activitiesRes] = await Promise.all([
          fetch('/api/dashboard/kpis'),
          fetch('/api/dashboard/charts'),
          fetch('/api/dashboard/activities')
        ]);
        
        const kpiData = await kpiRes.json();
        const chartsData = await chartsRes.json();
        const activitiesData = await activitiesRes.json();
        
        setKpis(kpiData);
        setCharts(chartsData);
        setActivities(activitiesData);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="dashboard-spinner" />
        <p>Loading dashboard data...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      
      {/* Welcome & Overview Panel */}
      <div className="welcome-banner glass-card">
        <div className="welcome-content">
          <div className="welcome-sparkle"><Sparkles size={16} /> Welcome Premium Admin</div>
          <h2>Hello, {user?.name || 'Preetham'}!</h2>
          <p>Here's a fresh overview of Outvox Solution HR activities, tasks, and system telemetry today.</p>
        </div>
        <div className="welcome-meta">
          <div className="meta-item">
            <span className="meta-label">System Time</span>
            <span className="meta-value">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Active Agents</span>
            <span className="meta-value text-success">{kpis?.presentToday || 0} Live</span>
          </div>
        </div>
      </div>

      {/* Share Link Banner */}
      <div className="share-banner glass-card">
        <div className="share-left">
          <div className="share-icon-wrapper">
            <Link size={18} color="white" />
          </div>
          <div>
            <p className="share-label">Agent Login Link — Share this with employees</p>
            <p className="share-url">{loginUrl}</p>
          </div>
        </div>
        <button
          onClick={handleCopyLink}
          className={`share-copy-btn ${copied ? 'copied' : ''}`}
        >
          {copied ? <><Check size={16} /> Copied!</> : <><Copy size={16} /> Copy Link</>}
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="kpi-grid">
        <KpiCard icon={Users} title="Total Employees" value={kpis?.totalEmployees || 0} trend="12% vs last month" trendUp={true} color="#6366F1" />
        <KpiCard icon={CheckCircle2} title="Present Today" value={kpis?.presentToday || 0} trend="3% vs yesterday" trendUp={true} color="#10B981" />
        <KpiCard icon={XCircle} title="Absent" value={kpis?.absent || 0} trend="1% vs yesterday" trendUp={false} color="#EF4444" />
        <KpiCard icon={Clock} title="Late Check-ins" value={kpis?.lateCheckins || 0} trend="5% vs yesterday" trendUp={false} color="#F59E0B" />
      </div>

      {/* Main Charts & Feed Grid */}
      <div className="charts-grid-fresh">
        
        {/* Attendance Trend Chart */}
        <div className="chart-card glass-card">
          <div className="chart-header-fresh">
            <div>
              <h3>Attendance Analytics</h3>
              <p>Weekly trend of agent clock-ins and absenteeism</p>
            </div>
          </div>
          <div className="chart-body">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={charts?.attendanceTrend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorAbsent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-glass)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-glass)', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
                  itemStyle={{ color: 'var(--text-main)', fontSize: 13 }}
                  labelStyle={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 600 }}
                />
                <Area type="monotone" dataKey="present" stroke="#10B981" fillOpacity={1} fill="url(#colorPresent)" strokeWidth={2} name="Present" />
                <Area type="monotone" dataKey="absent" stroke="#EF4444" fillOpacity={1} fill="url(#colorAbsent)" strokeWidth={2} name="Absent" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Live Activity Feed */}
        <div className="feed-card glass-card">
          <div className="feed-header-fresh">
            <div>
              <h3>Live Activity Feed</h3>
              <p>Real-time updates from telecallers and HR status</p>
            </div>
          </div>
          <div className="feed-tabs">
            <button 
              className={`feed-tab-btn ${activeActivityTab === 'updates' ? 'active' : ''}`}
              onClick={() => setActiveActivityTab('updates')}
            >
              Updates
            </button>
            <button 
              className={`feed-tab-btn ${activeActivityTab === 'clockins' ? 'active' : ''}`}
              onClick={() => setActiveActivityTab('clockins')}
            >
              Clock-Ins
            </button>
            <button 
              className={`feed-tab-btn ${activeActivityTab === 'offers' ? 'active' : ''}`}
              onClick={() => setActiveActivityTab('offers')}
            >
              Offers
            </button>
          </div>
          <div className="feed-content-scroll">
            
            {activeActivityTab === 'updates' && (
              <div className="feed-list">
                {activities.recentUpdates.length === 0 ? (
                  <p className="feed-empty">No updates posted today.</p>
                ) : (
                  activities.recentUpdates.map(update => (
                    <div key={update.id} className="feed-item">
                      <div className="feed-avatar-mini">
                        {update.employee.fullName.charAt(0)}
                      </div>
                      <div className="feed-details">
                        <p className="feed-text">
                          <strong>{update.employee.fullName}</strong> submitted daily update:
                        </p>
                        <span className="feed-body-text">"{update.content}"</span>
                        <span className="feed-time">{new Date(update.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeActivityTab === 'clockins' && (
              <div className="feed-list">
                {activities.recentClockIns.length === 0 ? (
                  <p className="feed-empty">No active clock-ins recorded.</p>
                ) : (
                  activities.recentClockIns.map(record => (
                    <div key={record.id} className="feed-item">
                      <div className="feed-icon-wrapper-mini text-success">
                        <UserCheck size={16} />
                      </div>
                      <div className="feed-details">
                        <p className="feed-text">
                          <strong>{record.employee.fullName}</strong> clocked in successfully.
                        </p>
                        <span className="feed-time">{new Date(record.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeActivityTab === 'offers' && (
              <div className="feed-list">
                {activities.recentOffers.length === 0 ? (
                  <p className="feed-empty">No recent offer letters generated.</p>
                ) : (
                  activities.recentOffers.map(offer => (
                    <div key={offer.id} className="feed-item">
                      <div className="feed-icon-wrapper-mini text-primary">
                        <Mail size={16} />
                      </div>
                      <div className="feed-details">
                        <p className="feed-text">
                          Generated offer letter for <strong>{offer.candidateName}</strong>.
                        </p>
                        <span className="feed-meta-sub">Role: {offer.role} &bull; Status: <span className="text-success">{offer.status}</span></span>
                        <span className="feed-time">{new Date(offer.sentAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

          </div>
        </div>

      </div>

      {/* Sub Analytics & Quick Actions */}
      <div className="charts-grid-fresh secondary">
        
        {/* Department Pie Chart */}
        <div className="chart-card glass-card">
          <div className="chart-header-fresh">
            <div>
              <h3>Department Allocation</h3>
              <p>Distribution of personnel across active business segments</p>
            </div>
          </div>
          <div className="chart-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={charts?.departmentDistribution || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {(charts?.departmentDistribution || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-glass)', borderRadius: '12px' }}
                />
                <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: 11, color: 'var(--text-main)', marginTop: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div className="quick-actions-card glass-card">
          <div className="quick-header-fresh">
            <h3>Quick Management Panel</h3>
            <p>Fast path to standard HR operations</p>
          </div>
          <div className="action-buttons-grid">
            <button className="action-tile-btn" onClick={() => navigate('/employees')}>
              <div className="tile-icon text-primary"><UserPlus size={18} /></div>
              <span>Add Employee</span>
            </button>
            <button className="action-tile-btn" onClick={() => navigate('/recruitment')}>
              <div className="tile-icon text-success"><Mail size={18} /></div>
              <span>New Offer</span>
            </button>
            <button className="action-tile-btn" onClick={() => navigate('/telecallers')}>
              <div className="tile-icon text-warning"><Activity size={18} /></div>
              <span>Leads Board</span>
            </button>
            <button className="action-tile-btn" onClick={() => navigate('/tasks')}>
              <div className="tile-icon text-danger"><Calendar size={18} /></div>
              <span>Create Task</span>
            </button>
          </div>
          <div className="quick-stat-footer">
            <span className="footer-label">Offer letter status:</span>
            <span className="footer-val text-success">Active Campaign</span>
          </div>
        </div>

      </div>

    </div>
  );
}

export default Dashboard;

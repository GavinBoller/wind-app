"use client";

import AdminHeader from './AdminHeader';
import React, { useState, useEffect } from 'react';
import AccessDeniedView from './AccessDeniedView';
import { useSession } from 'next-auth/react';
import type { User, AppSettings } from '@prisma/client';

interface AdminStats {
  totalUsers: number;
  totalUserStations: number;
  uniqueStationsInUse: number;
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUsers, setShowUsers] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [usersRes, statsRes, settingsRes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/stats'),
        fetch('/api/settings'),
      ]);

      if (!usersRes.ok || !statsRes.ok || !settingsRes.ok) {
        throw new Error('Failed to fetch admin data.');
      }

      const usersData = await usersRes.json();
      const statsData = await statsRes.json();
      const settingsData = await settingsRes.json();

      setUsers(usersData);
      setStats(statsData);
      setSettings(settingsData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated' && session.user?.role === 'ADMIN') {
      fetchData();
    }
  }, [status, session]);

  const handleApprovalToggle = async (userId: string, isApproved: boolean) => {
    try {
      await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, approved: !isApproved }),
      });
      fetchData(); // Refresh all dashboard data
    } catch (err) {
      alert('Failed to update user status.');
    }
  };

  const handleRoleToggle = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'ADMIN' ? 'USER' : 'ADMIN';
    try {
      await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole }),
      });
      fetchData(); // Refresh all dashboard data
    } catch (err) {
      alert('Failed to update user role.');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user? This cannot be undone.')) {
      try {
        await fetch('/api/admin/users', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        });
        fetchData(); // Refresh all dashboard data
      } catch (err) {
        alert('Failed to delete user.');
      }
    }
  };

  const handleSettingsToggle = async () => {
    if (!settings) return;
    const newApprovalRequired = !settings.approvalRequired;
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approvalRequired: newApprovalRequired }),
      });
      if (!res.ok) throw new Error('Failed to update settings.');
      const data = await res.json();
      setSettings(data);
    } catch (err) {
      alert('Failed to update user status.');
    }
  };

  if (status === 'loading') {
    return <div className="my-stations-container"><h2>Loading...</h2></div>;
  }

  if (session?.user?.role !== 'ADMIN') {
    return (
      <div className="my-stations-container">
        <AdminHeader />
        <AccessDeniedView />
      </div>
    );
  }

  return (
    <div className="my-stations-container">
      <style>{`
        .admin-actions-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
          padding-bottom: 0.75rem;
          margin-bottom: 0.75rem;
          border-bottom: 1px solid #3a4a60;
        }
        .admin-section-title {
          font-size: 1.1rem;
          margin-bottom: 0.75rem;
        }
        .admin-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
          gap: 0.75rem;
        }
        .stat-card { padding: 0.75rem; }
        .stat-value { font-size: 1.25rem; }
        .stat-label { font-size: 0.75rem; }
      `}</style>
      <AdminHeader />
      <div className="admin-page">
        <h1 className="stations-title">Admin Dashboard</h1>
      {isLoading && <p>Loading dashboard...</p>}
      {error && <p className="info-modal-error">{error}</p>}
      {!isLoading && !error && (
        <>
          <div className="admin-section admin-actions-bar">
            <div className="settings-toggle">
              <span>Require User Approval</span>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={settings?.approvalRequired ?? true}
                  onChange={handleSettingsToggle}
                />
                <span className="slider round"></span>
              </label>
            </div>
            <button className="user-list-toggle" onClick={() => setShowUsers(!showUsers)}>
              {showUsers ? 'Hide' : 'Show'} User List
            </button>
          </div>

          <div className="admin-section">
            <h2 className="admin-section-title">Statistics & Usage</h2>
            <div className="admin-stats">
              <div className="stat-card">
                <span className="stat-value">{stats?.totalUsers ?? 0}</span>
                <span className="stat-label">Total Users</span>
              </div>
              <div className="stat-card">
                <span className="stat-value">{stats?.totalUserStations ?? 0}</span>
                <span className="stat-label">Stations Added</span>
              </div>
              <div className="stat-card">
                <span className="stat-value">{stats?.uniqueStationsInUse ?? 0}</span>
                <span className="stat-label">Unique Stations</span>
              </div>
              <a
                href="https://www.willyweather.com.au/account/api.html"
                target="_blank"
                rel="noopener noreferrer"
                className="stat-card"
                style={{ textDecoration: 'none' }}
              >
                <span className="stat-value">View Usage</span>
                <span className="stat-label">WillyWeather API</span>
              </a>
            </div>
          </div>

          {showUsers && (
            <div className="admin-section">
              <div className="table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Status</th>
                      <th>Role</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td>{user.name}</td>
                        <td>{user.email}</td>
                        <td>{user.approved ? 'Approved' : 'Pending'}</td>
                        <td>{user.role}</td>
                        <td className="actions-cell">
                          <button className={`btn btn-sm ${user.approved ? 'btn-warning' : 'btn-success'}`} onClick={() => handleApprovalToggle(user.id, user.approved)}>
                            {user.approved ? 'Revoke' : 'Approve'}
                          </button>
                          <button className="btn btn-sm btn-secondary" onClick={() => handleRoleToggle(user.id, user.role)}>
                            {user.role === 'ADMIN' ? 'Make User' : 'Make Admin'}
                          </button>
                          <button className="btn btn-sm btn-danger" onClick={() => handleDeleteUser(user.id)}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
      </div>
    </div>
  );
}
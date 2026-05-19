import React, { useState } from 'react';
import { Redirect } from 'react-router-dom';
import { useHistory } from 'react-router-dom';
import { GroupuiButton, GroupuiText } from '@group-ui/group-ui-react';
import { useAuth } from '../contexts/AuthContext';
import OverviewTab from '../components/admin/OverviewTab';
import UserManagementTab from '../components/admin/UserManagementTab';
import RoleManagementTab from '../components/admin/RoleManagementTab';
import AdminApprovalPage from '../components/AdminApprovalPage';

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: '📊' },
  { id: 'users', label: 'Users', icon: '👥' },
  { id: 'approvals', label: 'Approvals', icon: '✅' },
  { id: 'roles', label: 'Roles', icon: '🔑' }
];

const isAdminUser = (user, selectedNSC) => {
  if (!user || !user.nscMemberships || !selectedNSC) return false;
  const membership = user.nscMemberships.find(m => m.nscId === selectedNSC.nscId);
  const roleName = membership?.role?.name ?? membership?.role;
  return typeof roleName === 'string' && roleName.toUpperCase() === 'ADMIN';
};

const AdminDashboard = () => {
  const history = useHistory();
  const { user, selectedNSC } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  if (!isAdminUser(user, selectedNSC)) {
    return <Redirect to="/" />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':  return <OverviewTab />;
      case 'users':     return <UserManagementTab />;
      case 'approvals': return <AdminApprovalPage />;
      case 'roles':     return <RoleManagementTab />;
      default:          return <OverviewTab />;
    }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f8f9fa' }}>
      {/* Top bar */}
      <div style={{
        height: '60px',
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e0e0e0',
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.06)',
        flexShrink: 0
      }}>
        <GroupuiButton
          variant="ghost"
          size="s"
          onClick={() => history.push('/')}
          style={{ marginRight: '20px' }}
        >
          ← Back to Chat
        </GroupuiButton>
        <GroupuiText weight="bold" style={{ fontSize: '18px' }}>
          Admin Dashboard
        </GroupuiText>
        {selectedNSC && (
          <GroupuiText style={{ color: '#6c757d', fontSize: '14px', marginLeft: '12px' }}>
            — {selectedNSC.nscName}
          </GroupuiText>
        )}
      </div>

      {/* Body */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar */}
        <div style={{
          width: '220px',
          backgroundColor: '#ffffff',
          borderRight: '1px solid #e0e0e0',
          padding: '24px 0',
          flexShrink: 0,
          overflowY: 'auto'
        }}>
          <div style={{ padding: '0 16px', marginBottom: '16px' }}>
            <GroupuiText style={{ fontSize: '11px', color: '#6c757d', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Admin Panel
            </GroupuiText>
          </div>

          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 16px',
                border: 'none',
                background: activeTab === item.id ? '#e9f0ff' : 'transparent',
                borderLeft: activeTab === item.id ? '3px solid #4361ee' : '3px solid transparent',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '14px',
                color: activeTab === item.id ? '#4361ee' : '#333',
                fontWeight: activeTab === item.id ? '600' : '400',
                transition: 'background 0.15s'
              }}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

import React from 'react';
import { GroupuiCard, GroupuiText, GroupuiButton, GroupuiIcon } from '@group-ui/group-ui-react';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import Layout from '../components/Layout';

const DashboardPage = () => {
  const { user, selectedNSC } = useAuth();

  const stats = [
    { label: 'Total Channels', value: '24', icon: 'hash-24' },
    { label: 'Active Users', value: '156', icon: 'users-24' },
    { label: 'Messages Today', value: '1,247', icon: 'chat-24' },
    { label: 'Files Shared', value: '89', icon: 'folder-24' }
  ];

  return (
    <Layout>
      <Header />
      <div style={{ 
        padding: '24px',
        maxWidth: '1200px',
        margin: '60px auto 0 auto',
        width: '100%'
      }}>
        {/* Welcome Section */}
        <div style={{ marginBottom: '32px' }}>
          <GroupuiText variant="h4" style={{ 
            fontWeight: 'bold',
            marginBottom: '8px'
          }}>
            Welcome back, {user?.firstName}!
          </GroupuiText>
          <GroupuiText variant="body1" style={{ color: '#6c757d' }}>
            Here's what's happening in {selectedNSC?.name} today.
          </GroupuiText>
        </div>

        {/* Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px',
          marginBottom: '32px'
        }}>
          {stats.map((stat, index) => (
            <GroupuiCard key={index} style={{ padding: '24px' }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                marginBottom: '12px'
              }}>
                <GroupuiIcon 
                  name={stat.icon} 
                  style={{ 
                    color: '#4a154b',
                    fontSize: '24px'
                  }}
                />
                <GroupuiText variant="h3" style={{ 
                  fontWeight: 'bold',
                  color: '#4a154b'
                }}>
                  {stat.value}
                </GroupuiText>
              </div>
              <GroupuiText variant="subtitle1" style={{ color: '#6c757d' }}>
                {stat.label}
              </GroupuiText>
            </GroupuiCard>
          ))}
        </div>

        {/* Quick Actions */}
        <GroupuiCard style={{ padding: '24px' }}>
          <GroupuiText variant="h6" style={{ 
            fontWeight: 'bold',
            marginBottom: '16px'
          }}>
            Quick Actions
          </GroupuiText>
          <div style={{
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap'
          }}>
            <GroupuiButton 
              variant="primary"
              style={{
                backgroundColor: '#4a154b',
                borderColor: '#4a154b'
              }}
            >
              <GroupuiIcon name="plus-24" style={{ marginRight: '8px' }} />
              Create Channel
            </GroupuiButton>
            <GroupuiButton variant="outline">
              <GroupuiIcon name="user-plus-24" style={{ marginRight: '8px' }} />
              Invite Users
            </GroupuiButton>
            <GroupuiButton variant="outline">
              <GroupuiIcon name="settings-24" style={{ marginRight: '8px' }} />
              Manage NSC
            </GroupuiButton>
          </div>
        </GroupuiCard>
      </div>
    </Layout>
  );
};

export default DashboardPage;
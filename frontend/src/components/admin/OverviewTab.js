import React, { useState, useEffect } from 'react';
import {
  GroupuiCard,
  GroupuiHeadline,
  GroupuiText,
  GroupuiLoadingSpinner
} from '@group-ui/group-ui-react';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/apiService';

const StatCard = ({ label, value, icon }) => (
  <GroupuiCard style={{ padding: '24px', textAlign: 'center', minWidth: '160px' }}>
    <div style={{ fontSize: '32px', marginBottom: '8px' }}>{icon}</div>
    <GroupuiHeadline heading="h3" style={{ marginBottom: '4px' }}>{value}</GroupuiHeadline>
    <GroupuiText style={{ color: '#6c757d', fontSize: '14px' }}>{label}</GroupuiText>
  </GroupuiCard>
);

const OverviewTab = () => {
  const { selectedNSC } = useAuth();
  const [stats, setStats] = useState(null);
  const [nscDetails, setNscDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (selectedNSC?.nscId) {
      loadData();
    }
  }, [selectedNSC]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [statsRes, nscRes] = await Promise.allSettled([
        apiService.getNSCStats(selectedNSC.nscId),
        fetch(`/api/nsc/${selectedNSC.nscId}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }).then(r => r.json())
      ]);

      if (statsRes.status === 'fulfilled') setStats(statsRes.value.stats);
      if (nscRes.status === 'fulfilled') setNscDetails(nscRes.value.nsc);
    } catch (err) {
      setError('Failed to load overview data.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px' }}>
        <GroupuiLoadingSpinner size="m" />
        <GroupuiText style={{ color: '#6c757d', marginTop: '16px' }}>Loading overview...</GroupuiText>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <GroupuiText style={{ color: '#dc3545' }}>{error}</GroupuiText>
      </div>
    );
  }

  return (
    <div style={{ padding: '32px', maxWidth: '1100px' }}>
      <GroupuiHeadline heading="h3" style={{ marginBottom: '8px' }}>Overview</GroupuiHeadline>
      <GroupuiText style={{ color: '#6c757d', marginBottom: '32px' }}>
        {selectedNSC?.nscName} — {nscDetails?.region || selectedNSC?.region}
      </GroupuiText>

      {/* Stats grid */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '40px' }}>
        <StatCard label="Total Users" value={stats?.totalUsers ?? '—'} icon="👥" />
        <StatCard label="Active Channels" value={stats?.totalChannels ?? '—'} icon="💬" />
        <StatCard label="Messages (30d)" value={stats?.messagesLast30Days ?? '—'} icon="✉️" />
        <StatCard label="Active Users (7d)" value={stats?.activeUsersLast7Days ?? '—'} icon="🟢" />
        <StatCard label="Roles" value={stats?.totalRoles ?? '—'} icon="🔑" />
      </div>

      {/* NSC details */}
      {nscDetails && (
        <GroupuiCard style={{ padding: '24px' }}>
          <GroupuiHeadline heading="h5" style={{ marginBottom: '16px' }}>NSC Details</GroupuiHeadline>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
            {[
              { label: 'Name', value: nscDetails.name },
              { label: 'Region', value: nscDetails.region },
              { label: 'Subdomain', value: nscDetails.subdomain },
              { label: 'Status', value: nscDetails.isActive ? 'Active' : 'Inactive' },
              { label: 'Created', value: new Date(nscDetails.createdAt).toLocaleDateString() }
            ].map(({ label, value }) => (
              <div key={label}>
                <GroupuiText style={{ fontSize: '12px', color: '#6c757d', marginBottom: '4px' }}>{label}</GroupuiText>
                <GroupuiText weight="bold">{value}</GroupuiText>
              </div>
            ))}
          </div>
        </GroupuiCard>
      )}
    </div>
  );
};

export default OverviewTab;

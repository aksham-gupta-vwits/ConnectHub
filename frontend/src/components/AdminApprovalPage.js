import React, { useState, useEffect } from 'react';
import {
  GroupuiCard,
  GroupuiButton,
  GroupuiText,
  GroupuiHeadline,
  GroupuiLoadingSpinner,
  GroupuiAvatar,
  GroupuiTextarea
} from '@group-ui/group-ui-react';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/apiService';
import CustomNotification from './CustomNotification';

const AdminApprovalPage = () => {
  const { user, selectedNSC } = useAuth();
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (selectedNSC?.nscId) {
      // Clear any existing messages when switching NSCs or mounting
      setError('');
      setSuccessMessage('');
      fetchPendingUsers();
    }
  }, [selectedNSC]);

  // Cleanup messages when component unmounts
  useEffect(() => {
    return () => {
      setError('');
      setSuccessMessage('');
    };
  }, []);

  const fetchPendingUsers = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccessMessage(''); // Clear success message when fetching
      const response = await fetch(`/api/auth/pending-approvals/${selectedNSC.nscId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch pending users');
      }

      const data = await response.json();
      setPendingUsers(data.pendingUsers || []);
    } catch (error) {
      console.error('Failed to fetch pending users:', error);
      setError('Failed to load pending users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = async (userId, action, reason = '') => {
    try {
      setActionLoading(userId);
      setError('');

      const response = await fetch(`/api/auth/approve-user/${selectedNSC.nscId}/${userId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action, reason })
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action} user`);
      }

      // Remove user from pending list
      setPendingUsers(prev => prev.filter(user => user.id !== userId));
      setSuccessMessage(`User ${action}d successfully`);
    } catch (error) {
      console.error(`Failed to ${action} user:`, error);
      setError(`Failed to ${action} user. Please try again.`);
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!selectedNSC) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <GroupuiText style={{ color: '#6c757d' }}>
          Please select an NSC to view pending approvals
        </GroupuiText>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <GroupuiHeadline heading="h3" style={{ marginBottom: '8px' }}>
          Pending User Approvals
        </GroupuiHeadline>
        <GroupuiText style={{ color: '#6c757d' }}>
          {selectedNSC.nscName} - Review and approve new user registrations
        </GroupuiText>
      </div>

      {/* Notifications */}
      {error && (
        <CustomNotification
          type="error"
          message={error}
          isVisible={true}
          onClose={() => setError('')}
        />
      )}
      {successMessage && (
        <CustomNotification
          type="success"
          message={successMessage}
          isVisible={true}
          onClose={() => setSuccessMessage('')}
        />
      )}

      {/* Content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <GroupuiLoadingSpinner size="m" />
          <GroupuiText style={{ color: '#6c757d', marginTop: '16px' }}>
            Loading pending users...
          </GroupuiText>
        </div>
      ) : pendingUsers.length === 0 ? (
        <GroupuiCard style={{ padding: '40px', textAlign: 'center' }}>
          <span style={{ fontSize: '48px', opacity: 0.5 }}>✅</span>
          <GroupuiHeadline heading="h5" style={{ marginTop: '16px', marginBottom: '8px' }}>
            No Pending Approvals
          </GroupuiHeadline>
          <GroupuiText style={{ color: '#6c757d' }}>
            All user registrations have been reviewed. New requests will appear here.
          </GroupuiText>
        </GroupuiCard>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {pendingUsers.map(user => (
            <GroupuiCard key={user.id} style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                {/* User Avatar and Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                  <GroupuiAvatar 
                    size="l" 
                    name={`${user.firstName} ${user.lastName}`}
                  />
                  
                  <div style={{ flex: 1 }}>
                    <GroupuiHeadline heading="h6" style={{ marginBottom: '4px' }}>
                      {user.firstName} {user.lastName}
                    </GroupuiHeadline>
                    <GroupuiText style={{ color: '#6c757d', marginBottom: '2px' }}>
                      @{user.username}
                    </GroupuiText>
                    <GroupuiText style={{ color: '#6c757d', marginBottom: '8px' }}>
                      {user.email}
                    </GroupuiText>
                    <GroupuiText style={{ fontSize: '12px', color: '#6c757d' }}>
                      Requested: {formatDate(user.requestedAt)}
                    </GroupuiText>
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <GroupuiButton
                    variant="secondary"
                    size="s"
                    onClick={() => handleUserAction(user.id, 'reject')}
                    disabled={actionLoading === user.id}
                  >
                    {actionLoading === user.id ? (
                      <GroupuiLoadingSpinner size="s" />
                    ) : (
                      'Reject'
                    )}
                  </GroupuiButton>
                  
                  <GroupuiButton
                    variant="primary"
                    size="s"
                    onClick={() => handleUserAction(user.id, 'approve')}
                    disabled={actionLoading === user.id}
                  >
                    {actionLoading === user.id ? (
                      <GroupuiLoadingSpinner size="s" />
                    ) : (
                      'Approve'
                    )}
                  </GroupuiButton>
                </div>
              </div>
            </GroupuiCard>
          ))}
        </div>
      )}

      {/* Refresh Button */}
      <div style={{ textAlign: 'center', marginTop: '32px' }}>
        <GroupuiButton
          variant="secondary"
          onClick={fetchPendingUsers}
          disabled={loading}
        >
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <GroupuiLoadingSpinner size="s" />
              Refreshing...
            </div>
          ) : (
            'Refresh List'
          )}
        </GroupuiButton>
      </div>
    </div>
  );
};

export default AdminApprovalPage;

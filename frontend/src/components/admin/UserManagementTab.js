import React, { useState, useEffect } from 'react';
import {
  GroupuiCard,
  GroupuiButton,
  GroupuiText,
  GroupuiHeadline,
  GroupuiLoadingSpinner,
  GroupuiAvatar,
  GroupuiSelect,
  GroupuiSelectOption
} from '@group-ui/group-ui-react';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/apiService';
import CustomNotification from '../CustomNotification';

const UserManagementTab = () => {
  const { user: currentUser, selectedNSC } = useAuth();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pendingRoles, setPendingRoles] = useState({});
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    if (selectedNSC?.nscId) {
      loadData();
    }
  }, [selectedNSC]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [usersRes, rolesRes] = await Promise.all([
        apiService.getAllUsers(selectedNSC.nscId, '', { limit: 50 }),
        apiService.getRoles(selectedNSC.nscId)
      ]);
      setUsers(usersRes.users || []);
      setRoles(rolesRes.roles || []);
    } catch (err) {
      setError('Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (userId, roleId) => {
    setPendingRoles(prev => ({ ...prev, [userId]: roleId }));
  };

  const saveRole = async (userId) => {
    const roleId = pendingRoles[userId];
    if (!roleId) return;
    setActionLoading(`role-${userId}`);
    setError('');
    try {
      await apiService.updateUserRole(userId, selectedNSC.nscId, roleId);
      setUsers(prev => prev.map(u =>
        u.id === userId
          ? { ...u, role: roles.find(r => r.id === roleId) }
          : u
      ));
      setPendingRoles(prev => { const next = { ...prev }; delete next[userId]; return next; });
      setSuccess('Role updated successfully.');
    } catch (err) {
      setError('Failed to update role.');
    } finally {
      setActionLoading(null);
    }
  };

  const deactivateUser = async (userId) => {
    if (userId === currentUser?.id) {
      setError('You cannot deactivate your own account.');
      return;
    }
    setActionLoading(`deactivate-${userId}`);
    setError('');
    try {
      await apiService.deactivateUser(userId, selectedNSC.nscId);
      setUsers(prev => prev.filter(u => u.id !== userId));
      setSuccess('User deactivated.');
    } catch (err) {
      setError('Failed to deactivate user.');
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (date) => date
    ? new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    : 'Never';

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    return !q
      || u.firstName?.toLowerCase().includes(q)
      || u.lastName?.toLowerCase().includes(q)
      || u.email?.toLowerCase().includes(q)
      || u.username?.toLowerCase().includes(q);
  });

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px' }}>
        <GroupuiLoadingSpinner size="m" />
        <GroupuiText style={{ color: '#6c757d', marginTop: '16px' }}>Loading users...</GroupuiText>
      </div>
    );
  }

  return (
    <div style={{ padding: '32px', maxWidth: '1100px' }}>
      {error && <CustomNotification type="error" message={error} isVisible onClose={() => setError('')} />}
      {success && <CustomNotification type="success" message={success} isVisible onClose={() => setSuccess('')} />}

      <GroupuiHeadline heading="h3" style={{ marginBottom: '8px' }}>User Management</GroupuiHeadline>
      <GroupuiText style={{ color: '#6c757d', marginBottom: '24px' }}>
        {users.length} active user{users.length !== 1 ? 's' : ''} in {selectedNSC?.nscName}
      </GroupuiText>

      {/* Search */}
      <div style={{ marginBottom: '24px' }}>
        <input
          type="text"
          placeholder="Search by name, email, or username..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%',
            maxWidth: '400px',
            padding: '10px 14px',
            borderRadius: '6px',
            border: '1px solid #dee2e6',
            fontSize: '14px',
            outline: 'none',
            boxSizing: 'border-box'
          }}
        />
      </div>

      {filtered.length === 0 ? (
        <GroupuiCard style={{ padding: '40px', textAlign: 'center' }}>
          <GroupuiText style={{ color: '#6c757d' }}>No users found.</GroupuiText>
        </GroupuiCard>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {filtered.map(u => (
            <GroupuiCard key={u.id} style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <GroupuiAvatar size="m" name={`${u.firstName} ${u.lastName}`} />

                <div style={{ flex: 1, minWidth: '200px' }}>
                  <GroupuiText weight="bold">{u.firstName} {u.lastName}</GroupuiText>
                  <GroupuiText style={{ color: '#6c757d', fontSize: '13px' }}>@{u.username} · {u.email}</GroupuiText>
                  <GroupuiText style={{ color: '#6c757d', fontSize: '12px' }}>
                    Last login: {formatDate(u.lastLoginAt)}
                  </GroupuiText>
                </div>

                {/* Role selector */}
                {roles.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <GroupuiSelect
                      value={pendingRoles[u.id] ?? u.role?.id ?? ''}
                      onGroupuiChange={e => handleRoleChange(u.id, e.target.value)}
                      style={{ minWidth: '140px' }}
                    >
                      {roles.map(r => (
                        <GroupuiSelectOption key={r.id} value={r.id}>{r.name}</GroupuiSelectOption>
                      ))}
                    </GroupuiSelect>
                    {pendingRoles[u.id] && pendingRoles[u.id] !== u.role?.id && (
                      <GroupuiButton
                        variant="primary"
                        size="s"
                        onClick={() => saveRole(u.id)}
                        disabled={actionLoading === `role-${u.id}`}
                      >
                        {actionLoading === `role-${u.id}` ? <GroupuiLoadingSpinner size="s" /> : 'Save'}
                      </GroupuiButton>
                    )}
                  </div>
                )}

                {/* Deactivate */}
                {u.id !== currentUser?.id && (
                  <GroupuiButton
                    variant="secondary"
                    size="s"
                    onClick={() => deactivateUser(u.id)}
                    disabled={actionLoading === `deactivate-${u.id}`}
                  >
                    {actionLoading === `deactivate-${u.id}` ? <GroupuiLoadingSpinner size="s" /> : 'Deactivate'}
                  </GroupuiButton>
                )}
              </div>
            </GroupuiCard>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserManagementTab;

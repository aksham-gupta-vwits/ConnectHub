import React, { useState, useEffect } from 'react';
import {
  GroupuiCard,
  GroupuiButton,
  GroupuiText,
  GroupuiHeadline,
  GroupuiLoadingSpinner
} from '@group-ui/group-ui-react';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/apiService';
import CustomNotification from '../CustomNotification';

const ALL_PERMISSIONS = [
  { id: 'admin', name: 'Administrator', description: 'Full administrative access' },
  { id: 'manage_users', name: 'Manage Users', description: 'Add, remove, modify users' },
  { id: 'manage_channels', name: 'Manage Channels', description: 'Create, modify, delete channels' },
  { id: 'manage_roles', name: 'Manage Roles', description: 'Create, modify, delete roles' },
  { id: 'read_channels', name: 'Read Channels', description: 'View messages in channels' },
  { id: 'send_messages', name: 'Send Messages', description: 'Send messages in channels' },
  { id: 'join_public_channels', name: 'Join Public Channels', description: 'Join public channels' },
  { id: 'create_channels', name: 'Create Channels', description: 'Create new channels' },
  { id: 'delete_messages', name: 'Delete Messages', description: "Delete others' messages" },
  { id: 'invite_users', name: 'Invite Users', description: 'Invite external users' }
];

const DEFAULT_ROLES = ['Admin', 'Member'];

const PermissionCheckboxes = ({ selected, onChange }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '8px', marginTop: '8px' }}>
    {ALL_PERMISSIONS.map(p => (
      <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
        <input
          type="checkbox"
          checked={selected.includes(p.id)}
          onChange={e => {
            if (e.target.checked) onChange([...selected, p.id]);
            else onChange(selected.filter(x => x !== p.id));
          }}
        />
        <span title={p.description}>{p.name}</span>
      </label>
    ))}
  </div>
);

const RoleManagementTab = () => {
  const { selectedNSC } = useAuth();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  // Create form state
  const [showCreate, setShowCreate] = useState(false);
  const [newRole, setNewRole] = useState({ name: '', description: '', permissions: [] });

  // Edit state — keyed by role id
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});

  useEffect(() => {
    if (selectedNSC?.nscId) loadRoles();
  }, [selectedNSC]);

  const loadRoles = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiService.getRoles(selectedNSC.nscId);
      setRoles(res.roles || []);
    } catch (err) {
      setError('Failed to load roles.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newRole.name.trim()) { setError('Role name is required.'); return; }
    setActionLoading('create');
    setError('');
    try {
      const res = await apiService.createRole(selectedNSC.nscId, newRole);
      setRoles(prev => [...prev, res.role]);
      setNewRole({ name: '', description: '', permissions: [] });
      setShowCreate(false);
      setSuccess(`Role "${res.role.name}" created.`);
    } catch (err) {
      setError(err.message || 'Failed to create role.');
    } finally {
      setActionLoading(null);
    }
  };

  const startEdit = (role) => {
    setEditingId(role.id);
    setEditData({ name: role.name, description: role.description || '', permissions: [...role.permissions] });
  };

  const saveEdit = async (roleId) => {
    setActionLoading(`edit-${roleId}`);
    setError('');
    try {
      const res = await apiService.updateRole(selectedNSC.nscId, roleId, editData);
      setRoles(prev => prev.map(r => r.id === roleId ? { ...r, ...res.role } : r));
      setEditingId(null);
      setSuccess('Role updated.');
    } catch (err) {
      setError(err.message || 'Failed to update role.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (role) => {
    setActionLoading(`delete-${role.id}`);
    setError('');
    try {
      await apiService.deleteRole(selectedNSC.nscId, role.id);
      setRoles(prev => prev.filter(r => r.id !== role.id));
      setSuccess(`Role "${role.name}" deleted.`);
    } catch (err) {
      setError(err.message || 'Failed to delete role.');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px' }}>
        <GroupuiLoadingSpinner size="m" />
        <GroupuiText style={{ color: '#6c757d', marginTop: '16px' }}>Loading roles...</GroupuiText>
      </div>
    );
  }

  return (
    <div style={{ padding: '32px', maxWidth: '900px' }}>
      {error && <CustomNotification type="error" message={error} isVisible onClose={() => setError('')} />}
      {success && <CustomNotification type="success" message={success} isVisible onClose={() => setSuccess('')} />}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <GroupuiHeadline heading="h3" style={{ marginBottom: '4px' }}>Role Management</GroupuiHeadline>
          <GroupuiText style={{ color: '#6c757d' }}>{roles.length} role{roles.length !== 1 ? 's' : ''}</GroupuiText>
        </div>
        <GroupuiButton variant="primary" size="s" onClick={() => setShowCreate(v => !v)}>
          {showCreate ? 'Cancel' : '+ New Role'}
        </GroupuiButton>
      </div>

      {/* Create form */}
      {showCreate && (
        <GroupuiCard style={{ padding: '24px', marginBottom: '24px', backgroundColor: '#f8f9fa' }}>
          <GroupuiHeadline heading="h5" style={{ marginBottom: '16px' }}>Create New Role</GroupuiHeadline>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input
              placeholder="Role name *"
              value={newRole.name}
              onChange={e => setNewRole(p => ({ ...p, name: e.target.value }))}
              style={inputStyle}
            />
            <input
              placeholder="Description (optional)"
              value={newRole.description}
              onChange={e => setNewRole(p => ({ ...p, description: e.target.value }))}
              style={inputStyle}
            />
            <div>
              <GroupuiText style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>Permissions</GroupuiText>
              <PermissionCheckboxes
                selected={newRole.permissions}
                onChange={perms => setNewRole(p => ({ ...p, permissions: perms }))}
              />
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <GroupuiButton variant="primary" size="s" onClick={handleCreate} disabled={actionLoading === 'create'}>
                {actionLoading === 'create' ? <GroupuiLoadingSpinner size="s" /> : 'Create Role'}
              </GroupuiButton>
              <GroupuiButton variant="secondary" size="s" onClick={() => setShowCreate(false)}>Cancel</GroupuiButton>
            </div>
          </div>
        </GroupuiCard>
      )}

      {/* Role list */}
      <div style={{ display: 'grid', gap: '12px' }}>
        {roles.map(role => (
          <GroupuiCard key={role.id} style={{ padding: '20px' }}>
            {editingId === role.id ? (
              /* Edit mode */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <input
                  value={editData.name}
                  onChange={e => setEditData(p => ({ ...p, name: e.target.value }))}
                  disabled={role.name === 'Admin'}
                  style={inputStyle}
                />
                <input
                  placeholder="Description"
                  value={editData.description}
                  onChange={e => setEditData(p => ({ ...p, description: e.target.value }))}
                  style={inputStyle}
                />
                <div>
                  <GroupuiText style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>Permissions</GroupuiText>
                  <PermissionCheckboxes
                    selected={editData.permissions}
                    onChange={perms => setEditData(p => ({ ...p, permissions: perms }))}
                  />
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <GroupuiButton variant="primary" size="s" onClick={() => saveEdit(role.id)} disabled={actionLoading === `edit-${role.id}`}>
                    {actionLoading === `edit-${role.id}` ? <GroupuiLoadingSpinner size="s" /> : 'Save'}
                  </GroupuiButton>
                  <GroupuiButton variant="secondary" size="s" onClick={() => setEditingId(null)}>Cancel</GroupuiButton>
                </div>
              </div>
            ) : (
              /* View mode */
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                    <GroupuiText weight="bold">{role.name}</GroupuiText>
                    <span style={{
                      fontSize: '11px',
                      backgroundColor: '#e9ecef',
                      color: '#495057',
                      borderRadius: '10px',
                      padding: '2px 8px'
                    }}>
                      {role.userCount} user{role.userCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                  {role.description && (
                    <GroupuiText style={{ color: '#6c757d', fontSize: '13px', marginBottom: '8px' }}>
                      {role.description}
                    </GroupuiText>
                  )}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {role.permissions.map(p => (
                      <span key={p} style={{
                        fontSize: '11px',
                        backgroundColor: '#dbeafe',
                        color: '#1d4ed8',
                        borderRadius: '4px',
                        padding: '2px 8px'
                      }}>
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <GroupuiButton variant="secondary" size="s" onClick={() => startEdit(role)}>Edit</GroupuiButton>
                  <GroupuiButton
                    variant="secondary"
                    size="s"
                    onClick={() => handleDelete(role)}
                    disabled={DEFAULT_ROLES.includes(role.name) || actionLoading === `delete-${role.id}`}
                  >
                    {actionLoading === `delete-${role.id}` ? <GroupuiLoadingSpinner size="s" /> : 'Delete'}
                  </GroupuiButton>
                </div>
              </div>
            )}
          </GroupuiCard>
        ))}
      </div>
    </div>
  );
};

const inputStyle = {
  padding: '10px 14px',
  borderRadius: '6px',
  border: '1px solid #dee2e6',
  fontSize: '14px',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box'
};

export default RoleManagementTab;

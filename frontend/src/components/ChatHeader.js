import React from 'react';
import { useHistory } from 'react-router-dom';
import {
  GroupuiText,
  GroupuiSelect,
  GroupuiSelectOption,
  GroupuiButton
} from '@group-ui/group-ui-react';

const ChatHeader = ({
  selectedNSC,
  availableNSCs,
  socketConnected,
  activeTitle,
  user,
  onNSCChange
}) => {
  const history = useHistory();

  // Check if user is admin
  const isAdmin = () => {
    if (!user || !user.nscMemberships || !selectedNSC) return false;
    const userRole = user.nscMemberships.find((u) => u.nscId === selectedNSC.nscId)?.role;
    return userRole?.toUpperCase() === 'ADMIN';
  };
  return (
    <div style={{
      height: '60px',
      backgroundColor: '#ffffff',
      borderBottom: '1px solid #e0e0e0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <GroupuiText weight="bold" style={{ fontSize: '18px' }}>
          {activeTitle}
        </GroupuiText>
        {selectedNSC && (
          <GroupuiText style={{ color: '#6c757d', fontSize: '14px' }}>
            {selectedNSC.region}
          </GroupuiText>
        )}
        {/* Socket connection status */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '6px',
          marginLeft: '16px'
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: socketConnected ? '#2ed573' : '#ff4757'
          }}></div>
          <GroupuiText style={{ 
            color: '#6c757d', 
            fontSize: '12px' 
          }}>
            {socketConnected ? 'Connected' : 'Disconnected'}
          </GroupuiText>
        </div>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Admin Approval Button */}
        {isAdmin() && (
          <GroupuiButton
            variant="secondary"
            size="s"
            onClick={() => history.push('/admin')}
          >
            Admin
          </GroupuiButton>
        )}
        
        {/* NSC Selector */}
        {availableNSCs.length > 1 && (
          <GroupuiSelect 
            value={selectedNSC?.nscId} 
            onGroupuiChange={onNSCChange}
            style={{ minWidth: '200px' }}
          >
            {availableNSCs.map(nsc => (
              <GroupuiSelectOption key={nsc.nscId} value={nsc.nscId}>
                {nsc.nscName}
              </GroupuiSelectOption>
            ))}
          </GroupuiSelect>
        )}
      </div>
    </div>
  );
};

export default ChatHeader;
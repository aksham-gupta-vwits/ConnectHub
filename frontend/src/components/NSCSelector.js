import React, { useState } from 'react';
import { GroupuiCard, GroupuiButton, GroupuiText, GroupuiIcon } from '@group-ui/group-ui-react';
import { useAuth } from '../contexts/AuthContext';

const NSCSelector = () => {
  const { availableNSCs, selectNSC, user } = useAuth();
  const [selectedNscId, setSelectedNscId] = useState(null);

  const handleSelectNSC = () => {
    const nsc = availableNSCs.find(n => n.id === selectedNscId);
    if (nsc) {
      selectNSC(nsc);
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#f8f9fa',
      padding: '20px'
    }}>
      <GroupuiCard style={{ 
        maxWidth: '500px', 
        width: '100%',
        padding: '32px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <GroupuiIcon 
            name="business-24" 
            style={{ 
              fontSize: '48px', 
              color: '#4a154b',
              marginBottom: '16px'
            }}
          />
          <GroupuiText variant="h4" style={{ marginBottom: '8px' }}>
            Welcome to ConnectHub
          </GroupuiText>
          <GroupuiText variant="body1" style={{ color: '#6c757d' }}>
            Hello {user?.firstName}! Please select your NSC to continue.
          </GroupuiText>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <GroupuiText variant="h6" style={{ marginBottom: '16px' }}>
            Available NSCs:
          </GroupuiText>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {availableNSCs.map((nsc) => (
              <div
                key={nsc.id}
                onClick={() => setSelectedNscId(nsc.id)}
                style={{
                  padding: '16px',
                  border: selectedNscId === nsc.id ? '2px solid #4a154b' : '1px solid #e0e0e0',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  backgroundColor: selectedNscId === nsc.id ? '#f8f4fc' : 'white',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <GroupuiIcon 
                    name="office-24" 
                    style={{ color: '#4a154b' }}
                  />
                  <div>
                    <GroupuiText variant="subtitle1" style={{ fontWeight: 'bold' }}>
                      {nsc.name}
                    </GroupuiText>
                    <GroupuiText variant="body2" style={{ color: '#6c757d' }}>
                      {nsc.region} • {nsc.country}
                    </GroupuiText>
                  </div>
                  {selectedNscId === nsc.id && (
                    <GroupuiIcon 
                      name="check-circle-24" 
                      style={{ color: '#4a154b', marginLeft: 'auto' }}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <GroupuiButton
          variant="primary"
          size="large"
          onClick={handleSelectNSC}
          disabled={!selectedNscId}
          style={{ 
            width: '100%',
            backgroundColor: '#4a154b',
            borderColor: '#4a154b'
          }}
        >
          Continue to {selectedNscId ? availableNSCs.find(n => n.id === selectedNscId)?.name : 'NSC'}
        </GroupuiButton>
      </GroupuiCard>
    </div>
  );
};

export default NSCSelector;

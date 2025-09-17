import React from 'react';
import { GroupuiLoading, GroupuiText } from '@group-ui/group-ui-react';

const LoadingSpinner = ({ text = 'Loading...', size = 'medium' }) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      backgroundColor: '#f8f9fa',
      gap: '16px'
    }}>
      <GroupuiLoading size={size} />
      <GroupuiText variant="body1" style={{ color: '#6c757d' }}>
        {text}
      </GroupuiText>
    </div>
  );
};

export default LoadingSpinner;

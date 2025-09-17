import React from 'react';
import { GroupuiButton } from '@group-ui/group-ui-react';

const MessageInput = ({
  activeChannel,
  newMessage,
  onMessageChange,
  onSubmit,
  getActiveTitle,
  disabled = false
}) => {
  if (!activeChannel) {
    return null;
  }

  return (
    <div style={{
      padding: '16px 24px',
      borderTop: '1px solid #e0e0e0',
      backgroundColor: 'white'
    }}>
      <form onSubmit={onSubmit} style={{ display: 'flex', gap: '12px' }}>
        <input
          type="text"
          value={newMessage}
          onChange={onMessageChange}
          placeholder={`Message ${getActiveTitle()}`}
          disabled={disabled}
          style={{ 
            flex: 1,
            padding: '12px 16px',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            fontSize: '14px',
            outline: 'none',
            boxSizing: 'border-box',
            backgroundColor: disabled ? '#f5f5f5' : 'white',
            color: disabled ? '#999' : '#333'
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#008075';
            e.target.style.boxShadow = '0 0 0 2px rgba(0, 128, 117, 0.1)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#d1d5db';
            e.target.style.boxShadow = 'none';
          }}
        />
        <GroupuiButton 
          type="submit" 
          variant="primary" 
          disabled={!newMessage.trim() || disabled}
        >
          Send
        </GroupuiButton>
      </form>
    </div>
  );
};

export default MessageInput;
import React, { useState } from 'react';
import { GroupuiInput, GroupuiButton, GroupuiIcon, GroupuiAvatar, GroupuiText } from '@group-ui/group-ui-react';
import { useAuth } from '../contexts/AuthContext';

const Header = ({ onToggleSidebar, isSidebarOpen }) => {
  const { user, selectedNSC, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    console.log('Searching for:', searchQuery);
    // Implement search functionality
  };

  return (
    <header style={{
      height: '60px',
      backgroundColor: '#4a154b',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 16px',
      borderBottom: '1px solid #522653',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000
    }}>
      {/* Left Section - Logo and Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Mobile Menu Toggle */}
        <GroupuiButton 
          variant="ghost" 
          size="small"
          style={{ 
            color: 'white',
            display: window.innerWidth <= 768 ? 'block' : 'none',
            minWidth: 'auto',
            padding: '8px'
          }}
          onClick={onToggleSidebar}
        >
          <GroupuiIcon name="menu-24" style={{ color: 'white' }}></GroupuiIcon>
        </GroupuiButton>

        {/* Logo and NSC Name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            backgroundColor: 'white',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            color: '#4a154b',
            fontSize: '18px'
          }}>
            C
          </div>
          <div>
            <GroupuiText style={{ color: 'white', fontWeight: 'bold', fontSize: '18px' }}>
              ConnectHub
            </GroupuiText>
            {selectedNSC && (
              <GroupuiText style={{ color: '#d1c4e9', fontSize: '12px' }}>
                {selectedNSC.name}
              </GroupuiText>
            )}
          </div>
        </div>
      </div>

      {/* Center Section - Search */}
      <div style={{ 
        flex: 1, 
        maxWidth: '600px', 
        margin: '0 32px',
        display: window.innerWidth <= 768 ? 'none' : 'block'
      }}>
        <form onSubmit={handleSearch} style={{ position: 'relative' }}>
          <GroupuiInput
            value={searchQuery}
            onInput={(e) => setSearchQuery(e.target.value)}
            placeholder="Search ConnectHub"
            style={{
              width: '100%',
              backgroundColor: '#522653',
              border: '1px solid #6a1b66',
              color: 'white',
              borderRadius: '6px'
            }}
          />
          <div style={{
            position: 'absolute',
            right: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'none'
          }}>
            <GroupuiIcon name="search-24" style={{ color: '#d1c4e9' }}></GroupuiIcon>
          </div>
        </form>
      </div>

      {/* Right Section - User Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Notifications */}
        <GroupuiButton 
          variant="ghost" 
          size="small"
          style={{ 
            color: 'white',
            minWidth: 'auto',
            padding: '8px'
          }}
        >
          <GroupuiIcon name="bell-24" style={{ color: 'white' }}></GroupuiIcon>
        </GroupuiButton>

        {/* Help */}
        <GroupuiButton 
          variant="ghost" 
          size="small"
          style={{ 
            color: 'white',
            minWidth: 'auto',
            padding: '8px'
          }}
        >
          <GroupuiIcon name="help-24" style={{ color: 'white' }}></GroupuiIcon>
        </GroupuiButton>

        {/* User Avatar and Info */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px',
          cursor: 'pointer',
          padding: '4px 8px',
          borderRadius: '6px',
          backgroundColor: 'rgba(255,255,255,0.1)'
        }}>
          <GroupuiAvatar 
            size="small"
            style={{ backgroundColor: '#e91e63' }}
          >
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </GroupuiAvatar>
          <div style={{ display: window.innerWidth <= 480 ? 'none' : 'block' }}>
            <GroupuiText style={{ color: 'white', fontSize: '14px', fontWeight: '500' }}>
              {user?.firstName} {user?.lastName}
            </GroupuiText>
            <GroupuiText style={{ color: '#d1c4e9', fontSize: '12px' }}>
              🟢 Active
            </GroupuiText>
          </div>
        </div>

        {/* Settings/Logout */}
        <GroupuiButton 
          variant="ghost" 
          size="small"
          style={{ 
            color: 'white',
            minWidth: 'auto',
            padding: '8px'
          }}
          onClick={logout}
        >
          <GroupuiIcon name="logout-24" style={{ color: 'white' }}></GroupuiIcon>
        </GroupuiButton>
      </div>
    </header>
  );
};

export default Header;

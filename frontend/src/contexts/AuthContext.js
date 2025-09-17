import React, { createContext, useContext, useState, useEffect } from 'react';
import socketService from '../services/socketService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [selectedNSC, setSelectedNSC] = useState(null);
  const [availableNSCs, setAvailableNSCs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    const nscData = localStorage.getItem('selectedNSC');

    if (token && userData) {
      setIsAuthenticated(true);
      const user = JSON.parse(userData);
      setUser(user);
      if (nscData) {
        setSelectedNSC(JSON.parse(nscData));
      }
      // Load available NSCs for the user
      loadAvailableNSCs();
      
      // Note: Socket connection will be handled in ChatPage when both user and selectedNSC are available
    }
    setLoading(false);
  }, []);

  const loadAvailableNSCs = async () => {
    try {
      const response = await fetch('/api/users/profile', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        const nscs = data.user.nscMemberships.map(membership => ({
          nscId: membership.nsc.id,
          nscName: membership.nsc.name,
          region: membership.nsc.region,
          subdomain: membership.nsc.subdomain
        }));
        setAvailableNSCs(nscs);
      }
    } catch (error) {
      console.error('Failed to load NSCs:', error);
    }
  };

  const login = async (credentials) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials)
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        if (data.user.nscMemberships) {
          setSelectedNSC(data.user.nscMemberships[0]);
          localStorage.setItem('selectedNSC', JSON.stringify(data.user.nscMemberships[0]));
        }
        setUser(data.user);
        setAvailableNSCs(data.nscs || []);
        
        // Connect to Socket.IO
        try {
          await socketService.connect(data.token);
        } catch (socketError) {
          console.error('Failed to connect to real-time service:', socketError);
          // Don't fail login if socket connection fails
        }
        setIsAuthenticated(true);
        return { success: true };
      } else {
        const error = await response.json();
        return { success: false, error: error.message };
      }
    } catch (error) {
      return { success: false, error: 'Connection failed' };
    }
  };

  const logout = () => {
    // Disconnect from Socket.IO
    socketService.disconnect();
    
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('selectedNSC');
    setIsAuthenticated(false);
    setUser(null);
    setSelectedNSC(null);
    setAvailableNSCs([]);
  };

  const selectNSC = (nsc) => {
    const selected = availableNSCs.find(item => item.nscId === nsc?.target?.value);
    setSelectedNSC(selected);
    localStorage.setItem('selectedNSC', JSON.stringify(selected));
  };

  const value = {
    isAuthenticated,
    user,
    selectedNSC,
    availableNSCs,
    loading,
    login,
    logout,
    selectNSC
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

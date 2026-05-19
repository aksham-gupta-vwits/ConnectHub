// API service for ConnectHub frontend
const API_BASE_URL = '/api';

class APIService {
  constructor() {
    this.getAuthHeader = () => ({
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json'
    });
  }

  // Channel API methods
  async getChannels(nscId, type = null) {
    const url = type ? `${API_BASE_URL}/channels/${nscId}?type=${type}` : `${API_BASE_URL}/channels/${nscId}`;
    const response = await fetch(url, {
      headers: this.getAuthHeader()
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch channels: ${response.statusText}`);
    }
    
    return response.json();
  }

  async getDirectMessages(nscId) {
    const response = await fetch(`${API_BASE_URL}/channels/${nscId}/direct`, {
      headers: this.getAuthHeader()
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch direct messages: ${response.statusText}`);
    }
    
    return response.json();
  }

  async createOrGetDirectMessage(nscId, targetUserId) {
    const response = await fetch(`${API_BASE_URL}/channels/${nscId}/direct/${targetUserId}`, {
      method: 'POST',
      headers: this.getAuthHeader()
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create/get direct message: ${response.statusText}`);
    }
    
    return response.json();
  }

  async createGroupChannel(nscId, groupData) {
    const response = await fetch(`${API_BASE_URL}/channels/${nscId}/group`, {
      method: 'POST',
      headers: this.getAuthHeader(),
      body: JSON.stringify(groupData)
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create group: ${response.statusText}`);
    }
    
    return response.json();
  }

  async createChannel(nscId, channelData) {
    const response = await fetch(`${API_BASE_URL}/channels/${nscId}`, {
      method: 'POST',
      headers: this.getAuthHeader(),
      body: JSON.stringify(channelData)
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create channel: ${response.statusText}`);
    }
    
    return response.json();
  }

  async createPublicChannel(nscId, channelData) {
    const response = await fetch(`${API_BASE_URL}/channels/${nscId}`, {
      method: 'POST',
      headers: this.getAuthHeader(),
      body: JSON.stringify({
        ...channelData,
        type: 'PUBLIC'
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create public channel: ${response.statusText}`);
    }
    
    return response.json();
  }

  async getChannelDetails(nscId, channelId) {
    const response = await fetch(`${API_BASE_URL}/channels/${nscId}/${channelId}`, {
      headers: this.getAuthHeader()
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch channel details: ${response.statusText}`);
    }
    
    return response.json();
  }

  async joinChannel(nscId, channelId) {
    const response = await fetch(`${API_BASE_URL}/channels/${nscId}/${channelId}/join`, {
      method: 'POST',
      headers: this.getAuthHeader()
    });
    
    if (!response.ok) {
      throw new Error(`Failed to join channel: ${response.statusText}`);
    }
    
    return response.json();
  }

  async leaveChannel(nscId, channelId) {
    const response = await fetch(`${API_BASE_URL}/channels/${nscId}/${channelId}/leave`, {
      method: 'POST',
      headers: this.getAuthHeader()
    });
    
    if (!response.ok) {
      throw new Error(`Failed to leave channel: ${response.statusText}`);
    }
    
    return response.json();
  }

  async archiveDirectMessage(nscId, channelId) {
    const response = await fetch(`${API_BASE_URL}/channels/${nscId}/${channelId}/archive`, {
      method: 'POST',
      headers: this.getAuthHeader()
    });
    
    if (!response.ok) {
      throw new Error(`Failed to archive direct message: ${response.statusText}`);
    }
    
    return response.json();
  }

  // Message API methods
  async getMessages(nscId, channelId, options = {}) {
    let url = `${API_BASE_URL}/messages/${nscId}/${channelId}`;
    const params = new URLSearchParams();
    
    if (options.limit) params.append('limit', options.limit);
    if (options.offset) params.append('offset', options.offset);
    if (options.before) params.append('before', options.before);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    const response = await fetch(url, {
      headers: this.getAuthHeader()
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch messages: ${response.statusText}`);
    }
    
    return response.json();
  }

  async sendMessage(nscId, channelId, messageData) {
    const response = await fetch(`${API_BASE_URL}/messages/${nscId}/${channelId}`, {
      method: 'POST',
      headers: this.getAuthHeader(),
      body: JSON.stringify(messageData)
    });
    
    if (!response.ok) {
      throw new Error(`Failed to send message: ${response.statusText}`);
    }
    
    return response.json();
  }

  async updateMessage(nscId, channelId, messageId, content) {
    const response = await fetch(`${API_BASE_URL}/messages/${nscId}/${channelId}/${messageId}`, {
      method: 'PUT',
      headers: this.getAuthHeader(),
      body: JSON.stringify({ content })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update message: ${response.statusText}`);
    }
    
    return response.json();
  }

  async deleteMessage(nscId, channelId, messageId) {
    const response = await fetch(`${API_BASE_URL}/messages/${nscId}/${channelId}/${messageId}`, {
      method: 'DELETE',
      headers: this.getAuthHeader()
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete message: ${response.statusText}`);
    }
    
    return response.json();
  }

  // User API methods
  async searchUsers(nscId, query = '', options = {}) {
    let url = `${API_BASE_URL}/users/search/${nscId}`;
    const params = new URLSearchParams();
    
    if (query) params.append('q', query);
    if (options.limit) params.append('limit', options.limit);
    if (options.offset) params.append('offset', options.offset);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    const response = await fetch(url, {
      headers: this.getAuthHeader()
    });
    
    if (!response.ok) {
      throw new Error(`Failed to search users: ${response.statusText}`);
    }
    
    return response.json();
  }

  // Authentication API methods
  async login(credentials) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(credentials)
    });
    
    if (!response.ok) {
      throw new Error(`Login failed: ${response.statusText}`);
    }
    
    return response.json();
  }

  async logout() {
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: this.getAuthHeader()
    });
    
    // Don't throw error for logout - just return the result
    return response.ok;
  }

  async verifyToken() {
    const response = await fetch(`${API_BASE_URL}/auth/verify`, {
      headers: this.getAuthHeader()
    });
    
    if (!response.ok) {
      throw new Error(`Token verification failed: ${response.statusText}`);
    }
    
    return response.json();
  }

  // Public API methods (no auth required)
  async getAvailableNSCs() {
    const response = await fetch(`${API_BASE_URL}/nsc/available`);

    if (!response.ok) {
      throw new Error(`Failed to fetch available NSCs: ${response.statusText}`);
    }

    return response.json();
  }

  // Admin API methods
  async getNSCStats(nscId) {
    const response = await fetch(`${API_BASE_URL}/nsc/${nscId}/stats`, {
      headers: this.getAuthHeader()
    });
    if (!response.ok) throw new Error(`Failed to fetch NSC stats: ${response.statusText}`);
    return response.json();
  }

  async getAllUsers(nscId, query = '', options = {}) {
    let url = `${API_BASE_URL}/users/search/${nscId}`;
    const params = new URLSearchParams();
    if (query) params.append('q', query);
    if (options.limit) params.append('limit', options.limit);
    if (options.offset) params.append('offset', options.offset);
    if (params.toString()) url += `?${params.toString()}`;
    const response = await fetch(url, { headers: this.getAuthHeader() });
    if (!response.ok) throw new Error(`Failed to fetch users: ${response.statusText}`);
    return response.json();
  }

  async getUserDetails(userId, nscId) {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/details/${nscId}`, {
      headers: this.getAuthHeader()
    });
    if (!response.ok) throw new Error(`Failed to fetch user details: ${response.statusText}`);
    return response.json();
  }

  async updateUserRole(userId, nscId, roleId) {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/role/${nscId}`, {
      method: 'PUT',
      headers: this.getAuthHeader(),
      body: JSON.stringify({ roleId })
    });
    if (!response.ok) throw new Error(`Failed to update user role: ${response.statusText}`);
    return response.json();
  }

  async deactivateUser(userId, nscId) {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/deactivate/${nscId}`, {
      method: 'PUT',
      headers: this.getAuthHeader()
    });
    if (!response.ok) throw new Error(`Failed to deactivate user: ${response.statusText}`);
    return response.json();
  }

  async getRoles(nscId) {
    const response = await fetch(`${API_BASE_URL}/roles/${nscId}`, {
      headers: this.getAuthHeader()
    });
    if (!response.ok) throw new Error(`Failed to fetch roles: ${response.statusText}`);
    return response.json();
  }

  async createRole(nscId, roleData) {
    const response = await fetch(`${API_BASE_URL}/roles/${nscId}`, {
      method: 'POST',
      headers: this.getAuthHeader(),
      body: JSON.stringify(roleData)
    });
    if (!response.ok) throw new Error(`Failed to create role: ${response.statusText}`);
    return response.json();
  }

  async updateRole(nscId, roleId, roleData) {
    const response = await fetch(`${API_BASE_URL}/roles/${nscId}/${roleId}`, {
      method: 'PUT',
      headers: this.getAuthHeader(),
      body: JSON.stringify(roleData)
    });
    if (!response.ok) throw new Error(`Failed to update role: ${response.statusText}`);
    return response.json();
  }

  async deleteRole(nscId, roleId) {
    const response = await fetch(`${API_BASE_URL}/roles/${nscId}/${roleId}`, {
      method: 'DELETE',
      headers: this.getAuthHeader()
    });
    if (!response.ok) throw new Error(`Failed to delete role: ${response.statusText}`);
    return response.json();
  }

  async getPendingApprovals(nscId) {
    const response = await fetch(`${API_BASE_URL}/auth/pending-approvals/${nscId}`, {
      headers: this.getAuthHeader()
    });
    if (!response.ok) throw new Error(`Failed to fetch pending approvals: ${response.statusText}`);
    return response.json();
  }

  async approveUser(nscId, userId, action, reason = '') {
    const response = await fetch(`${API_BASE_URL}/auth/approve-user/${nscId}/${userId}`, {
      method: 'POST',
      headers: this.getAuthHeader(),
      body: JSON.stringify({ action, reason })
    });
    if (!response.ok) throw new Error(`Failed to ${action} user: ${response.statusText}`);
    return response.json();
  }
}

// Create and export a singleton instance
const apiService = new APIService();
export default apiService;

// Export the class for testing purposes
export { APIService };

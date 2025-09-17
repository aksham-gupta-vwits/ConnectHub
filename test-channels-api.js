const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:8080';
const API_URL = `${BASE_URL}/api`;

// Test credentials - update these with actual test values
const TEST_NSC_ID = 'test-nsc-id';
const TEST_USER_EMAIL = 'test@example.com';
const TEST_USER_PASSWORD = 'testpassword';

let authToken = '';
let testUserId = '';
let testChannelId = '';
let testDirectChannelId = '';
let testGroupChannelId = '';

// Helper function to make authenticated requests
const makeRequest = async (method, url, data = null) => {
  const config = {
    method,
    url: `${API_URL}${url}`,
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    }
  };
  
  if (data) {
    config.data = data;
  }
  
  try {
    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message, 
      status: error.response?.status 
    };
  }
};

async function testAuthentication() {
  console.log('\n🔐 Testing Authentication...');
  
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD
    });
    
    authToken = response.data.token;
    testUserId = response.data.user.id;
    
    console.log('✅ Authentication successful');
    console.log(`   User ID: ${testUserId}`);
    console.log(`   Token length: ${authToken.length}`);
    
    return true;
  } catch (error) {
    console.log('❌ Authentication failed:', error.response?.data || error.message);
    return false;
  }
}

async function testChannelCreation() {
  console.log('\n📁 Testing Channel Creation...');
  
  // Test creating a PUBLIC channel
  const publicChannelResult = await makeRequest('POST', `/channels/${TEST_NSC_ID}`, {
    name: 'test-public-channel',
    description: 'Test public channel',
    type: 'PUBLIC'
  });
  
  if (publicChannelResult.success) {
    testChannelId = publicChannelResult.data.channel.id;
    console.log('✅ Public channel created:', publicChannelResult.data.channel.name);
  } else {
    console.log('❌ Public channel creation failed:', publicChannelResult.error);
  }
  
  // Test creating a PRIVATE channel
  const privateChannelResult = await makeRequest('POST', `/channels/${TEST_NSC_ID}`, {
    name: 'test-private-channel',
    description: 'Test private channel',
    type: 'PRIVATE'
  });
  
  if (privateChannelResult.success) {
    console.log('✅ Private channel created:', privateChannelResult.data.channel.name);
  } else {
    console.log('❌ Private channel creation failed:', privateChannelResult.error);
  }
  
  // Test creating a GROUP channel
  const groupChannelResult = await makeRequest('POST', `/channels/${TEST_NSC_ID}/group`, {
    name: 'test-group-chat',
    description: 'Test group chat',
    memberIds: [testUserId] // At least one member required
  });
  
  if (groupChannelResult.success) {
    testGroupChannelId = groupChannelResult.data.channel.id;
    console.log('✅ Group channel created:', groupChannelResult.data.channel.name);
  } else {
    console.log('❌ Group channel creation failed:', groupChannelResult.error);
  }
}

async function testDirectMessages() {
  console.log('\n💬 Testing Direct Messages...');
  
  // First, get list of users to find someone to DM
  const usersResult = await makeRequest('GET', `/users/${TEST_NSC_ID}`);
  
  if (!usersResult.success) {
    console.log('❌ Could not fetch users for DM test');
    return;
  }
  
  const otherUser = usersResult.data.users.find(user => user.id !== testUserId);
  
  if (!otherUser) {
    console.log('⚠️  No other users found for DM test');
    return;
  }
  
  // Test creating/getting a direct message channel
  const dmResult = await makeRequest('POST', `/channels/${TEST_NSC_ID}/direct/${otherUser.id}`);
  
  if (dmResult.success) {
    testDirectChannelId = dmResult.data.channel.id;
    console.log('✅ Direct message channel created/retrieved');
    console.log(`   Channel ID: ${testDirectChannelId}`);
    console.log(`   Other user: ${otherUser.firstName} ${otherUser.lastName}`);
  } else {
    console.log('❌ Direct message creation failed:', dmResult.error);
  }
  
  // Test getting DM list
  const dmListResult = await makeRequest('GET', `/channels/${TEST_NSC_ID}/direct`);
  
  if (dmListResult.success) {
    console.log('✅ Direct message list retrieved');
    console.log(`   Found ${dmListResult.data.conversations.length} conversations`);
  } else {
    console.log('❌ Direct message list retrieval failed:', dmListResult.error);
  }
}

async function testChannelListing() {
  console.log('\n📋 Testing Channel Listing...');
  
  // Test getting all channels
  const allChannelsResult = await makeRequest('GET', `/channels/${TEST_NSC_ID}`);
  
  if (allChannelsResult.success) {
    console.log('✅ All channels retrieved');
    console.log(`   Found ${allChannelsResult.data.channels.length} channels`);
    
    const channelsByType = allChannelsResult.data.channels.reduce((acc, channel) => {
      acc[channel.type] = (acc[channel.type] || 0) + 1;
      return acc;
    }, {});
    
    console.log('   Channel breakdown:', channelsByType);
  } else {
    console.log('❌ Channel listing failed:', allChannelsResult.error);
  }
  
  // Test filtering by type
  const publicChannelsResult = await makeRequest('GET', `/channels/${TEST_NSC_ID}?type=PUBLIC`);
  
  if (publicChannelsResult.success) {
    console.log('✅ Public channels filtered successfully');
    console.log(`   Found ${publicChannelsResult.data.channels.length} public channels`);
  } else {
    console.log('❌ Public channel filtering failed:', publicChannelsResult.error);
  }
}

async function testChannelDetails() {
  console.log('\n🔍 Testing Channel Details...');
  
  if (!testChannelId) {
    console.log('⚠️  No test channel ID available');
    return;
  }
  
  const channelDetailsResult = await makeRequest('GET', `/channels/${TEST_NSC_ID}/${testChannelId}`);
  
  if (channelDetailsResult.success) {
    const channel = channelDetailsResult.data.channel;
    console.log('✅ Channel details retrieved');
    console.log(`   Name: ${channel.name}`);
    console.log(`   Type: ${channel.type}`);
    console.log(`   Members: ${channel.members.length}`);
    console.log(`   Messages: ${channel.messageCount}`);
  } else {
    console.log('❌ Channel details retrieval failed:', channelDetailsResult.error);
  }
}

async function testMessaging() {
  console.log('\n📨 Testing Messaging...');
  
  const channelToTest = testChannelId || testDirectChannelId;
  
  if (!channelToTest) {
    console.log('⚠️  No channel available for messaging test');
    return;
  }
  
  // Test sending a message
  const sendResult = await makeRequest('POST', `/messages/${TEST_NSC_ID}/${channelToTest}`, {
    content: 'Test message from API test suite',
    type: 'TEXT'
  });
  
  if (sendResult.success) {
    console.log('✅ Message sent successfully');
    
    const messageId = sendResult.data.data.id;
    
    // Test getting messages
    const messagesResult = await makeRequest('GET', `/messages/${TEST_NSC_ID}/${channelToTest}`);
    
    if (messagesResult.success) {
      console.log('✅ Messages retrieved successfully');
      console.log(`   Found ${messagesResult.data.messages.length} messages`);
      
      // Find our test message
      const testMessage = messagesResult.data.messages.find(msg => msg.id === messageId);
      if (testMessage) {
        console.log('✅ Test message found in results');
      } else {
        console.log('⚠️  Test message not found in results');
      }
    } else {
      console.log('❌ Message retrieval failed:', messagesResult.error);
    }
  } else {
    console.log('❌ Message sending failed:', sendResult.error);
  }
}

async function testChannelOperations() {
  console.log('\n⚙️  Testing Channel Operations...');
  
  if (!testChannelId) {
    console.log('⚠️  No test channel ID available');
    return;
  }
  
  // Test joining channel (should already be joined as creator)
  const joinResult = await makeRequest('POST', `/channels/${TEST_NSC_ID}/${testChannelId}/join`);
  
  if (joinResult.success || joinResult.status === 409) {
    console.log('✅ Channel join tested (already a member or successful)');
  } else {
    console.log('❌ Channel join failed:', joinResult.error);
  }
  
  // Test updating channel
  const updateResult = await makeRequest('PUT', `/channels/${TEST_NSC_ID}/${testChannelId}`, {
    description: 'Updated test channel description'
  });
  
  if (updateResult.success) {
    console.log('✅ Channel updated successfully');
  } else {
    console.log('❌ Channel update failed:', updateResult.error);
  }
}

async function testErrorCases() {
  console.log('\n❌ Testing Error Cases...');
  
  // Test accessing non-existent channel
  const nonExistentResult = await makeRequest('GET', `/channels/${TEST_NSC_ID}/non-existent-id`);
  
  if (nonExistentResult.status === 404) {
    console.log('✅ Non-existent channel returns 404 as expected');
  } else {
    console.log('❌ Non-existent channel did not return 404');
  }
  
  // Test creating channel with invalid name
  const invalidNameResult = await makeRequest('POST', `/channels/${TEST_NSC_ID}`, {
    name: 'invalid channel name!', // Spaces and special chars not allowed
    type: 'PUBLIC'
  });
  
  if (invalidNameResult.status === 400) {
    console.log('✅ Invalid channel name returns 400 as expected');
  } else {
    console.log('❌ Invalid channel name did not return 400');
  }
  
  // Test creating group with no members
  const invalidGroupResult = await makeRequest('POST', `/channels/${TEST_NSC_ID}/group`, {
    name: 'empty-group',
    memberIds: []
  });
  
  if (invalidGroupResult.status === 400) {
    console.log('✅ Empty group creation returns 400 as expected');
  } else {
    console.log('❌ Empty group creation did not return 400');
  }
}

async function cleanup() {
  console.log('\n🧹 Cleaning up test data...');
  
  // Delete test channels (if you have admin permissions)
  const channelsToDelete = [testChannelId, testGroupChannelId].filter(Boolean);
  
  for (const channelId of channelsToDelete) {
    const deleteResult = await makeRequest('DELETE', `/channels/${TEST_NSC_ID}/${channelId}`);
    
    if (deleteResult.success) {
      console.log(`✅ Deleted test channel: ${channelId}`);
    } else {
      console.log(`⚠️  Could not delete test channel ${channelId}:`, deleteResult.error);
    }
  }
}

async function runAllTests() {
  console.log('🚀 Starting ConnectHub Channel API Tests');
  console.log('=======================================');
  
  try {
    // Authentication is required for all other tests
    const authSuccess = await testAuthentication();
    
    if (!authSuccess) {
      console.log('\n❌ Authentication failed - skipping remaining tests');
      return;
    }
    
    // Run all tests
    await testChannelCreation();
    await testDirectMessages();
    await testChannelListing();
    await testChannelDetails();
    await testMessaging();
    await testChannelOperations();
    await testErrorCases();
    
    // Cleanup
    await cleanup();
    
    console.log('\n🎉 All tests completed!');
    console.log('=======================================');
    
  } catch (error) {
    console.error('\n💥 Test suite failed:', error);
  }
}

// Run tests if called directly
if (require.main === module) {
  runAllTests();
}

module.exports = {
  runAllTests,
  testAuthentication,
  testChannelCreation,
  testDirectMessages,
  testChannelListing,
  testChannelDetails,
  testMessaging,
  testChannelOperations,
  testErrorCases
};

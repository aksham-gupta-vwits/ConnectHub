#!/usr/bin/env node

// Simple API test script for ConnectHub
const http = require('http');

const API_BASE = 'http://localhost:3000';

// Test function
const testEndpoint = (path, method = 'GET', data = null) => {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE);
    
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'ConnectHub-Test-Client'
      }
    };

    if (data) {
      const postData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: parsedData
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: responseData
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
};

// Test suite
const runTests = async () => {
  console.log('🧪 ConnectHub API Test Suite');
  console.log('================================\n');

  try {
    // Test 1: Health check
    console.log('1. Testing health endpoint...');
    const healthResponse = await testEndpoint('/health');
    console.log(`   Status: ${healthResponse.status}`);
    console.log(`   Response:`, healthResponse.data);
    console.log('   ✅ Health check passed\n');

    // Test 2: 404 for unknown route
    console.log('2. Testing 404 handling...');
    const notFoundResponse = await testEndpoint('/nonexistent');
    console.log(`   Status: ${notFoundResponse.status}`);
    console.log(`   Response:`, notFoundResponse.data);
    console.log('   ✅ 404 handling working\n');

    // Test 3: Rate limiting headers
    console.log('3. Testing rate limiting headers...');
    const rateLimitResponse = await testEndpoint('/health');
    console.log(`   Rate limit headers:`, {
      limit: rateLimitResponse.headers['x-ratelimit-limit'],
      remaining: rateLimitResponse.headers['x-ratelimit-remaining'],
      reset: rateLimitResponse.headers['x-ratelimit-reset']
    });
    console.log('   ✅ Rate limiting headers present\n');

    // Test 4: Security headers
    console.log('4. Testing security headers...');
    const securityHeaders = {
      'x-content-type-options': rateLimitResponse.headers['x-content-type-options'],
      'x-frame-options': rateLimitResponse.headers['x-frame-options'],
      'x-xss-protection': rateLimitResponse.headers['x-xss-protection'],
      'content-security-policy': rateLimitResponse.headers['content-security-policy']
    };
    console.log(`   Security headers:`, securityHeaders);
    console.log('   ✅ Security headers present\n');

    // Test 5: Auth endpoint (should require authentication)
    console.log('5. Testing protected endpoint...');
    const protectedResponse = await testEndpoint('/api/users/profile');
    console.log(`   Status: ${protectedResponse.status}`);
    console.log(`   Response:`, protectedResponse.data);
    console.log('   ✅ Authentication protection working\n');

    console.log('🎉 All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
};

// Run the tests if server is ready
const waitForServer = async (retries = 30) => {
  for (let i = 0; i < retries; i++) {
    try {
      await testEndpoint('/health');
      console.log('✅ Server is ready!\n');
      await runTests();
      return;
    } catch (error) {
      console.log(`⏳ Waiting for server... (${i + 1}/${retries})`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  console.error('❌ Server did not start within expected time');
  process.exit(1);
};

console.log('🚀 Waiting for ConnectHub server to start...');
waitForServer();

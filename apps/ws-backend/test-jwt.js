// Test script to verify JWT_SECRET import and token functionality
const jwt = require('jsonwebtoken');

console.log('=== WebSocket Backend JWT Test ===\n');

// Test 1: Check if JWT_SECRET can be imported
console.log('Test 1: Checking JWT_SECRET import...');
try {
    const { JWT_SECRET } = require('@repo/backend-common/config');
    console.log('✅ JWT_SECRET imported successfully');
    console.log(`   JWT_SECRET exists: ${!!JWT_SECRET}`);
    console.log(`   JWT_SECRET length: ${JWT_SECRET ? JWT_SECRET.length : 0} characters`);

    if (!JWT_SECRET) {
        console.log('❌ ERROR: JWT_SECRET is empty or undefined');
        console.log('   This means the environment variable is not set in apps/backend/.env');
        process.exit(1);
    }

    if (JWT_SECRET.length < 32) {
        console.log('⚠️  WARNING: JWT_SECRET is less than 32 characters (not secure)');
    }

    // Test 2: Generate a test token
    console.log('\nTest 2: Generating test JWT token...');
    const testPayload = { userId: 'test-user-123' };
    const token = jwt.sign(testPayload, JWT_SECRET, { expiresIn: '1h' });
    console.log('✅ Token generated successfully');
    console.log(`   Token: ${token.substring(0, 50)}...`);

    // Test 3: Verify the token
    console.log('\nTest 3: Verifying token...');
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('✅ Token verified successfully');
    console.log(`   Decoded userId: ${decoded.userId}`);

    // Test 4: Test invalid token
    console.log('\nTest 4: Testing invalid token handling...');
    try {
        jwt.verify('invalid.token.here', JWT_SECRET);
        console.log('❌ ERROR: Invalid token was accepted (should have failed)');
    } catch (err) {
        console.log('✅ Invalid token correctly rejected');
    }

    console.log('\n=== All Tests Passed! ===');
    console.log('\nThe WebSocket backend JWT functionality is working correctly.');
    console.log('You can now use this token to test WebSocket connections:');
    console.log(`\nTest Token: ${token}`);
    console.log(`\nWebSocket URL: ws://localhost:8080?token=${token}`);

} catch (error) {
    console.log('❌ ERROR: Failed to import JWT_SECRET');
    console.log(`   Error message: ${error.message}`);
    console.log('\n=== Diagnosis ===');

    if (error.message.includes('Cannot find module')) {
        console.log('Problem: The @repo/backend-common package is not properly linked');
        console.log('Solution: Run "pnpm install" in the monorepo root');
    } else if (error.message.includes('Environment validation failed')) {
        console.log('Problem: JWT_SECRET is not set in the environment');
        console.log('Solution: Create/update apps/backend/.env with JWT_SECRET');
    } else {
        console.log('Problem: Unknown error occurred');
        console.log('Full error:', error);
    }

    process.exit(1);
}

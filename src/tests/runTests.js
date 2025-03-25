// Simple test runner for our custom tests
import testCourseDataService from './courseDataService.test.js';

async function runAllTests() {
  console.log('========================================');
  console.log('🧪 RUNNING ALL TESTS');
  console.log('========================================\n');
  
  // Array of test functions - add more as needed
  const tests = [
    { name: 'Course Data Service', fn: testCourseDataService }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    console.log(`\n🧪 Running test: ${test.name}`);
    console.log('----------------------------------------');
    
    try {
      const result = await test.fn();
      if (result) {
        console.log(`✅ PASSED: ${test.name}`);
        passed++;
      } else {
        console.log(`❌ FAILED: ${test.name}`);
        failed++;
      }
    } catch (error) {
      console.error(`❌ ERROR in ${test.name}:`, error);
      failed++;
    }
    
    console.log('----------------------------------------');
  }
  
  console.log('\n========================================');
  console.log(`🧪 TEST SUMMARY: ${passed} passed, ${failed} failed`);
  console.log('========================================');
  
  return failed === 0;
}

// Run all tests
runAllTests()
  .then(success => {
    console.log(`\n${success ? '✅ All tests passed!' : '❌ Some tests failed!'}`);
  })
  .catch(err => {
    console.error('Error running tests:', err);
  });

// For Node.js environments, we need to ensure the process exits
if (typeof process !== 'undefined') {
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
  });
} 
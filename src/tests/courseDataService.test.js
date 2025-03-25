import { 
  getCourseIndex, 
  getCoursesByPeriod, 
  getHiddenLayupsStaticData, 
  getTopLayups 
} from '../services/courseDataService';

// Simple test function to verify our data service
async function testCourseDataService() {
  console.log('=== COURSE DATA SERVICE TEST ===');
  
  try {
    // 1. Test course index
    console.log('Testing getCourseIndex...');
    const courseIndex = await getCourseIndex();
    console.log(`✓ getCourseIndex returned ${courseIndex.size} courses`);
    
    // 2. Test courses by period
    console.log('\nTesting getCoursesByPeriod...');
    const periodCodeToTiming = {
      "11": "MWF 11:30-12:35, Tu 12:15-1:05",
      "10": "MWF 10:10-11:15, Th 12:15-1:05",
    };
    const period11Courses = await getCoursesByPeriod("11", periodCodeToTiming);
    console.log(`✓ getCoursesByPeriod returned ${period11Courses.length} courses for period 11`);
    
    // 3. Test hidden layups
    console.log('\nTesting getHiddenLayupsStaticData...');
    // Use a small sample for testing
    const sampleCourseIds = ["COSC_COSC001_001", "ENGS_ENGS012_001"];
    const hiddenLayupsData = await getHiddenLayupsStaticData(sampleCourseIds);
    console.log(`✓ getHiddenLayupsStaticData returned data for ${Object.keys(hiddenLayupsData).length} courses`);
    
    // 4. Test top layups
    console.log('\nTesting getTopLayups...');
    const topLayups = await getTopLayups(5);
    console.log(`✓ getTopLayups returned ${topLayups.length} top layups`);
    
    console.log('\nAll tests completed successfully!');
    return true;
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

// Run the tests
testCourseDataService().then(success => {
  console.log(`\nTest result: ${success ? 'PASSED' : 'FAILED'}`);
});

// Export the test function for potential reuse
export default testCourseDataService; 
// Run this in browser console to clear winter cache
// Press F12, paste this, and hit Enter

import localforage from 'localforage';

async function clearWinterCache() {
  console.log('🗑️ Clearing winter cache...');
  
  // Clear all winter-related cache keys
  await localforage.removeItem('winterCachedCourses');
  await localforage.removeItem('winterCacheTimestamp');
  await localforage.removeItem('winterCacheVersion');
  await localforage.removeItem('gcsCachedCourses_winter');
  await localforage.removeItem('gcsCacheTimestamp_winter');
  await localforage.removeItem('gcsCacheVersion_winter');
  
  console.log('✅ Winter cache cleared!');
  console.log('🔄 Now refresh the page (Cmd+R or Ctrl+R)');
}

clearWinterCache();

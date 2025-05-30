// src/services/professorService.js
import { collection, getDocs, getFirestore } from 'firebase/firestore';
import localforage from 'localforage';

const CACHE_VERSION = 'profV2';
const CACHE_TTL = 5184000000; // 60 days in milliseconds

export const fetchProfessorData = async (db) => {
  try {
    // Check cache first
    const cachedProfessors = await localforage.getItem('cachedProfessors');
    const cacheTimestamp = await localforage.getItem('professorsCacheTimestamp');
    const cachedVersion = await localforage.getItem('professorsCacheVersion');
    const now = Date.now();

    if (cachedProfessors && cacheTimestamp && cachedVersion === CACHE_VERSION && (now - cacheTimestamp) < CACHE_TTL) {
      // Create mapping for faster lookups
      const mapping = new Map(
        cachedProfessors.map(prof => [
          prof.displayName.toLowerCase(),
          prof.id
        ])
      );
      
      return {
        professorsList: cachedProfessors,
        professorMap: mapping,
        fromCache: true
      };
    }

    const professorsSnapshot = await getDocs(collection(db, 'professor'));
    const professorsData = professorsSnapshot.docs.map(doc => ({
      id: doc.id,
      displayName: doc.data().name || doc.id.replace('_', ' ')
    }));

    // Update cache
    await localforage.setItem('cachedProfessors', professorsData);
    await localforage.setItem('professorsCacheTimestamp', now);
    await localforage.setItem('professorsCacheVersion', CACHE_VERSION);

    // Create mapping for faster lookups
    const mapping = new Map(
      professorsData.map(prof => [
        prof.displayName.toLowerCase(),
        prof.id
      ])
    );
    
    return {
      professorsList: professorsData,
      professorMap: mapping,
      fromCache: false
    };
  } catch (error) {
    console.error('Error fetching professor data:', error);
    throw error;
  }
};

export default {
  fetchProfessorData
};
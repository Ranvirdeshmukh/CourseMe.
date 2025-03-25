import { collection, query, getDocs, where, limit } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Utility function to normalize text for comparison
 */
const normalizeText = (text) => {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '');
};

/**
 * Check if two professor names might be the same person
 */
const nameMatchScore = (name1, name2) => {
  if (!name1 || !name2) return 0;
  
  const norm1 = normalizeText(name1);
  const norm2 = normalizeText(name2);
  
  // Exact match
  if (norm1 === norm2) return 100;
  
  // Calculate similarity
  let score = 0;
  
  // Check if one name is contained in the other
  if (norm1.includes(norm2) || norm2.includes(norm1)) {
    score += 80;
  }
  
  // Check for same first and last name
  const parts1 = norm1.split(' ').filter(Boolean);
  const parts2 = norm2.split(' ').filter(Boolean);
  
  // First name match
  if (parts1[0] === parts2[0]) score += 30;
  
  // Last name match
  if (parts1[parts1.length-1] === parts2[parts2.length-1]) score += 40;
  
  // Middle initial match
  if (parts1.length > 2 && parts2.length > 2) {
    const middle1 = parts1[1].charAt(0);
    const middle2 = parts2[1].charAt(0);
    if (middle1 === middle2) score += 10;
  }
  
  return Math.min(score, 100);
};

/**
 * Search for a professor by name
 * @param {string} name - The professor name to search for
 * @param {number} minScore - Minimum match score (0-100)
 * @returns {Promise<Array>} - Array of matching professors
 */
export async function searchProfessorByName(name, minScore = 70) {
  try {
    const normalizedSearchName = normalizeText(name);
    if (!normalizedSearchName) return [];
    
    // Get the first word of the search name (likely first name)
    const firstWord = normalizedSearchName.split(' ')[0];
    
    // Get top results that start with the first word
    const professorsRef = collection(db, 'professor');
    const searchQuery = query(
      professorsRef,
      where('name_lowercase', '>=', firstWord),
      where('name_lowercase', '<=', firstWord + '\uf8ff'),
      limit(20)
    );
    
    const querySnapshot = await getDocs(searchQuery);
    
    // Calculate match scores
    const results = [];
    querySnapshot.forEach(doc => {
      const professorData = doc.data();
      const matchScore = nameMatchScore(name, professorData.name);
      
      if (matchScore >= minScore) {
        results.push({
          id: doc.id,
          name: professorData.name,
          matchScore,
          departments: professorData.departments ? Object.keys(professorData.departments) : [],
          metrics: professorData.overall_metrics
        });
      }
    });
    
    // Sort by match score
    return results.sort((a, b) => b.matchScore - a.matchScore);
  } catch (error) {
    console.error('Error searching for professor:', error);
    return [];
  }
}

/**
 * API endpoint handler for professor search
 */
export async function handleProfessorSearch(req, res) {
  const { name } = req.query;
  
  if (!name) {
    return res.status(400).json({ error: 'Name parameter is required' });
  }
  
  try {
    const results = await searchProfessorByName(name);
    return res.status(200).json(results);
  } catch (error) {
    console.error('Professor search error:', error);
    return res.status(500).json({ error: 'Server error during search' });
  }
}
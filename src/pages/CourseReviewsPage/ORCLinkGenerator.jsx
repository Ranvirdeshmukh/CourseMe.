import React from 'react';

// Function to generate ORC link for course catalog
export const generateORCLink = (courseId) => {
  try {
    // Extract department code and course number from courseId
    const courseIdParts = courseId.split('__');
    const deptCodeMatch = courseIdParts[0].match(/([A-Z]+)/);
    const courseNumMatch = courseIdParts[0].match(/(\d+(?:\.\d+)?)/); // Modified to also match decimal numbers
    
    if (deptCodeMatch && courseNumMatch) {
      const deptCode = deptCodeMatch[0].toLowerCase();
      
      // Process course number - handle different formats
      let courseNum = courseNumMatch[0];
      // Remove leading zeros but preserve single-digit course numbers
      if (courseNum.length > 1 && !courseNum.includes('.')) {
        courseNum = courseNum.replace(/^0+/, '');
      }
      
      // List of departments that use decimal-point course numbers
      const decimalCourseNumDepts = [
        'ascl',
        'cosc',
        'engs',
        'psyc',
        'wgss'
        // Add more as needed
      ];
      
      // Check if this course might need a decimal format
      if (decimalCourseNumDepts.includes(deptCode) && !courseNum.includes('.')) {
        // For ASCL and other departments with decimal course numbers
        // If we have just the integer part, try to append ".01" which is common
        if (deptCode === 'ascl') {
          courseNum = `${courseNum}.01`;
          console.log(`ASCL course detected, trying with decimal: ${courseNum}`);
        }
      }
      
      // Map department codes to full department names as they appear in the URL
      // These must EXACTLY match the paths in the ORC URLs
      const deptUrlMap = {
        'aaas': 'african-and-african-american-studies',
        'amel': 'asian-and-middle-eastern-languages-and-literatures',
        'ames': 'asian-and-middle-eastern-studies',
        'anth': 'anthropology',
        'arab': 'middle-eastern-studies', // Arabic is under MES
        'arth': 'art-history',
        'ascl': 'asian-societies-cultures-and-languages',
        'astr': 'physics-and-astronomy', // Updated from 'astronomy' to 'physics-and-astronomy'
        'biol': 'biological-sciences',
        'chem': 'chemistry',
        'chin': 'asian-societies-cultures-and-languages', // Chinese is under ASCL
        'clst': 'classics-classical-studies-greek-latin',
        'coco': 'college-courses',
        'cogs': 'cognitive-science', // Fixed: was 'cognitive-science-program'
        'colt': 'comparative-literature',
        'cosc': 'computer-science',
        'crwt': 'english-and-creative-writing',
        'ears': 'earth-sciences',
        'econ': 'economics',
        'educ': 'education',
        'engl': 'english-and-creative-writing',
        'engs': 'engineering-sciences',
        'envs': 'environmental-studies-program', // Updated path for Environmental Studies
        'film': 'film-and-media-studies',
        'fren': 'french-and-italian-languages-and-literatures',
        'frit': 'french-and-italian-languages-and-literatures',
        'geog': 'geography',
        'germ': 'german-studies',
        'govt': 'government',
        'grk': 'classics-classical-studies-greek-latin',
        'hebr': 'middle-eastern-studies',
        'hist': 'history',
        'hum': 'humanities',
        'ints': 'the-john-sloan-dickey-center-for-international-understanding',
        'ital': 'french-and-italian-languages-and-literatures',
        'japn': 'asian-societies-cultures-and-languages',
        'jwst': 'jewish-studies',
        'lacs': 'latin-american-latino-and-caribbean-studies',
        'lat': 'classics-classical-studies-greek-latin',
        'lats': 'latin-american-latino-and-caribbean-studies',
        'ling': 'linguistics',
        'math': 'mathematics',
        'mes': 'middle-eastern-studies',
        'mus': 'music',
        'nais': 'native-american-and-indigenous-studies',
        'nas': 'native-american-and-indigenous-studies',
        'pbpl': 'the-nelson-a-rockefeller-center-for-public-policy',
        'phil': 'philosophy',
        'phys': 'physics-and-astronomy',
        'port': 'spanish-and-portuguese-languages-and-literatures',
        'psyc': 'psychological-and-brain-sciences',
        'qss': 'quantitative-social-science',
        'rel': 'religion',
        'russ': 'east-european-eurasian-and-russian-studies',
        'sart': 'studio-art',
        'socy': 'sociology',
        'span': 'spanish-and-portuguese-languages-and-literatures',
        'spee': 'speech',
        'ssoc': 'social-science',
        'thea': 'theater',
        'tuck': 'tuck-undergraduate',
        'wgss': 'womens-gender-and-sexualities-studies-program',
        'writ': 'institute-for-writing-and-rhetoric'
      };
      
      // List of departments that use "-undergraduate" suffix in their URLs
      const undergraduateSuffixDepts = [
        'chem',
        'cosc',
        'math',
        'phys',
        'engs',
        'biol',
        'ears',
        // Removing 'psyc' from this list as it doesn't use -undergraduate in that part of the URL
        // Add more as needed
      ];
      
      // List of departments that need "/en/" in the URL
      const enPathDepts = [
        'arth',
        'grk', // Adding Greek to the departments that need /en/ in the URL
        'span', // Adding Spanish to the departments that need /en/ in the URL
        'envs', // Adding Environmental Studies to the departments that need /en/ in the URL
        // Add more as needed
      ];
      
      // Special case handling for certain departments
      let deptUrlPath = deptUrlMap[deptCode];
      
      // If mapping doesn't exist, handle special cases
      if (!deptUrlPath) {
        // For departments with numbers in them like QBS
        if (deptCode.match(/[a-z]+\d+/i)) {
          deptUrlPath = deptCode;
        } else {
          // Default fallback - just use the department code
          deptUrlPath = deptCode;
        }
      }
      
      // Check if this department needs the "-undergraduate" suffix
      const needsUndergraduateSuffix = undergraduateSuffixDepts.includes(deptCode);
      
      // Get the department name for the file path segment
      // Special case for AAAS which has a different pattern
      let deptNameInPath;
      
      if (deptCode === 'aaas') {
        deptNameInPath = 'african-and-african-american-studies';
      } else if (deptCode === 'wgss') {
        deptNameInPath = 'womens-gender-and-sexualities-studies';
      } else if (deptCode === 'nas' || deptCode === 'nais') {
        deptNameInPath = 'native-american-studies';
      } else if (deptCode === 'tuck') {
        deptNameInPath = 'tuck-undergraduate';
      } else if (deptCode === 'chin') {
        deptNameInPath = 'chinese'; // Fix for Chinese courses
      } else if (deptCode === 'span') {
        deptNameInPath = 'spanish'; // Fix for Spanish courses
      } else {
        deptNameInPath = deptUrlPath;
      }
      
      // Determine if we need to add the "en" path segment
      const enPath = enPathDepts.includes(deptCode) ? 'en/' : '';
      
      // Construct URL with or without "-undergraduate" based on the department
      const deptSuffix = needsUndergraduateSuffix ? '-undergraduate' : '';
      
      // Special case for PSYC - it has a different URL structure
      if (deptCode === 'psyc') {
        const url = `https://dartmouth.smartcatalogiq.com/${enPath}current/orc/departments-programs-undergraduate/${deptUrlPath}/${deptCode}-psychological-and-brain-sciences/${deptCode}-${courseNum}/`;
        console.log(`Generated ORC link for ${courseId}: ${url}`);
        return url;
      }
      
      // Special case for GRK - it has a different URL structure
      if (deptCode === 'grk') {
        const url = `https://dartmouth.smartcatalogiq.com/${enPath}current/orc/departments-programs-undergraduate/${deptUrlPath}/${deptCode}-greek/${deptCode}-${courseNum}/`;
        console.log(`Generated ORC link for ${courseId}: ${url}`);
        return url;
      }
      
      // Special case for LAT - it has a different URL structure
      if (deptCode === 'lat') {
        const url = `https://dartmouth.smartcatalogiq.com/${enPath}current/orc/departments-programs-undergraduate/${deptUrlPath}/${deptCode}-latin/${deptCode}-${courseNum}/`;
        console.log(`Generated ORC link for ${courseId}: ${url}`);
        return url;
      }
      
      // Special case for COLT - it has a different URL structure and needs -undergraduate suffix
      if (deptCode === 'colt') {
        // For COLT, make sure we're using the correct format for the course number
        // The real URLs use hyphenated format (e.g., 51-01 instead of 51.01)
        let formattedCourseNum = courseNum;
        if (courseNum.includes('.')) {
          formattedCourseNum = courseNum.replace('.', '-');
        }
        
        const url = `https://dartmouth.smartcatalogiq.com/${enPath}current/orc/departments-programs-undergraduate/${deptUrlPath}/${deptCode}-comparative-literature-undergraduate/${deptCode}-${formattedCourseNum}/`;
        console.log(`Generated ORC link for ${courseId}: ${url}`);
        return url;
      }
      
      // Special case for COGS - it has a different URL structure
      if (deptCode === 'cogs') {
        const url = `https://dartmouth.smartcatalogiq.com/${enPath}current/orc/departments-programs-undergraduate/${deptUrlPath}/${deptCode}-cognitive-science/${deptCode}-${courseNum}/`;
        console.log(`Generated ORC link for ${courseId}: ${url}`);
        return url;
      }
      
      // Special case for CLST - it has a different URL structure
      if (deptCode === 'clst') {
        const clstUrl = `https://dartmouth.smartcatalogiq.com/${enPath}current/orc/departments-programs-undergraduate/${deptUrlPath}/clst-classical-studies/${deptCode}-${courseNum}/`;
        console.log(`Generated ORC link for ${courseId}: ${clstUrl}`);
        return clstUrl;
      }
      
      // Special case for ASTR - it has a different URL structure
      if (deptCode === 'astr') {
        const astrUrl = `https://dartmouth.smartcatalogiq.com/${enPath}current/orc/departments-programs-undergraduate/physics-and-astronomy/astr-astronomy-undergraduate/${deptCode}-${courseNum}/`;
        console.log(`Generated ORC link for ${courseId}: ${astrUrl}`);
        return astrUrl;
      }
      
      // Special case for SPAN - it has a different URL structure than PORT
      if (deptCode === 'span') {
        // Format course number - convert decimal to hyphen
        let formattedCourseNum = courseNum;
        if (courseNum.includes('.')) {
          formattedCourseNum = courseNum.replace('.', '-');
        }
        
        const spanUrl = `https://dartmouth.smartcatalogiq.com/${enPath}current/orc/departments-programs-undergraduate/spanish-and-portuguese-languages-and-literatures/${deptCode}-spanish/${deptCode}-${formattedCourseNum}/`;
        console.log(`Generated ORC link for ${courseId}: ${spanUrl}`);
        return spanUrl;
      }
      
      // Special case for PORT - add this if needed
      if (deptCode === 'port') {
        const portUrl = `https://dartmouth.smartcatalogiq.com/${enPath}current/orc/departments-programs-undergraduate/spanish-and-portuguese-languages-and-literatures/${deptCode}-portuguese/${deptCode}-${courseNum}/`;
        console.log(`Generated ORC link for ${courseId}: ${portUrl}`);
        return portUrl;
      }
      
      // Special case for ENVS - it has a different URL structure
      if (deptCode === 'envs') {
        const envsUrl = `https://dartmouth.smartcatalogiq.com/${enPath}current/orc/departments-programs-undergraduate/environmental-studies-program/${deptCode}-environmental-studies/${deptCode}-${courseNum}/`;
        console.log(`Generated ORC link for ${courseId}: ${envsUrl}`);
        return envsUrl;
      }
      
      // Special case for BIOL - it has a specific URL structure
      if (deptCode === 'biol') {
        const biolUrl = `https://dartmouth.smartcatalogiq.com/current/orc/departments-programs-undergraduate/biological-sciences/biol-biological-sciences-undergraduate/biol-${courseNum}/`;
        console.log(`Generated ORC link for ${courseId}: ${biolUrl}`);
        return biolUrl;
      }
      
      // Special case for MUS - it has a different URL structure with course ranges
      if (deptCode === 'mus') {
        // Convert course number to number for range comparisons
        // Handle decimal course numbers (e.g., 3.02)
        const courseNumBase = courseNum.includes('.') ? 
          parseInt(courseNum.split('.')[0]) : 
          parseInt(courseNum);
        
        let rangeSegment = '';
        
        // Determine range segment based on course number range
        if (courseNumBase >= 1 && courseNumBase <= 19) {
          rangeSegment = 'mus-1-mus-19';
        } else if (courseNumBase >= 20 && courseNumBase <= 39) {
          rangeSegment = 'mus-20-mus-39';
        } else if (courseNumBase >= 40 && courseNumBase <= 49) {
          rangeSegment = 'mus-40-mus-49';
        } else if (courseNumBase >= 50 && courseNumBase <= 52) {
          rangeSegment = 'mus-50-mus-52';
        } else if (courseNumBase >= 53 && courseNumBase <= 69) {
          rangeSegment = 'mus-53-mus-69';
        } else if (courseNumBase >= 70 && courseNumBase <= 79) {
          rangeSegment = 'mus-70-mus-79-foreign-study-courses';
        } else if (courseNumBase >= 80 && courseNumBase <= 99) {
          rangeSegment = 'mus-80-mus-99';
        }
        
        // If we identified a valid range, use it in the URL
        if (rangeSegment) {
          // Format course number for URL
          let formattedCourseNum = courseNum;
          if (courseNum.includes('.')) {
            formattedCourseNum = courseNum.replace('.', '-');
          }
          
          const musUrl = `https://dartmouth.smartcatalogiq.com/current/orc/departments-programs-undergraduate/music/${deptCode}-music-undergraduate-courses/${rangeSegment}/${deptCode}-${formattedCourseNum}/`;
          console.log(`Generated ORC link for ${courseId}: ${musUrl}`);
          return musUrl;
        }
      }
      
      // Special case for ITAL - it has a different URL structure
      if (deptCode === 'ital') {
        // Format course number for URL
        let formattedCourseNum = courseNum;
        if (courseNum.includes('.')) {
          formattedCourseNum = courseNum.replace('.', '-');
        }
        
        const italUrl = `https://dartmouth.smartcatalogiq.com/current/orc/departments-programs-undergraduate/french-and-italian-languages-and-literatures/${deptCode}-italian/${deptCode}-${formattedCourseNum}/`;
        console.log(`Generated ORC link for ${courseId}: ${italUrl}`);
        return italUrl;
      }
      
      // Special case for FREN - add French handling similar to Italian
      if (deptCode === 'fren') {
        // Format course number for URL
        let formattedCourseNum = courseNum;
        if (courseNum.includes('.')) {
          formattedCourseNum = courseNum.replace('.', '-');
        }
        
        const frenUrl = `https://dartmouth.smartcatalogiq.com/current/orc/departments-programs-undergraduate/french-and-italian-languages-and-literatures/${deptCode}-french/${deptCode}-${formattedCourseNum}/`;
        console.log(`Generated ORC link for ${courseId}: ${frenUrl}`);
        return frenUrl;
      }
      
      // Special case for FRIT - French and Italian in Translation
      if (deptCode === 'frit') {
        // Format course number for URL
        let formattedCourseNum = courseNum;
        if (courseNum.includes('.')) {
          formattedCourseNum = courseNum.replace('.', '-');
        }
        
        const fritUrl = `https://dartmouth.smartcatalogiq.com/current/orc/departments-programs-undergraduate/french-and-italian-languages-and-literatures/${deptCode}-french-and-italian-in-translation/${deptCode}-${formattedCourseNum}/`;
        console.log(`Generated ORC link for ${courseId}: ${fritUrl}`);
        return fritUrl;
      }
      
      // Special case for PBPL - Public Policy courses
      if (deptCode === 'pbpl') {
        const pbplUrl = `https://dartmouth.smartcatalogiq.com/current/orc/departments-programs-undergraduate/the-nelson-a-rockefeller-center-for-public-policy/public-policy-minor/pbpl-public-policy/pbpl-${courseNum}/`;
        console.log(`Generated ORC link for ${courseId}: ${pbplUrl}`);
        return pbplUrl;
      }
      
      // Special case for HEBR - Hebrew courses
      if (deptCode === 'hebr') {
        const hebrUrl = `https://dartmouth.smartcatalogiq.com/current/orc/departments-programs-undergraduate/middle-eastern-studies/hebr-hebrew/hebr-${courseNum}/`;
        console.log(`Generated ORC link for ${courseId}: ${hebrUrl}`);
        return hebrUrl;
      }
      
      // Special case for ARAB - Arabic courses
      if (deptCode === 'arab') {
        const arabUrl = `https://dartmouth.smartcatalogiq.com/current/orc/departments-programs-undergraduate/middle-eastern-studies/arab-arabic/arab-${courseNum}/`;
        console.log(`Generated ORC link for ${courseId}: ${arabUrl}`);
        return arabUrl;
      }
      
      // Special case for MES - Middle Eastern Studies courses
      if (deptCode === 'mes') {
        // Format course number for URL - MES courses use decimal format
        let formattedCourseNum = courseNum;
        // If the course number doesn't already have a decimal point, add ".01"
        if (!formattedCourseNum.includes('.')) {
          formattedCourseNum += '.01';
        }
        // Convert decimal point to hyphen for URL format
        formattedCourseNum = formattedCourseNum.replace('.', '-');
        
        const mesUrl = `https://dartmouth.smartcatalogiq.com/current/orc/departments-programs-undergraduate/middle-eastern-studies/mes-middle-eastern-studies/mes-${formattedCourseNum}/`;
        console.log(`Generated ORC link for ${courseId}: ${mesUrl}`);
        return mesUrl;
      }
      
      // Special case for GOVT - it has different URL structures based on course number ranges
      if (deptCode === 'govt') {
        // Convert course number to number for range comparisons
        // Handle decimal course numbers (e.g., 20.01)
        const courseNumBase = courseNum.includes('.') ? 
          parseInt(courseNum.split('.')[0]) : 
          parseInt(courseNum);
        
        let subcategory = '';
        
        // Determine subcategory based on course number range
        if (courseNumBase >= 1 && courseNumBase <= 9) {
          subcategory = 'introductory-courses';
        } else if (courseNumBase >= 10 && courseNumBase <= 19) {
          subcategory = 'political-analysis';
        } else if (courseNumBase >= 20 && courseNumBase <= 29) {
          subcategory = 'upper-level-courses-that-cross-subfields';
        } else if (courseNumBase >= 30 && courseNumBase <= 39) {
          subcategory = 'american-government';
        } else if (courseNumBase >= 40 && courseNumBase <= 49) {
          subcategory = 'comparative-politics';
        } else if (courseNumBase >= 50 && courseNumBase <= 59) {
          subcategory = 'international-relations';
        } else if (courseNumBase >= 60 && courseNumBase <= 69) {
          subcategory = 'political-theory-and-public-law';
        } else if (courseNumBase >= 80 && courseNumBase <= 99) {
          subcategory = 'advanced-courses';
        }
        
        // If we identified a valid subcategory, use it in the URL
        if (subcategory) {
          // Format course number for URL - convert decimal to hyphen if needed
          let formattedCourseNum = courseNum;
          if (courseNum.includes('.')) {
            formattedCourseNum = courseNum.replace('.', '-');
          }
          
          const govtUrl = `https://dartmouth.smartcatalogiq.com/${enPath}current/orc/departments-programs-undergraduate/${deptUrlPath}/${deptCode}-government/${subcategory}/${deptCode}-${formattedCourseNum}/`;
          console.log(`Generated ORC link for ${courseId}: ${govtUrl}`);
          return govtUrl;
        }
      }
      
      const url = `https://dartmouth.smartcatalogiq.com/${enPath}current/orc/departments-programs-undergraduate/${deptUrlPath}/${deptCode}-${deptNameInPath}${deptSuffix}/${deptCode}-${courseNum}/`;
      
      // Log for debugging
      console.log(`Generated ORC link for ${courseId}: ${url}`);
      
      return url;
    }
    return null;
  } catch (error) {
    console.error('Error generating ORC link:', error);
    return null;
  }
};

export default generateORCLink; 
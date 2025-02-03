import React, { useState, useEffect } from 'react';

const GraduationRequirements = ({ selectedCourses, courseData }) => {
  const [requirements, setRequirements] = useState({
    totalCourses: {
      required: 35,
      completed: 0,
      title: "Total Courses"
    },
    writing: {
      completed: false,
      paths: [
        { name: "Path 1: Writing 5 + First-Year Seminar", courses: ["WRIT005", "FirstYearSeminar"], completed: false },
        { name: "Path 2: Writing 2-3 + First-Year Seminar", courses: ["WRIT002", "WRIT003", "FirstYearSeminar"], completed: false },
        { name: "Path 3: Humanities 1-2", courses: ["HUM001", "HUM002"], completed: false }
      ],
      title: "Writing Requirement"
    },
    distributives: {
      ART: { required: 1, completed: 0, title: "Art (ART)" },
      LIT: { required: 1, completed: 0, title: "Literature (LIT)" },
      TMV: { required: 1, completed: 0, title: "Systems and Traditions of Thought (TMV)" },
      INT: { required: 1, completed: 0, title: "International or Comparative Study (INT)" },
      SOC: { required: 2, completed: 0, title: "Social Analysis (SOC)" },
      QDS: { required: 1, completed: 0, title: "Quantitative or Deductive Science (QDS)" },
      SCI: { required: 2, completed: 0, title: "Natural and Physical Science (SCI/SLA)" },
      TAS: { required: 1, completed: 0, title: "Technology or Applied Science (TAS/TLA)" }
    },
    worldCulture: {
      W: { required: 1, completed: 0, title: "Western Cultures (W)" },
      NW: { required: 1, completed: 0, title: "Non-Western Cultures (NW)" },
      CI: { required: 1, completed: 0, title: "Culture and Identity (CI)" }
    },
    lab: {
      required: 1,
      completed: 0,
      title: "Laboratory Requirement (from SCI/SLA or TAS/TLA)"
    }
  });

  // Helper function to check if a course is a first-year seminar
  const isFirstYearSeminar = (course) => {
    return course.course_number === "007";
  };

  // Update requirements based on selected courses
  useEffect(() => {
    if (!courseData || !selectedCourses) return;

    const newRequirements = { ...requirements };
    newRequirements.totalCourses.completed = selectedCourses.length;

    // Reset all counts
    Object.keys(newRequirements.distributives).forEach(key => {
      newRequirements.distributives[key].completed = 0;
    });
    Object.keys(newRequirements.worldCulture).forEach(key => {
      newRequirements.worldCulture[key].completed = 0;
    });
    newRequirements.lab.completed = 0;

    // Process each selected course
    selectedCourses.forEach(courseId => {
      const course = courseData[courseId];
      if (!course) return;

      // Check distributives
      if (course.distribs) {
        // Split on both / and - to handle different separator formats
        const distribs = course.distribs.split(/[/-]/).map(d => d.trim());
        distribs.forEach(distrib => {
          // Handle both SLA/TLA and base distribs
          const baseDistrib = distrib.replace('SLA', 'SCI').replace('TLA', 'TAS');
          if (newRequirements.distributives[baseDistrib]) {
            // Only increment if we haven't met the requirement yet
            if (newRequirements.distributives[baseDistrib].completed < newRequirements.distributives[baseDistrib].required) {
              newRequirements.distributives[baseDistrib].completed++;
            }
          }
          
          // Check for lab requirement
          if (distrib === 'SLA' || distrib === 'TLA') {
            if (newRequirements.lab.completed < newRequirements.lab.required) {
              newRequirements.lab.completed++;
            }
          }
        });
      }

      // Check world culture requirements
      if (course.world_culture) {
        course.world_culture.forEach(culture => {
          if (newRequirements.worldCulture[culture] && 
              newRequirements.worldCulture[culture].completed < newRequirements.worldCulture[culture].required) {
            newRequirements.worldCulture[culture].completed++;
          }
        });
      }
    });

    // Check writing requirement paths
    const hasWriting5 = selectedCourses.some(id => id === "WRIT005");
    const hasWriting2 = selectedCourses.some(id => id === "WRIT002");
    const hasWriting3 = selectedCourses.some(id => id === "WRIT003");
    const hasHum1 = selectedCourses.some(id => id === "HUM001");
    const hasHum2 = selectedCourses.some(id => id === "HUM002");
    const hasFirstYearSeminar = selectedCourses.some(id => courseData[id] && isFirstYearSeminar(courseData[id]));

    newRequirements.writing.paths[0].completed = hasWriting5 && hasFirstYearSeminar;
    newRequirements.writing.paths[1].completed = hasWriting2 && hasWriting3 && hasFirstYearSeminar;
    newRequirements.writing.paths[2].completed = hasHum1 && hasHum2;
    newRequirements.writing.completed = newRequirements.writing.paths.some(path => path.completed);

    setRequirements(newRequirements);
  }, [selectedCourses, courseData]);

  const renderRequirementStatus = (requirement) => {
    const completed = requirement.completed >= requirement.required;
    return (
      <div className="flex justify-between items-center py-2">
        <span>{requirement.title}</span>
        <span className={`font-semibold ${completed ? 'text-green-600' : 'text-gray-600'}`}>
          {requirement.completed}/{requirement.required}
        </span>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 mb-8">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-900">Graduation Requirements Progress</h2>
      </div>
      <div className="space-y-6">
        {/* Total Courses */}
        {renderRequirementStatus(requirements.totalCourses)}

        {/* Writing Requirement */}
        <div className="border-t pt-4">
          <h3 className="font-semibold mb-2">Writing Requirement (Complete one path)</h3>
          {requirements.writing.paths.map((path, index) => (
            <div key={path.name} className={`flex justify-between items-center py-1 ${path.completed ? 'text-green-600' : 'text-gray-600'}`}>
              <span>{path.name}</span>
              <span>{path.completed ? '✓' : '○'}</span>
            </div>
          ))}
        </div>

        {/* Distributive Requirements */}
        <div className="border-t pt-4">
          <h3 className="font-semibold mb-2">Distributive Requirements</h3>
          {Object.values(requirements.distributives).map((req) => renderRequirementStatus(req))}
        </div>

        {/* World Culture Requirements */}
        <div className="border-t pt-4">
          <h3 className="font-semibold mb-2">World Culture Requirements</h3>
          {Object.values(requirements.worldCulture).map((req) => renderRequirementStatus(req))}
        </div>

        {/* Lab Requirement */}
        <div className="border-t pt-4">
          {renderRequirementStatus(requirements.lab)}
        </div>
      </div>
    </div>
  );
};

export default GraduationRequirements;
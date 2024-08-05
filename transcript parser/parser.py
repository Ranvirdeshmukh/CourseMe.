import re

def parse_transcript(transcript):
    # Regular expression to match the institution credit section
    institution_credit_pattern = r"INSTITUTION CREDIT.*?(?=TRANSCRIPT TOTALS|\Z)"
    
    # Regular expression to match term headers
    term_pattern = r"Term: ((?:Fall|Winter|Spring) Term \d{4})"
    
    # Updated regular expression to match course data with more flexibility
    course_pattern = r"(\w+)\s+([\d.]+(?:\.\d+)?)\s+UG\s+(.*?)\s+(\d+)\s+([A-Z][+-]?)\s+([A-Z][+-]?\*?)\s+"
    
    # Extract institution credit section
    institution_credit_section = re.search(institution_credit_pattern, transcript, re.DOTALL)
    
    if not institution_credit_section:
        return []
    
    institution_credit_text = institution_credit_section.group(0)
    
    parsed_data = []
    
    # Split the text into terms
    terms = re.split(term_pattern, institution_credit_text)[1:]  # Skip the first empty element
    
    # Process each term
    for i in range(0, len(terms), 2):
        current_term = terms[i]
        term_content = terms[i + 1]
        
        # Find all course matches in the term content
        courses = re.findall(course_pattern, term_content)
        
        for course in courses:
            subject, number, title, enrollment, median_grade, grade = course
            parsed_data.append({
                "term": current_term,
                "course_code": f"{subject} {number.strip()}",
                "title": title.strip(),
                "enrollment": int(enrollment),
                "median_grade": median_grade,
                "grade": grade.rstrip('*')  # Remove trailing asterisk if present
            })
    
    return parsed_data

# Example usage
transcript = """
"""

parsed_data = parse_transcript(transcript)

print(f"Total courses parsed: {len(parsed_data)}")
for course in parsed_data:
    print(f"Term: {course['term']}")
    print(f"Course: {course['course_code']} - {course['title']}")
    print(f"Enrollment: {course['enrollment']}")
    print(f"Median Grade: {course['median_grade']}")
    print(f"Grade: {course['grade']}")
    print()
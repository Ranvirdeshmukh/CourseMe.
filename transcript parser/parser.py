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
 STUDENT INFORMATION													
Name :		Ranvir R. Deshmukh											
Birth Date:		27-NOV											
Curriculum Information													
Current Program													
Bachelor of Arts													
College:			Class of 2026										
Major and Department:			Computer Science, Computer Science										
													
**Transcript type:GRUN is NOT Official **													
													
													
													
TRANSFER CREDIT ACCEPTED BY INSTITUTION      -Top-													
1:	Native Language												
Subject	Course		Title			Enrollment		Grade					R
LANG	003		Language Exemption Int'l					EX					
													
Current Term:													
													
													
1:	Local Placement Test												
Subject	Course		Title			Enrollment		Grade					R
													
Current Term:													
													
													
INSTITUTION CREDIT      -Top-													
Term: Fall Term 2022													
Subject	Course	Level	Title						Enrollment	Median Grade	Grade	R	
COSC	001	UG	Intro Programming&Computatn						101	A	A		
EARS	001	UG	How the Earth Works						55	B+	B+		
LANG	03.00	UG	Native Speaker-Hindi						0		NG		
WRIT	002	UG	Composition and Research I						15	A	A-		
Term Totals (Undergraduate)													
													
Current Term:													
Cumulative:													
													
													
Term: Winter Term 2023													
Subject	Course	Level	Title						Enrollment	Median Grade	Grade	R	
HIST	90.14	UG	The Global British Empire						32	A	A		
THEA	040	UG	Technical Production						12	A	A		
WRIT	003	UG	Composition&Research II						13	A	A-		
Term Totals (Undergraduate)													
													
Current Term:													
Cumulative:													
													
													
Term: Spring Term 2023													
Subject	Course	Level	Title						Enrollment	Median Grade	Grade	R	
COSC	25.01	UG	Intro to UI/UX Design I						36	A	A		
ENGL	07.61	UG	Engaging Memes						16	A-	W		
SPEE	20.03	UG	Public Speaking						13	A	A		
Term Totals (Undergraduate)													
													
Current Term:													
Cumulative:													
													
													
Term: Fall Term 2023													
Subject	Course	Level	Title						Enrollment	Median Grade	Grade	R	
COLT	40.07	UG	Video Games&Meaning of Life						68	A	A		
COSC	010	UG	ProbSolving:Object-Oriented						54	B+	NR		
MES	16.30	UG	Modern Arab Fiction						5		A		
Term Totals (Undergraduate)													
													
Current Term:													
Cumulative:													
													
													
Term: Winter Term 2024													
Subject	Course	Level	Title						Enrollment	Median Grade	Grade	R	
ASCL	54.04	UG	Partition in South Asia						14	A-	A		
COSC	050	UG	Software Design&Implement'n						68	A	A		
MES	07.03	UG	Jerusalem: Vision & Reality						13	B+	B+		
Term Totals (Undergraduate)													
													
Current Term:													
Cumulative:													
													
													
Term: Spring Term 2024													
Subject	Course	Level	Title						Enrollment	Median Grade	Grade	R	
CLSP	004	PE	Badminton Club						27		NP		
COSC	052	UG	Full-Stack Web Development						59	A	A		
MATH	30.04	UG	Evolutionary Game Theory						28	A	A		
MES	01.01	UG	Intro to Mid East Studies						87	A	A		
Term Totals (Physical Education)													
													
Current Term:													
Cumulative:													
Term Totals (Undergraduate)													
													
Current Term:													
Cumulative:													
													
													
COURSES IN PROGRESS       -Top-													
Term: Fall Term 2024													
Subject	Course	Level	Title						Enrollment		Credit Hours		
COSC	055	UG	Security and Privacy						55	1.000			
COSC	074	UG	Machine Lrng&Stat Analysis						35	1.000			
TUCK	002	UG	Principles of Marketing						60	1.000
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
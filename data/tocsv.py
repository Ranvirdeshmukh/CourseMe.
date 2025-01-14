import json
import csv
import re

def parse_class_name(department, class_name):
    # Extract course ID and name using regex
    match = re.match(rf'{department}(\d+[A-Z]?\.\d+|\d+[A-Z]?): (.*)', class_name)
    if match:
        course_id = f"{department}{match.group(1)}"
        course_name = match.group(2)
    else:
        # Fallback in case the pattern doesn't match
        course_id = class_name.split(':')[0].strip()
        course_name = class_name.split(':', 1)[1].strip() if ':' in class_name else ''
    
    return course_id, course_name

def process_data(data):
    rows = []
    
    # Process each department
    for department, courses in data.items():
        for course in courses:
            # Parse the class name into course ID and name
            course_id, course_name = parse_class_name(department, course['class name'])
            
            # Create row with all required fields
            row = {
                'department': department,
                'course_id': course_id,
                'course_name': course_name,
                'quality': course['quality'],
                'num_of_reviews': course['num of reviews'],
                'distribs': course['distribs'].strip(),
                'layup': course['layup']
            }
            rows.append(row)
    
    return rows

def save_to_csv(rows, output_file='courses.csv'):
    # Define the CSV headers
    headers = ['department', 'course_id', 'course_name', 'quality', 'num_of_reviews', 'distribs', 'layup']
    
    # Write to CSV file
    with open(output_file, 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=headers)
        writer.writeheader()
        writer.writerows(rows)

def main():
    # Read the JSON data
    with open('courses.json', 'r', encoding='utf-8') as file:
        data = json.load(file)
    
    # Process the data
    rows = process_data(data)
    
    # Save to CSV
    save_to_csv(rows)
    
    print(f"Successfully processed {len(rows)} courses and saved to courses.csv")

if __name__ == "__main__":
    main()
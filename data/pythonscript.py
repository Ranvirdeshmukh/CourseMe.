import json
import os
import re
from collections import defaultdict

def normalize_teacher_name(name):
    """Normalize teacher names to handle variations."""
    # Remove extra whitespace and convert to lowercase
    name = ' '.join(name.split()).lower()
    
    # Remove special characters
    name = re.sub(r'[^\w\s]', '', name)
    
    # Split the name into parts
    parts = name.split()
    
    # If we have more than two parts, keep first and last
    if len(parts) > 2:
        return f"{parts[0]} {parts[-1]}"
    return name

def extract_term(review_text):
    """Extract term from review text using regex."""
    match = re.search(r'(\d{2})[FWSX]\s+with', review_text)
    if match:
        term = match.group(0).split()[0]
        if term[0:2] in [str(i).zfill(2) for i in range(0, 25)] and term[2] in ['F', 'W', 'S', 'X']:
            return term
    return None

def process_json_files(directory):
    # Dictionary to store teacher data
    teachers = defaultdict(lambda: {"departments": defaultdict(lambda: defaultdict(lambda: {"reviews": [], "terms": set()}))})
    
    # Process each JSON file in the directory
    for filename in os.listdir(directory):
        if filename.endswith('.json'):
            with open(os.path.join(directory, filename), 'r', encoding='utf-8') as file:
                data = json.load(file)
                department = filename.split('.')[0]  # Get department from filename
                
                # Process each class
                for class_code, class_data in data.items():
                    for teacher_name, teacher_info in class_data.items():
                        # Normalize teacher name
                        normalized_name = normalize_teacher_name(teacher_name)
                        
                        # Add department if not exists
                        if department not in teachers[normalized_name]["departments"]:
                            teachers[normalized_name]["departments"][department] = {}
                        
                        # Add class if not exists
                        if class_code not in teachers[normalized_name]["departments"][department]:
                            teachers[normalized_name]["departments"][department][class_code] = {
                                "reviews": [],
                                "terms": set()
                            }
                        
                        # Process reviews
                        for review in teacher_info:
                            if review:  # Check if review exists
                                teachers[normalized_name]["departments"][department][class_code]["reviews"].append(review)
                                
                                # Extract and add term
                                term = extract_term(review)
                                if term:
                                    teachers[normalized_name]["departments"][department][class_code]["terms"].add(term)
    
    # Convert sets to lists for JSON serialization and sort teachers
    processed_data = {}
    for teacher_name in sorted(teachers.keys()):
        processed_data[teacher_name] = {
            "departments": {
                dept: {
                    class_code: {
                        "reviews": class_data["reviews"],
                        "terms": sorted(list(class_data["terms"]))
                    }
                    for class_code, class_data in dept_data.items()
                }
                for dept, dept_data in teachers[teacher_name]["departments"].items()
            }
        }
    
    return processed_data

def save_processed_data(processed_data, output_file):
    """Save processed data to JSON file with proper formatting."""
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(processed_data, f, indent=2, ensure_ascii=False)

def main():
    # Directory containing JSON files
    input_directory = './classData'  # Change this to your input directory
    output_file = 'processed_teachers.json'
    
    # Process files and save results
    processed_data = process_json_files(input_directory)
    save_processed_data(processed_data, output_file)
    print(f"Processing complete. Results saved to {output_file}")

if __name__ == "__main__":
    main()
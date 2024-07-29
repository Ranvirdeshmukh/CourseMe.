import json
import os

def clean_data(json_data):
    cleaned_data = {}
    for class_name, professors in json_data.items():
        cleaned_professors = {}
        for professor, reviews in professors.items():
            if reviews:  # Check if the reviews list is not empty
                cleaned_professors[professor] = reviews
        if cleaned_professors:  # Check if there are any professors left after cleaning
            cleaned_data[class_name] = cleaned_professors
    return cleaned_data

# Load the JSON data from a file
with open('/Users/erikpeterson/dartwebsite/DartCourseReview/data/classData/AAAS.json', 'r') as file:
    data = json.load(file)

# Clean the data
cleaned_data = clean_data(data)

# Save the cleaned data back to a file
with open('/Users/erikpeterson/dartwebsite/DartCourseReview/course_scraper/output.json', 'w') as file:
    json.dump(cleaned_data, file, indent=4)

print("Data cleaned and saved to cleaned_data.json")

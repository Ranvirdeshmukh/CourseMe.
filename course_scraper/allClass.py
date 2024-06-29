import pandas as pd
import os
import json

# List of JSON file names
json_files = [
    "AAAS", "AMEL", "AMES", "ANTH", "ARAB", "ARTH", "ASCL", "ASTR", "BIOL",
    "CHEM", "CHIN", "CLST", "COCO", "COGS", "COLT", "COSC", "CRWT", "EARS",
    "ECON", "EDUC", "ENGL", "ENGS", "ENVS", "FILM", "FREN", "FRIT", "GEOG",
    "GERM", "GOVT", "GRK", "HCDS", "HEBR", "HIST", "HUM", "INTS", "ITAL",
    "JAPN", "JWST", "LACS", "LAT", "LATS", "LING", "MATH", "MES", "MUS",
    "NAIS", "NAS", "PBPL", "PHIL", "PHYS", "PORT", "PSYC", "QSS", "REL",
    "RUSS", "SART", "SOCY", "SPAN", "SPEE", "SSOC", "THEA", "TUCK", "WGSS",
    "WRIT"
]

# Ensure the classData folder exists
output_folder = 'classData'
os.makedirs(output_folder, exist_ok=True)

# Function to save data to JSON
def save_to_json(data, file_name):
    file_path = os.path.join(output_folder, file_name)
    if os.path.exists(file_path):
        with open(file_path, 'r') as f:
            existing_data = json.load(f)
        for class_name, teachers in data.items():
            if class_name in existing_data:
                existing_data[class_name].update(teachers)
            else:
                existing_data[class_name] = teachers
    else:
        existing_data = data

    with open(file_path, 'w') as f:
        json.dump(existing_data, f, indent=4)

# Load the Excel file
excel_file = '/Users/erikpeterson/DartCourseReview/course_scraper/ClassReviews.xlsx'  # Update this to your file path
sheets = pd.read_excel(excel_file, sheet_name=None, skiprows=1)

# Function to clean text by removing formatting
def clean_text(text):
    return ' '.join(text.split())

# Function to match the sheet name prefix with the JSON file name
def match_prefix(sheet_name, json_files):
    for length in range(3, 5):
        prefix = sheet_name[:length]
        if prefix in json_files:
            return prefix
    return None

for sheet_name, df in sheets.items():
    prefix = match_prefix(sheet_name, json_files)
    if prefix:
        json_file = f'{prefix}.json'
        data = {}
        class_name = clean_text(sheet_name)
        data[class_name] = {}
        for col in df.columns:
            teacher_name = clean_text(col)
            reviews = []
            for index, row in df.iterrows():
                if pd.notna(row[col]):
                    review_text = clean_text(row[col])
                    reviews.append(f"review {index + 1}: \"{review_text}\"")
            data[class_name][teacher_name] = reviews
        if data[class_name]:
            save_to_json(data, json_file)

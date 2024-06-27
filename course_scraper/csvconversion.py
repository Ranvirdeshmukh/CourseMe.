import pandas as pd
import json
import os

def clean_dataframe(df):
    # Drop columns with no header
    df = df.loc[:, ~df.columns.str.contains('^Unnamed')]
    return df

# Load the Excel file
file_path = '/Users/erikpeterson/DartCourseReview/course_scraper/ClassOverview.xlsx'
excel_data = pd.ExcelFile(file_path)

# Initialize a dictionary to hold sheet titles and data
sheets_data = {}

# Iterate through each sheet and store the data in JSON format
for sheet_name in excel_data.sheet_names:
    sheet_data = excel_data.parse(sheet_name)
    sheet_data = clean_dataframe(sheet_data)
    sheets_data[sheet_name] = sheet_data.to_dict(orient='records')

# Save the data to a JSON file with proper formatting
output_path = '/Users/erikpeterson/DartCourseReview/course_scraper/class_overview.json'
with open(output_path, 'w') as json_file:
    json.dump(sheets_data, json_file, indent=4)

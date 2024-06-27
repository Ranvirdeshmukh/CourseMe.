import requests
from bs4 import BeautifulSoup
import json

# Function to scrape data from a webpage
def scrape_data(url):
    response = requests.get(url)
    soup = BeautifulSoup(response.text, 'html.parser')

    # Find the table with the data (adjust the selector based on the actual HTML structure)
    table = soup.find('table')

    # Initialize an empty list to store the course data
    courses = []

    # Iterate over the rows in the table
    for row in table.find_all('tr'):
        # Extract the cells in the row
        cells = row.find_all('td')
        
        # Check if the row has the expected number of cells (adjust as needed)
        if len(cells) >= 4:
            department = cells[0].get_text(strip=True)
            course_code = cells[1].get_text(strip=True)
            course_name = cells[2].get_text(strip=True)
            try:
                layup_value = int(cells[3].get_text(strip=True))
            except ValueError:
                layup_value = 0  # Default to 0 if conversion fails

            # Construct the course dictionary
            course = {
                "name": f"{course_code}: {course_name}",
                "department": department,
                "layup": layup_value
            }

            # Add the course dictionary to the list
            courses.append(course)

    return courses

# URL of the webpage to scrape (adjust as needed)
url = 'https://docs.google.com/spreadsheets/d/1i_NDdqpUhaEedLqN75XKdmpCjTHr3y0-/edit?usp=sharing&ouid=112444726770937492372&rtpof=true&sd=true'

# Scrape the data
courses = scrape_data(url)

# Convert the list of courses to a JSON string
courses_json = json.dumps(courses, indent=4)

# Save the JSON data to a file
with open('md.json', 'w') as f:
    f.write(courses_json)

print("Data has been scraped and saved to courses.json")

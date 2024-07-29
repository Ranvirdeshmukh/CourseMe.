import json
import os
import re
from collections import defaultdict

def load_data(base_path):
    data = {}
    departments = [
        "AAAS", "AMEL", "AMES", "ANTH", "ARAB", "ARTH", "ASCL", "ASTR", "BIOL", "CHEM", 
        "CHIN", "CLST", "COCO", "COGS", "COLT", "COSC", "CRWT", "EARS", "ECON", "EDUC", 
        "ENGL", "ENGS", "ENVS", "FILM", "FREN", "FRIT", "GEOG", "GERM", "GOVT", "GRK", 
         "HEBR", "HIST", "HUM", "INTS", "ITAL", "JAPN", "JWST", "LACS", 
        "LING", "MATH", "MES", "MUS", "NAIS", "NAS", "PBPL", "PHIL", "PHYS", "PORT", 
        "PSYC", "QSS", "REL", "RUSS", "SART", "SOCY", "SPAN", "SPEE", "SSOC", "THEA", 
        "TUCK", "WGSS", "WRIT"
    ]
    
    for dept in departments:
        file_path = os.path.join(base_path, f"{dept}.json")
        try:
            with open(file_path, 'r') as file:
                department_data = json.load(file)
                data.update(department_data)
        except FileNotFoundError:
            print(f"Warning: File not found for department {dept}")
        except json.JSONDecodeError:
            print(f"Warning: Invalid JSON in file for department {dept}")
    
    return data

def search(query, data):
    query_words = set(re.findall(r'\w+', query.lower()))
    best_match = None
    best_score = 0
    
    for class_name, class_data in data.items():
        class_words = set(re.findall(r'\w+', class_name.lower()))
        score = len(query_words & class_words)
        
        if score > best_score:
            best_score = score
            best_match = (class_name, class_data)
    
    return best_match

def analyze_difficulty(reviews):
    difficulty_keywords = {
        'easy': -2, 'simple': -2, 'straightforward': -1,
        'moderate': 0, 'average': 0,
        'challenging': 1, 'difficult': 2, 'hard': 2, 'tough': 2
    }
    
    total_score = 0
    count = 0
    
    for review in reviews:
        words = re.findall(r'\w+', review.lower())
        for word in words:
            if word in difficulty_keywords:
                total_score += difficulty_keywords[word]
                count += 1
    
    if count == 0:
        return "Unable to determine difficulty from the reviews."
    
    avg_score = total_score / count
    if avg_score < -1:
        return "relatively easy", avg_score
    elif -1 <= avg_score < 0:
        return "moderately easy", avg_score
    elif 0 <= avg_score < 1:
        return "average difficulty", avg_score
    else:
        return "challenging or difficult", avg_score

def get_professor_reviews(data, professor_name):
    all_reviews = []
    for class_name, class_data in data.items():
        if professor_name in class_data:
            all_reviews.extend(review.split(": ", 1)[1].strip('"') for review in class_data[professor_name])
    return all_reviews

def generate_response(query, match, data):
    if not match:
        return "I'm sorry, I couldn't find information related to your query."
    
    class_name, class_data = match
    query_lower = query.lower()
    
    if "difficult" in query_lower or "hard" in query_lower or "easy" in query_lower:
        if "professor" in query_lower:
            professor = next((p for p in class_data.keys() if p.lower() in query_lower), None)
            if professor:
                reviews = [review.split(": ", 1)[1].strip('"') for review in class_data[professor]]
                difficulty, score = analyze_difficulty(reviews)
                return f"{professor} teaching {class_name} seems to be {difficulty} (score: {score:.2f}) based on the reviews."
            else:
                return f"I couldn't find a specific professor for {class_name} in your query. Please specify a professor name."
        else:
            all_reviews = []
            for prof, prof_data in class_data.items():
                all_reviews.extend(review.split(": ", 1)[1].strip('"') for review in prof_data)
            difficulty, score = analyze_difficulty(all_reviews)
            return f"{class_name} seems to be {difficulty} (score: {score:.2f}) based on the reviews."
    elif "professor" in query_lower:
        professor = next((p for p in class_data.keys() if p.lower() in query_lower), None)
        if professor:
            all_reviews = get_professor_reviews(data, professor)
            difficulty, score = analyze_difficulty(all_reviews)
            return f"{professor} overall seems to be {difficulty} (score: {score:.2f}) based on all their reviews across different classes."
        else:
            professors = list(class_data.keys())
            return f"The professors for {class_name} are: {', '.join(professors)}"
    elif "review" in query_lower:
        all_reviews = []
        for prof, prof_data in class_data.items():
            all_reviews.extend(review.split(": ", 1)[1].strip('"') for review in prof_data)
        return f"Here's a review for {class_name}: {all_reviews[0] if all_reviews else 'No reviews available.'}"
    else:
        return f"I found information about {class_name}. What specific information would you like? (e.g., difficulty, professors, reviews)"

def answer_question(query, data):
    match = search(query, data)
    return generate_response(query, match, data)

# Example usage
base_path = "data/classData/"
data = load_data(base_path)

while True:
    query = input("Ask a question about classes or professors: ")
    if query.lower() == 'quit':
        break
    response = answer_question(query, data)
    print(response)
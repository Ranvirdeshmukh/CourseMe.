import json
import os
import re
from collections import defaultdict
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer, CountVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.naive_bayes import MultinomialNB
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from nltk.sentiment import SentimentIntensityAnalyzer
import spacy

# Download necessary NLTK data
nltk.download('punkt', quiet=True)
nltk.download('stopwords', quiet=True)
nltk.download('vader_lexicon', quiet=True)

# Load spaCy model
nlp = spacy.load("en_core_web_sm")

def load_data(base_path):
    # Existing implementation
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

def preprocess_text(text):
    # Updated implementation using spaCy
    doc = nlp(text.lower())
    tokens = [token.lemma_ for token in doc if not token.is_stop and token.is_alpha]
    return ' '.join(tokens)

def prepare_labeled_dataset(data):
    # Existing implementation
    reviews = []
    labels = []
    sia = SentimentIntensityAnalyzer()
    
    for class_name, class_data in data.items():
        for prof, prof_reviews in class_data.items():
            for review in prof_reviews:
                review_text = review.split(": ", 1)[1].strip('"')
                sentiment_scores = sia.polarity_scores(review_text)
                compound_score = sentiment_scores['compound']
                
                if compound_score <= -0.05:
                    labels.append(3)  # challenging or difficult
                elif -0.05 < compound_score <= 0.05:
                    labels.append(2)  # average difficulty
                elif 0.05 < compound_score <= 0.5:
                    labels.append(1)  # moderately easy
                else:
                    labels.append(0)  # relatively easy
                
                reviews.append(review_text)
    
    return reviews, labels

def train_difficulty_classifier(reviews, labels):
    # Existing implementation
    X_train, X_test, y_train, y_test = train_test_split(reviews, labels, test_size=0.2, random_state=42)
    
    vectorizer = CountVectorizer()
    X_train_vectorized = vectorizer.fit_transform(X_train)
    X_test_vectorized = vectorizer.transform(X_test)
    
    classifier = MultinomialNB()
    classifier.fit(X_train_vectorized, y_train)
    
    y_pred = classifier.predict(X_test_vectorized)
    print(classification_report(y_test, y_pred))
    
    return classifier

def analyze_difficulty(reviews):
    # Existing implementation
    sia = SentimentIntensityAnalyzer()
    sentiment_scores = [sia.polarity_scores(review)['compound'] for review in reviews]
    
    difficulty_mapping = {
        0: "relatively easy",
        1: "moderately easy",
        2: "average difficulty",
        3: "challenging or difficult"
    }
    
    labels = []
    for score in sentiment_scores:
        if score <= -0.05:
            labels.append(3)
        elif -0.05 < score <= 0.05:
            labels.append(2)
        elif 0.05 < score <= 0.5:
            labels.append(1)
        else:
            labels.append(0)
    
    avg_difficulty = sum(labels) / len(labels)
    return difficulty_mapping[round(avg_difficulty)], avg_difficulty

def create_embeddings(data):
    # Existing implementation
    all_reviews = []
    class_review_map = {}
    review_index = 0
    
    for class_name, class_data in data.items():
        class_review_map[class_name] = {}
        for prof, reviews in class_data.items():
            processed_reviews = [preprocess_text(review.split(": ", 1)[1].strip('"')) for review in reviews]
            print(f"Class: {class_name}, Professor: {prof}, Number of reviews: {len(processed_reviews)}")
            all_reviews.extend(processed_reviews)
            class_review_map[class_name][prof] = (review_index, review_index + len(processed_reviews))
            review_index += len(processed_reviews)
    
    print(f"Total number of reviews: {len(all_reviews)}")
    
    vectorizer = TfidfVectorizer()
    tfidf_matrix = vectorizer.fit_transform(all_reviews)
    
    reviews, labels = prepare_labeled_dataset(data)
    classifier = train_difficulty_classifier(reviews, labels)
    
    return vectorizer, tfidf_matrix, class_review_map, classifier

def search(query, data, vectorizer, tfidf_matrix, class_review_map):
    # Existing implementation
    query_vector = vectorizer.transform([preprocess_text(query)])
    similarities = cosine_similarity(query_vector, tfidf_matrix)[0]
    
    best_match = None
    best_score = 0
    
    for class_name, prof_ranges in class_review_map.items():
        for prof, (start, end) in prof_ranges.items():
            if start < end:  # Check if the range is not empty
                score = np.max(similarities[start:end])
                if score > best_score:
                    best_score = score
                    best_match = (class_name, data[class_name])
    
    if best_match is None:
        # If no match was found, return a default response
        return (None, None), 0
    
    return best_match, best_score

def get_professor_reviews(data, professor_name):
    # Existing implementation
    all_reviews = []
    for class_name, class_data in data.items():
        if professor_name in class_data:
            all_reviews.extend(review.split(": ", 1)[1].strip('"') for review in class_data[professor_name])
    return all_reviews

# New function to extract entities from the query
def extract_entities(query):
    doc = nlp(query)
    entities = {
        'PERSON': [],
        'ORG': [],
        'GPE': [],
        'COURSE': []
    }
    for ent in doc.ents:
        if ent.label_ in entities:
            entities[ent.label_].append(ent.text)
    
    # Custom logic to identify course names (e.g., COSC 1, ENGL 10)
    course_pattern = re.compile(r'\b[A-Z]{4}\s*\d+\b')
    entities['COURSE'] = course_pattern.findall(query)
    
    return entities

# New function to identify the type of question
def identify_question_type(query):
    query_lower = query.lower()
    if any(word in query_lower for word in ['difficult', 'hard', 'easy']):
        return 'difficulty'
    elif 'professor' in query_lower or 'instructor' in query_lower:
        return 'professor'
    elif 'review' in query_lower:
        return 'review'
    elif 'workload' in query_lower:
        return 'workload'
    elif 'recommend' in query_lower:
        return 'recommendation'
    else:
        return 'general'

def generate_response(query, match, data, score):
    if match[0] is None:
        return "I'm sorry, I couldn't find any information related to your query."
    
    class_name, class_data = match
    entities = extract_entities(query)
    question_type = identify_question_type(query)
    
    response = f"Based on the similarity score of {score:.2f}, here's what I found:\n\n"
    
    if question_type == 'difficulty':
        professor = entities['PERSON'][0] if entities['PERSON'] else None
        if professor:
            reviews = [review.split(": ", 1)[1].strip('"') for review in class_data.get(professor, [])]
            if reviews:
                difficulty, diff_score = analyze_difficulty(reviews)
                response += f"{professor} teaching {class_name} seems to be {difficulty} (difficulty score: {diff_score:.2f}) based on the sentiment of the reviews."
            else:
                response += f"I couldn't find any reviews for {professor} teaching {class_name}."
        else:
            all_reviews = []
            for prof, prof_data in class_data.items():
                all_reviews.extend(review.split(": ", 1)[1].strip('"') for review in prof_data)
            difficulty, diff_score = analyze_difficulty(all_reviews)
            response += f"{class_name} seems to be {difficulty} (difficulty score: {diff_score:.2f}) based on the sentiment of the reviews."
    
    elif question_type == 'professor':
        professor = entities['PERSON'][0] if entities['PERSON'] else None
        if professor:
            all_reviews = get_professor_reviews(data, professor)
            difficulty, diff_score = analyze_difficulty(all_reviews)
            response += f"{professor} overall seems to be {difficulty} (difficulty score: {diff_score:.2f}) based on the sentiment of all their reviews across different classes."
        else:
            professors = list(class_data.keys())
            response += f"The professors for {class_name} are: {', '.join(professors)}"
    
    elif question_type == 'review':
        all_reviews = []
        for prof, prof_data in class_data.items():
            all_reviews.extend(review.split(": ", 1)[1].strip('"') for review in prof_data)
        response += f"Here are some reviews for {class_name}:\n"
        for i, review in enumerate(all_reviews[:3], 1):
            response += f"{i}. {review}\n"
    
    elif question_type == 'workload':
        workload_reviews = []
        for prof, prof_data in class_data.items():
            workload_reviews.extend([review for review in prof_data if 'workload' in review.lower()])
        if workload_reviews:
            response += f"Here are some comments about the workload for {class_name}:\n"
            for i, review in enumerate(workload_reviews[:3], 1):
                response += f"{i}. {review}\n"
        else:
            response += f"I couldn't find any specific comments about the workload for {class_name}."
    
    elif question_type == 'recommendation':
        positive_reviews = []
        for prof, prof_data in class_data.items():
            positive_reviews.extend([review for review in prof_data if SentimentIntensityAnalyzer().polarity_scores(review)['compound'] > 0.5])
        if positive_reviews:
            response += f"Based on positive reviews, here are some reasons students recommend {class_name}:\n"
            for i, review in enumerate(positive_reviews[:3], 1):
                response += f"{i}. {review}\n"
        else:
            response += f"I couldn't find any strong recommendations for {class_name}. You might want to look into the course details and requirements to decide if it's right for you."
    
    else:
        response += f"I found information about {class_name}. What specific information would you like? (e.g., difficulty, professors, reviews, workload, recommendations)"
    
    return response

def answer_question(query, data, vectorizer, tfidf_matrix, class_review_map):
    match, score = search(query, data, vectorizer, tfidf_matrix, class_review_map)
    return generate_response(query, match, data, score)

# Example usage
base_path = "data/classData/"
data = load_data(base_path)
vectorizer, tfidf_matrix, class_review_map, classifier = create_embeddings(data)

while True:
    query = input("Ask a question about classes or professors: ")
    if query.lower() == 'quit':
        break
    response = answer_question(query, data, vectorizer, tfidf_matrix, class_review_map)
    print(response)
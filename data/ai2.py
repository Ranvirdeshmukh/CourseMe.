import os
import json
from collections import defaultdict
import re
from textblob import TextBlob
from statistics import mean

class CourseAnalysisAI:
    def __init__(self):
        self.data_directory = os.path.join(os.getcwd(), 'data', 'classData')
        self.course_data = defaultdict(lambda: defaultdict(list))

    def load_data(self):
        print(f"Attempting to load data from: {self.data_directory}")
        if not os.path.exists(self.data_directory):
            print(f"Error: Directory not found: {self.data_directory}")
            return

        for filename in os.listdir(self.data_directory):
            if filename.endswith('.json'):
                file_path = os.path.join(self.data_directory, filename)
                print(f"Processing file: {file_path}")
                with open(file_path, 'r', encoding='utf-8') as file:
                    try:
                        data = json.load(file)
                        for course, teachers in data.items():
                            for teacher, reviews in teachers.items():
                                self.course_data[course][teacher].extend(reviews)
                        print(f"Successfully loaded data from {filename}")
                    except json.JSONDecodeError:
                        print(f"Error decoding JSON from file: {filename}")
                    except Exception as e:
                        print(f"Unexpected error processing {filename}: {str(e)}")

        print(f"Total courses loaded: {len(self.course_data)}")
        print("Courses found:")
        for course in self.course_data.keys():
            print(f"- {course}")

    def analyze_text(self, text):
        blob = TextBlob(text)
        sentiment = blob.sentiment.polarity
        subjectivity = blob.sentiment.subjectivity
        
        # Calculate readability (approximation of Flesch-Kincaid grade level)
        word_count = len(blob.words)
        sentence_count = len(blob.sentences)
        syllable_count = sum(self.count_syllables(word) for word in blob.words)
        if sentence_count == 0 or word_count == 0:
            readability = 0
        else:
            readability = 0.39 * (word_count / sentence_count) + 11.8 * (syllable_count / word_count) - 15.59

        # Look for specific difficulty indicators
        difficulty_indicators = ['hard', 'difficult', 'challenging', 'easy', 'simple']
        difficulty_count = sum(text.lower().count(word) for word in difficulty_indicators)

        return {
            'sentiment': sentiment,
            'subjectivity': subjectivity,
            'readability': readability,
            'difficulty_count': difficulty_count
        }

    def count_syllables(self, word):
        word = word.lower()
        count = 0
        vowels = 'aeiouy'
        if word[0] in vowels:
            count += 1
        for index in range(1, len(word)):
            if word[index] in vowels and word[index - 1] not in vowels:
                count += 1
        if word.endswith('e'):
            count -= 1
        if word.endswith('le'):
            count += 1
        if count == 0:
            count += 1
        return count

    def get_difficulty_level(self, score):
        if score < -0.5:
            return "Easy"
        elif -0.5 <= score < -0.2:
            return "Moderately Easy"
        elif -0.2 <= score < 0.2:
            return "Moderate"
        elif 0.2 <= score < 0.5:
            return "Challenging"
        else:
            return "Very Challenging"

    def analyze_reviews(self, reviews):
        if not reviews:
            return None

        analyses = [self.analyze_text(review) for review in reviews]
        avg_sentiment = mean(a['sentiment'] for a in analyses)
        avg_subjectivity = mean(a['subjectivity'] for a in analyses)
        avg_readability = mean(a['readability'] for a in analyses)
        total_difficulty_count = sum(a['difficulty_count'] for a in analyses)

        difficulty_score = -avg_sentiment + (avg_readability / 10) + (total_difficulty_count / len(reviews))
        difficulty_level = self.get_difficulty_level(difficulty_score)

        return {
            'difficulty_score': difficulty_score,
            'difficulty_level': difficulty_level,
            'avg_sentiment': avg_sentiment,
            'avg_subjectivity': avg_subjectivity,
            'avg_readability': avg_readability,
            'review_count': len(reviews)
        }

    def get_course_difficulty(self, course_name):
        if course_name in self.course_data:
            all_reviews = []
            for teacher, reviews in self.course_data[course_name].items():
                all_reviews.extend(reviews)
            
            analysis = self.analyze_reviews(all_reviews)
            if not analysis:
                return f"No reviews found for course: {course_name}"

            teachers = list(self.course_data[course_name].keys())
            return f"Course: {course_name}\n" \
                   f"Difficulty: {analysis['difficulty_level']} (Score: {analysis['difficulty_score']:.2f})\n" \
                   f"Average Sentiment: {analysis['avg_sentiment']:.2f}\n" \
                   f"Average Readability: {analysis['avg_readability']:.2f}\n" \
                   f"Teachers: {', '.join(teachers)}\n" \
                   f"Total reviews: {analysis['review_count']}"
        else:
            return f"No data found for course: {course_name}"

    def get_teacher_difficulty(self, teacher_name):
        teacher_reviews = []
        courses_taught = []
        for course, teachers in self.course_data.items():
            if teacher_name in teachers:
                teacher_reviews.extend(teachers[teacher_name])
                courses_taught.append(course)

        if not teacher_reviews:
            return f"No reviews found for teacher: {teacher_name}"

        analysis = self.analyze_reviews(teacher_reviews)
        return f"Teacher: {teacher_name}\n" \
               f"Difficulty: {analysis['difficulty_level']} (Score: {analysis['difficulty_score']:.2f})\n" \
               f"Average Sentiment: {analysis['avg_sentiment']:.2f}\n" \
               f"Average Readability: {analysis['avg_readability']:.2f}\n" \
               f"Courses Taught: {', '.join(courses_taught)}\n" \
               f"Total reviews: {analysis['review_count']}"

    def get_course_teacher_difficulty(self, course_name, teacher_name):
        if course_name in self.course_data and teacher_name in self.course_data[course_name]:
            reviews = self.course_data[course_name][teacher_name]
            analysis = self.analyze_reviews(reviews)
            if not analysis:
                return f"No reviews found for {teacher_name} teaching {course_name}"

            return f"Course: {course_name}\n" \
                   f"Teacher: {teacher_name}\n" \
                   f"Difficulty: {analysis['difficulty_level']} (Score: {analysis['difficulty_score']:.2f})\n" \
                   f"Average Sentiment: {analysis['avg_sentiment']:.2f}\n" \
                   f"Average Readability: {analysis['avg_readability']:.2f}\n" \
                   f"Total reviews: {analysis['review_count']}"
        else:
            return f"No data found for {teacher_name} teaching {course_name}"

    def answer_question(self, question):
        question = question.lower()
        if "how difficult is" in question:
            parts = question.split("how difficult is")[-1].strip().split("with")
            if len(parts) == 2:
                course_name = parts[0].strip().upper()
                teacher_name = parts[1].strip().title()
                return self.get_course_teacher_difficulty(course_name, teacher_name)
            else:
                name = parts[0].strip().upper()
                if name in self.course_data:
                    return self.get_course_difficulty(name)
                else:
                    return self.get_teacher_difficulty(name.title())
        elif "list courses" in question:
            return "Available courses:\n" + "\n".join(sorted(self.course_data.keys()))
        elif "list teachers" in question:
            teachers = set()
            for course_teachers in self.course_data.values():
                teachers.update(course_teachers.keys())
            return "Available teachers:\n" + "\n".join(sorted(teachers))
        else:
            return "I'm sorry, I couldn't understand your question. Please ask about the difficulty of a specific course, teacher, or course with a specific teacher, or ask to list courses or teachers."

# Usage example
ai = CourseAnalysisAI()
ai.load_data()

while True:
    question = input("Ask a question (or type 'quit' to exit): ")
    if question.lower() == 'quit':
        break
    print(ai.answer_question(question))
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
        self.course_prefix_map = {
            'COSC': ['CS', 'COMP', 'COMPUTER SCIENCE'],
            'MATH': ['MATHEMATICS'],
            'PHYS': ['PHYSICS'],
            'CHEM': ['CHEMISTRY'],
            'BIOL': ['BIOLOGY'],
            'ENGL': ['ENGLISH'],
            'HIST': ['HISTORY'],
            'PSYC': ['PSYCHOLOGY', 'PSYCH'],
            'ECON': ['ECONOMICS'],
            'GRK': ['GREEK'],
            'LAT': ['LATIN'],
            # Add more mappings as needed
        }
        self.reverse_prefix_map = {alt: prefix for prefix, alts in self.course_prefix_map.items() for alt in alts}

    def load_data(self):
        # print(f"Attempting to load data from: {self.data_directory}")
        if not os.path.exists(self.data_directory):
            print(f"Error: Directory not found: {self.data_directory}")
            return

        for filename in os.listdir(self.data_directory):
            if filename.endswith('.json'):
                file_path = os.path.join(self.data_directory, filename)
                # print(f"Processing file: {file_path}")
                with open(file_path, 'r', encoding='utf-8') as file:
                    try:
                        data = json.load(file)
                        for course, teachers in data.items():
                            for teacher, reviews in teachers.items():
                                self.course_data[course][teacher].extend(reviews)
                        # print(f"Successfully loaded data from {filename}")
                    except json.JSONDecodeError:
                        print(f"Error decoding JSON from file: {filename}")
                    except Exception as e:
                        print(f"Unexpected error processing {filename}: {str(e)}")

        print(f"Total courses loaded: {len(self.course_data)}")
        print("Courses found:")
        # for course in self.course_data.keys():
        #     # print(f"- {course}")

    def normalize_course_name(self, course_name):
        course_name = course_name.upper().replace(" ", "")
        match = re.match(r"([A-Z]+)(\d+)", course_name)
        if match:
            prefix, number = match.groups()
            if prefix in self.course_prefix_map:
                normalized_prefix = prefix
            elif prefix in self.reverse_prefix_map:
                normalized_prefix = self.reverse_prefix_map[prefix]
            else:
                return course_name
            normalized_number = str(int(number))
            return f"{normalized_prefix}{normalized_number.zfill(3)}"
        return course_name

    def find_matching_course(self, course_name):
        normalized_name = self.normalize_course_name(course_name)
        if normalized_name in self.course_data:
            return normalized_name
        for course in self.course_data.keys():
            if course.startswith(normalized_name):
                return course
        return None

    def analyze_text(self, text):
        blob = TextBlob(text)
        sentiment = blob.sentiment.polarity
        subjectivity = blob.sentiment.subjectivity
        
        word_count = len(blob.words)
        sentence_count = len(blob.sentences)
        syllable_count = sum(self.count_syllables(word) for word in blob.words)
        if sentence_count == 0 or word_count == 0:
            readability = 0
        else:
            readability = 0.39 * (word_count / sentence_count) + 11.8 * (syllable_count / word_count) - 15.59

        difficulty_words = ['hard', 'difficult', 'challenging', 'tough', 'complex']
        easiness_words = ['easy', 'simple', 'straightforward', 'clear', 'manageable']
        difficulty_count = sum(text.lower().count(word) for word in difficulty_words)
        easiness_count = sum(text.lower().count(word) for word in easiness_words)

        return {
            'sentiment': sentiment,
            'subjectivity': subjectivity,
            'readability': readability,
            'difficulty_count': difficulty_count,
            'easiness_count': easiness_count
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
            return "Very Easy"
        elif -0.5 <= score < -0.2:
            return "Easy"
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
        total_easiness_count = sum(a['easiness_count'] for a in analyses)

        difficulty_score = (
            -avg_sentiment
            + (avg_readability / 20)
            + (total_difficulty_count - total_easiness_count) / len(reviews)
        )
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
                   f"Average Sentiment: {analysis['avg_sentiment']:.2f} (Positive is easier)\n" \
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
               f"Average Sentiment: {analysis['avg_sentiment']:.2f} (Positive is easier)\n" \
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
                   f"Average Sentiment: {analysis['avg_sentiment']:.2f} (Positive is easier)\n" \
                   f"Average Readability: {analysis['avg_readability']:.2f}\n" \
                   f"Total reviews: {analysis['review_count']}"
        else:
            return f"No data found for {teacher_name} teaching {course_name}"


    def get_easiest_hardest_professor(self, course_name, difficulty_type='easiest'):
        matched_course = self.find_matching_course(course_name)
        if not matched_course or matched_course not in self.course_data:
            return f"No data found for course: {course_name}"

        teacher_difficulties = []
        for teacher, reviews in self.course_data[matched_course].items():
            analysis = self.analyze_reviews(reviews)
            if analysis:
                teacher_difficulties.append((teacher, analysis['difficulty_score']))

        if not teacher_difficulties:
            return f"No teacher data found for course: {matched_course}"

        teacher_difficulties.sort(key=lambda x: x[1], reverse=(difficulty_type == 'hardest'))
        easiest_or_hardest = teacher_difficulties[0]

        difficulty_word = "easiest" if difficulty_type == 'easiest' else "hardest"
        return f"The {difficulty_word} professor for {matched_course} is {easiest_or_hardest[0]} " \
               f"with a difficulty score of {easiest_or_hardest[1]:.2f}"

    def compare_professors(self, course_name, professor1, professor2):
        matched_course = self.find_matching_course(course_name)
        if not matched_course or matched_course not in self.course_data:
            return f"No data found for course: {course_name}"

        prof1_data = self.get_course_teacher_difficulty(matched_course, professor1)
        prof2_data = self.get_course_teacher_difficulty(matched_course, professor2)

        if "No data found" in prof1_data or "No data found" in prof2_data:
            return f"Insufficient data to compare {professor1} and {professor2} for {matched_course}"

        prof1_score = float(re.search(r"Difficulty: .* \(Score: ([-\d.]+)\)", prof1_data).group(1))
        prof2_score = float(re.search(r"Difficulty: .* \(Score: ([-\d.]+)\)", prof2_data).group(1))

        if prof1_score < prof2_score:
            recommendation = f"{professor1} might be easier"
        elif prof2_score < prof1_score:
            recommendation = f"{professor2} might be easier"
        else:
            recommendation = "Both professors seem to have similar difficulty levels"

        return f"Comparison for {matched_course}:\n" \
               f"{professor1}'s difficulty score: {prof1_score:.2f}\n" \
               f"{professor2}'s difficulty score: {prof2_score:.2f}\n" \
               f"Recommendation: {recommendation}"

    def answer_question(self, question):
        question = question.lower()
        
        # Existing difficulty phrases
        difficulty_phrases = [
            "how difficult", "how hard", "how challenging", "how tough",
            "is it difficult", "is it hard", "is it challenging", "is it tough",
            "difficulty of", "hardness of", "challenge of",
            "easy or hard", "easy or difficult"
        ]
        
        # Updated patterns for easiest/hardest professor and professor comparison
        easiest_hardest_pattern = r"who is the (easiest|hardest) professor for (.+)"
        compare_professors_pattern = r"(.+) and (.+) are teaching (.+)(?:this term)?.*who should i take"
        
        # Check for easiest/hardest professor question
        match = re.match(easiest_hardest_pattern, question)
        if match:
            difficulty_type, course = match.groups()
            return self.get_easiest_hardest_professor(course, difficulty_type)
        
        # Check for professor comparison question
        match = re.match(compare_professors_pattern, question, re.IGNORECASE)
        if match:
            prof1, prof2, course = match.groups()
            return self.compare_professors(course.strip(), prof1.strip().title(), prof2.strip().title())
        
        # Existing logic for difficulty-related questions
        if any(phrase in question for phrase in difficulty_phrases):
            parts = re.split(r'\b(?:is|with|for)\b', question, maxsplit=1)
            if len(parts) == 2:
                name = parts[1].strip()
                if "with" in question or "taught by" in question:
                    course_name, teacher_name = re.split(r'\b(?:with|taught by)\b', name, maxsplit=1)
                    course_name = course_name.strip()
                    teacher_name = teacher_name.strip().title()
                    matched_course = self.find_matching_course(course_name)
                    if matched_course:
                        return self.get_course_teacher_difficulty(matched_course, teacher_name)
                    else:
                        return f"No matching course found for '{course_name}'"
                else:
                    matched_course = self.find_matching_course(name)
                    if matched_course:
                        return self.get_course_difficulty(matched_course)
                    else:
                        return self.get_teacher_difficulty(name.title())
            else:
                return "I'm sorry, I couldn't understand your question. Please specify a course, teacher, or both."
        
        # Existing logic for listing courses and teachers
        elif any(phrase in question for phrase in ["list courses", "show courses", "what courses", "available courses"]):
            return "Available courses:\n" + "\n".join(sorted(self.course_data.keys()))
        elif any(phrase in question for phrase in ["list teachers", "show teachers", "what teachers", "available teachers"]):
            teachers = set()
            for course_teachers in self.course_data.values():
                teachers.update(course_teachers.keys())
            return "Available teachers:\n" + "\n".join(sorted(teachers))
        
        else:
            return "I'm sorry, I couldn't understand your question. You can ask about the difficulty of a course or teacher, " \
                   "the easiest/hardest professor for a course, compare professors, or ask to list courses or teachers. For example:\n" \
                   "- How difficult is COSC 101?\n" \
                   "- Is Physics 201 hard?\n" \
                   "- How challenging is Professor Smith?\n" \
                   "- What's the difficulty of Math 301 with Dr. Johnson?\n" \
                   "- Who is the easiest professor for Chemistry 202?\n" \
                   "- Dr. Brown and Prof. White are teaching Biology 101 this term, who should I take?\n" \
                   "- List available courses\n" \
                   "- Show me the teachers"
        
        
# # Usage example remains the same
# ai = CourseAnalysisAI()
# ai.load_data()

# while True:
#     question = input("Ask a question (or type 'quit' to exit): ")
#     if question.lower() == 'quit':
#         break
#     print(ai.answer_question(question))

if __name__ == "__main__":
    print("This script is not meant to be run directly.")
    print("Please run app.py to start the Flask server.")
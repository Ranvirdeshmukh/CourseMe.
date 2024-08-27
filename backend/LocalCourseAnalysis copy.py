import pickle
from collections import defaultdict
import logging
import re
from textblob import TextBlob
from statistics import mean
import os
import random

class LocalCourseAnalysis:
    def __init__(self):
        self.course_data = defaultdict(lambda: defaultdict(list))
        self.logger = logging.getLogger(__name__)
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
        }
        self.reverse_prefix_map = {alt: prefix for prefix, alts in self.course_prefix_map.items() for alt in alts}

    def load_data(self):
        file_path = 'course_data_cache.pkl'
        self.logger.info(f"Attempting to load cache from local file: {file_path}")

        if not os.path.exists(file_path):
            self.logger.error(f"Cache file not found: {file_path}")
            raise FileNotFoundError(f"Cache file not found: {file_path}")

        file_size = os.path.getsize(file_path)
        self.logger.info(f"Cache file found. Size: {file_size} bytes")

        if file_size == 0:
            self.logger.error(f"Cache file is empty: {file_path}")
            raise ValueError(f"Cache file is empty: {file_path}")

        try:
            with open(file_path, 'rb') as f:
                self.course_data = pickle.load(f)
            self.logger.info(f"Data loaded from local cache. Total courses: {len(self.course_data)}")
        except Exception as e:
            self.logger.error(f"Error loading cache from local file: {str(e)}")
            raise ValueError(f"Error loading cache from local file: {str(e)}")

    def get_friendly_intro(self):
        intros = [
            "Hey there! ",
            "Alright, let's see... ",
            "Hmm, interesting question! ",
            "Great question! ",
            "I've got some insights for you. ",
            "Let me crunch some numbers for you real quick. "
        ]
        return random.choice(intros)

    def get_difficulty_comment(self, difficulty_level):
        comments = {
            "very easy": [
                "It's a walk in the park!",
                "You could probably ace this one in your sleep.",
                "Seriously, it's as easy as they come."
            ],
            "easy": [
                "It shouldn't give you too much trouble.",
                "Most students find this one pretty manageable.",
                "You've got this! It's on the easier side."
            ],
            "moderate": [
                "It's right in the middle - not too easy, not too hard.",
                "You'll need to put in some effort, but it's totally doable.",
                "It's a good balance of challenge and manageability."
            ],
            "challenging": [
                "Brace yourself, this one's a bit of a toughie.",
                "You might want to clear your schedule for this course.",
                "It's definitely going to push you, but in a good way!"
            ],
            "very challenging": [
                "Whew! This one's a real brain-bender.",
                "Hope you like a challenge, because this course brings it!",
                "You might want to stock up on coffee for this one."
            ]
        }
        return random.choice(comments.get(difficulty_level, ["This course's difficulty is hard to pin down."]))
    
    def find_matching_course(self, course_name):
        normalized_name = self.normalize_course_name(course_name)
        if normalized_name in self.course_data:
            return normalized_name
        for course in self.course_data.keys():
            if course.startswith(normalized_name):
                return course
        return None
    
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
        sentiment_level = self.get_sentiment_level(avg_sentiment)

        return {
            'difficulty_score': difficulty_score,
            'difficulty_level': difficulty_level,
            'sentiment_level': sentiment_level,
            'avg_sentiment': avg_sentiment,
            'avg_subjectivity': avg_subjectivity,
            'avg_readability': avg_readability,
            'review_count': len(reviews)
        }
    
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
    
    def get_sentiment_level(self, score): 
        if score < -0.5:
            return "strongly dislike"
        elif -0.5 <= score < -0.2:
            return "dislike"
        elif -0.2 <= score < 0.2:
            return "feel neutral"
        elif 0.2 <= score < 0.5:
            return "like"
        else:
            return "love"
    
    def get_difficulty_level(self, score):
        if score < -0.5:
            return "very easy"
        elif -0.5 <= score < -0.2:
            return "easy"
        elif -0.2 <= score < 0.2:
            return "moderate"
        elif 0.2 <= score < 0.5:
            return "challenging"
        else:
            return "very challenging"
    
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

    def get_course_difficulty(self, course_name):
        matched_course = self.find_matching_course(course_name)
        if matched_course in self.course_data:
            all_reviews = []
            for teacher, reviews in self.course_data[matched_course].items():
                all_reviews.extend(reviews)
            
            analysis = self.analyze_reviews(all_reviews)
            if not analysis:
                return f"Oops! I couldn't find any reviews for {matched_course}. It's like trying to find a needle in a haystack!"

            teachers = list(self.course_data[matched_course].keys())
            
            response = self.get_friendly_intro() + "\n"
            response += f"So, about {matched_course}... "
            response += self.get_difficulty_comment(analysis['difficulty_level']) + "\n" 
            response += f"This class is considered \"{analysis['difficulty_level']}\" with a difficulty score of {analysis['difficulty_score']:.2f} (from around -0.5 to 0.5)\n"
            response += f"Students tended to \"{analysis['sentiment_level']}\" this class with a sentiment score of {analysis['avg_sentiment']:.2f} (from around -0.5 to 0.5)\n "
            #response += f"You've got {', '.join(teachers[:-1])}, and {teachers[-1]} teaching this one. "
            response += self.get_quality_comment(analysis['review_count'], analysis['avg_readability'])
            
            return response
        else:
            return f"I've looked high and low, but I can't seem to find any data on {course_name}. Are you sure that's the right course code?"

    def get_quality_comment(self, review_count, avg_readability):
        count_comments = {
            "none": [
                "It's a walk in the park! ",
                "You could probably ace this one in your sleep. ",
                "Seriously, it's as easy as they come. "
            ],
            "low": [
                "It shouldn't give you too much trouble. ",
                "Most students find this one pretty manageable. ",
                "You've got this! It's on the easier side. "
            ],
            "medium": [
                "It's right in the middle - not too easy, not too hard. ",
                "You'll need to put in some effort, but it's totally doable. ",
                "It's a good balance of challenge and manageability. "
            ],
            "high": [
                "Brace yourself, this one's a bit of a toughie. ",
                "You might want to clear your schedule for this course. ",
                "It's definitely going to push you, but in a good way! "
            ],
            "extremely high": [
                "Whew! This one's a real brain-bender. ",
                "Hope you like a challenge, because this course brings it! ",
                "You might want to stock up on coffee for this one. "
            ]
        }
        count = ""
        if (review_count <= 10):
            count = "almost no"
        elif(review_count <= 20):
            count = "not many"
        elif(review_count <= 40):
            count = "a good amount of"
        else:
            count = "a ton of"

        quality = ""
        if (avg_readability < 1):
            quality = "very low"
        elif (avg_readability < 3):
            quality = "low"
        elif(avg_readability < 5):
            quality = "good"
        elif(avg_readability < 7):
            quality = "high"
        else:
            quality = "very reliable"
        
        return "As for the quality of reviews, there are " + count + " reviews (" + str(review_count) + " to be specific) and they tend to be of " + quality + " quality"
        
    
    def get_teacher_difficulty(self, teacher_name):
        teacher_reviews = []
        courses_taught = []
        for course, teachers in self.course_data.items():
            if teacher_name in teachers:
                teacher_reviews.extend(teachers[teacher_name])
                courses_taught.append(course)

        if not teacher_reviews:
            return f"Hmm, I'm drawing a blank on {teacher_name}. Are you sure you've got the name right?"

        analysis = self.analyze_reviews(teacher_reviews)
        if not analysis:
            return f"I found {teacher_name}, but I don't have enough data to analyze their difficulty."

        response = self.get_friendly_intro()
        response += f"Let's talk about Professor {teacher_name}. "
        difficulty_comment = self.get_difficulty_comment(analysis['difficulty_level'])
        response += difficulty_comment + " "  # Remove newline and add space
        response += f"They are considered {analysis['difficulty_level']} with a difficulty score of {analysis['difficulty_score']:.2f}. "
        response += f"According to the reviews, students seem to {analysis['sentiment_level']} their classes (with a sentiment score of {analysis['avg_sentiment']:.2f}). "
        if courses_taught:
            response += f"They're teaching {', '.join(courses_taught[:-1])}"
            if len(courses_taught) > 1:
                response += f", and {courses_taught[-1]}. "
            else:
                response += f"{courses_taught[0]}. "
        response += self.get_quality_comment(analysis['review_count'], analysis['avg_readability'])

        return response

    def get_course_teacher_difficulty(self, course_name, teacher_name):
        matched_course = self.find_matching_course(course_name)
        if matched_course in self.course_data and teacher_name in self.course_data[matched_course]:
            reviews = self.course_data[matched_course][teacher_name]
            analysis = self.analyze_reviews(reviews)
            if not analysis:
                return f"Well, this is awkward. I don't have any reviews for {teacher_name} teaching {matched_course}. Maybe they're new?"

            response = self.get_friendly_intro()
            response += f"Let's talk about {matched_course} with Professor {teacher_name}. "
            response += self.get_difficulty_comment(analysis['difficulty_level'])
            response += f"\nStudents think this combination is {analysis['difficulty_level']} with a difficulty score of {analysis['difficulty_score']:.2f}.\n"
            response += f"Students generally {analysis['sentiment_level']} this combo (with a sentiment score of {analysis['avg_sentiment']:.2f}). "
            response += self.get_quality_comment(analysis['review_count'], analysis['avg_readability'])
            
            return response
        else:
            return f"I'm scratching my head here. I can't find any data on {teacher_name} teaching {course_name}. Are you sure you've got that right?"

    def get_easiest_hardest_professor(self, course_name, difficulty_type='easiest'):
        matched_course = self.find_matching_course(course_name)
        if not matched_course or matched_course not in self.course_data:
            return f"Hmm, I've searched everywhere, but I can't find any data on {course_name}. Maybe it's a new course?"

        teacher_difficulties = []
        for teacher, reviews in self.course_data[matched_course].items():
            analysis = self.analyze_reviews(reviews)
            if analysis:
                teacher_difficulties.append((teacher, analysis['difficulty_score']))

        if not teacher_difficulties:
            return f"Well, this is embarrassing. I've got the course {matched_course}, but no teacher data. It's like having a stage with no actors!"

        teacher_difficulties.sort(key=lambda x: x[1], reverse=(difficulty_type == 'hardest'))
        easiest_or_hardest = teacher_difficulties[0]

        difficulty_word = "easiest" if difficulty_type == 'easiest' else "hardest"
        response = self.get_friendly_intro()
        response += f"If you're looking for the {difficulty_word} ride in {matched_course}, "
        response += f"you might want to check out {easiest_or_hardest[0]}. "
        response += f"They've got a difficulty score of {easiest_or_hardest[1]:.2f}. "
        
        if difficulty_type == 'easiest':
            response += "It's like they're handing out A's like candy! "
        else:
            response += "Prepare for a real academic workout with this one! "
        
        response += "But remember, the 'easiest' professor isn't always the best for learning. Choose wisely!"
        
        return response

    # def compare_professors(self, course_name, professor1, professor2):
    #     matched_course = self.find_matching_course(course_name)
    #     if not matched_course or matched_course not in self.course_data:
    #         return f"I'm drawing a blank on {course_name}. Are you sure that's a course we offer?"

    #     prof1_data = self.get_course_teacher_difficulty(matched_course, professor1)
    #     prof2_data = self.get_course_teacher_difficulty(matched_course, professor2)

    #     if "I'm scratching my head here" in prof1_data or "I'm scratching my head here" in prof2_data:
    #         return f"Uh oh, I'm having trouble finding data on both {professor1} and {professor2} for {matched_course}. Are you sure they're both teaching it?"

    #     prof1_score = float(re.search(r"difficulty score is ([-\d.]+)", prof1_data).group(1))
    #     prof2_score = float(re.search(r"difficulty score is ([-\d.]+)", prof2_data).group(1))

    #     response = self.get_friendly_intro()
    #     response += f"Let's compare {professor1} and {professor2} for {matched_course}. "
    #     response += f"{professor1}'s difficulty score is {prof1_score:.2f}, while {professor2}'s is {prof2_score:.2f}. "

    #     if prof1_score < prof2_score:
    #         response += f"Looks like {professor1} might be the easier option. "
    #     elif prof2_score < prof1_score:
    #         response += f"Seems like {professor2} might be the way to go for an easier time. "
    #     else:
    #         response += "Surprisingly, they're neck and neck in terms of difficulty! "

    #     response += "But remember, easier isn't always better. Think about your learning style and goals too!"

    #     return response
    # def compare_professors(self, course_name, professor1, professor2):
    #     matched_course = self.find_matching_course(course_name)
    #     if not matched_course or matched_course not in self.course_data:
    #         return f"I'm drawing a blank on {course_name}. Are you sure that's a course we offer?"

    #     prof1_data = self.get_course_teacher_difficulty(matched_course, professor1)
    #     prof2_data = self.get_course_teacher_difficulty(matched_course, professor2)

    #     if "I'm scratching my head here" in prof1_data or "I'm scratching my head here" in prof2_data:
    #         return f"Uh oh, I'm having trouble finding data on both {professor1} and {professor2} for {matched_course}. Are you sure they're both teaching it?"

    #     prof1_match = re.search(r"difficulty score of ([-\d.]+)", prof1_data)
    #     prof2_match = re.search(r"difficulty score of ([-\d.]+)", prof2_data)

    #     if not prof1_match or not prof2_match:
    #         return f"Sorry, I couldn't find difficulty scores for both professors. There might be an issue with the data."

    #     prof1_score = float(prof1_match.group(1))
    #     prof2_score = float(prof2_match.group(1))

    #     response = self.get_friendly_intro()
    #     response += f"Let's compare {professor1} and {professor2} for {matched_course}. "
    #     response += f"{professor1}'s difficulty score is {prof1_score:.2f}, while {professor2}'s is {prof2_score:.2f}. "

    #     if prof1_score < prof2_score:
    #         response += f"Looks like {professor1} might be the easier option. "
    #     elif prof2_score < prof1_score:
    #         response += f"Seems like {professor2} might be the way to go for an easier time. "
    #     else:
    #         response += "Surprisingly, they're neck and neck in terms of difficulty! "

    #     response += "But remember, easier isn't always better. Think about your learning style and goals too!"

    #     return response

    def compare_professors(self, course_name, professor1, professor2):
        matched_course = self.find_matching_course(course_name)
        if not matched_course or matched_course not in self.course_data:
            return f"I'm drawing a blank on {course_name}. Are you sure that's a course we offer?"

        prof1_data = self.get_course_teacher_difficulty(matched_course, professor1)
        prof2_data = self.get_course_teacher_difficulty(matched_course, professor2)

        if "I'm scratching my head here" in prof1_data or "I'm scratching my head here" in prof2_data:
            return f"Uh oh, I'm having trouble finding data on both {professor1} and {professor2} for {matched_course}. Are you sure they're both teaching it?"

        def extract_score(data):
            match = re.search(r"difficulty score of ([-\d.]+)", data)
            if match:
                # Remove any trailing periods and convert to float
                return float(match.group(1).rstrip('.'))
            return None

        prof1_score = extract_score(prof1_data)
        prof2_score = extract_score(prof2_data)

        if prof1_score is None or prof2_score is None:
            return f"Sorry, I couldn't find valid difficulty scores for both professors. There might be an issue with the data."

        response = self.get_friendly_intro()
        response += f"Let's compare {professor1} and {professor2} for {matched_course}. "
        response += f"{professor1}'s difficulty score is {prof1_score:.2f}, while {professor2}'s is {prof2_score:.2f}. "

        if prof1_score < prof2_score:
            response += f"Looks like {professor1} might be the easier option. "
        elif prof2_score < prof1_score:
            response += f"Seems like {professor2} might be the way to go for an easier time. "
        else:
            response += "Surprisingly, they're neck and neck in terms of difficulty! "

        response += "But remember, easier isn't always better. Think about your learning style and goals too!"

        return response
        
    def answer_question(self, question):
        question = question.lower()

        difficulty_phrases = [
            "how difficult", "how hard", "how challenging", "how tough",
            "is it difficult", "is it hard", "is it challenging", "is it tough",
            "difficulty of", "hardness of", "challenge of",
            "easy or hard", "easy or difficult"
        ]

        easiest_hardest_pattern = r"who is the (easiest|hardest) professor for (.+)"
        compare_professors_pattern = r"(.+) and (.+) are teaching (.+)(?:this term)?.*who should i take"

        match = re.match(easiest_hardest_pattern, question)
        if match:
            difficulty_type, course = match.groups()
            return self.get_easiest_hardest_professor(course, difficulty_type)

        match = re.match(compare_professors_pattern, question, re.IGNORECASE)
        if match:
            prof1, prof2, course = match.groups()
            return self.compare_professors(course.strip(), prof1.strip().title(), prof2.strip().title())

        if any(phrase in question for phrase in difficulty_phrases):
            parts = re.split(r'\b(?:is|with|for)\b', question, maxsplit=1)
            if len(parts) == 2:
                name = parts[1].strip()
                if "with" in question or "taught by" in question:
                    course_name, teacher_name = re.split(r'\b(?:with|taught by)\b', name, maxsplit=1)
                    course_name = course_name.strip()
                    teacher_name = teacher_name.strip().title()
                    return self.get_course_teacher_difficulty(course_name, teacher_name)
                else:
                    matched_course = self.find_matching_course(name)
                    if matched_course:
                        return self.get_course_difficulty(matched_course)
                    else:
                        return self.get_teacher_difficulty(name.title())
            else:
                return "I'm not quite sure what you're asking. Could you rephrase that?"

        
        elif any(phrase in question for phrase in ["list courses", "show courses", "what courses", "available courses"]):
            courses = sorted(self.course_data.keys())
            response = "Alright, let me pull up the course catalog for you. Here's what we've got:\n"
            response += "\n".join(courses[:10])  # Show only first 10 courses
            if len(courses) > 10:
                response += f"\n...and {len(courses) - 10} more. That's a lot of learning opportunities!"
            return response
        
        elif any(phrase in question for phrase in ["list teachers", "show teachers", "what teachers", "available teachers"]):
            teachers = set()
            for course_teachers in self.course_data.values():
                teachers.update(course_teachers.keys())
            teachers = sorted(teachers)
            response = "Let's see who's who in the academic zoo. Here are some of our esteemed educators:\n"
            response += "\n".join(teachers[:10])  # Show only first 10 teachers
            if len(teachers) > 10:
                response += f"\n...and {len(teachers) - 10} more. That's quite the brain trust!"
            return response
        
        else:
            return ("I'm scratching my head a bit here. Could you rephrase that? "
                    "I'm great at dishing out info on course difficulty, comparing professors, "
                    "or giving you the lowdown on teachers. Try something like:\n"
                    "- How tough is COSC 101?\n"
                    "- Is Physics 201 hard?\n"
                    "- How easy is Professor Smith?\n"
                    "- Melinda Petre and Elisabeth Curtis are teaching Econ 1, who should I take")

#     # Add a main function for testing
#     @classmethod
#     def main(cls):
#         analyzer = cls()
#         analyzer.load_data()
#         print("Data loaded successfully. Ready to answer questions.")

#         while True:
#             question = input("\nAsk a question (or type 'quit' to exit): ")
#             if question.lower() == 'quit':
#                 break
#             answer = analyzer.answer_question(question)
#             print("\nAnswer:")
#             print(answer)

# if __name__ == "__main__":
#     CachedCourseAnalysis.main()

def main():
    print("Initializing CachedCourseAnalysis...")
    analyzer = LocalCourseAnalysis()
    
    print("Loading data from Google Cloud Storage...")
    try:
        analyzer.load_data()
        print("Data loaded successfully. Ready to answer questions.")
    except Exception as e:
        print(f"Error loading data: {str(e)}")
        return

    print("\nWelcome to the Course Analyzer!")
    print("You can ask questions about course difficulty, teachers, or request lists of courses and teachers.")
    print("Type 'quit' to exit the program.")

    while True:
        question = input("\nEnter your question: ")
        if question.lower() == 'quit':
            print("Thank you for using the Course Analyzer. Goodbye!")
            break
        
        try:
            answer = analyzer.answer_question(question)
            print("\nAnswer:")
            print(answer)
        except Exception as e:
            print(f"An error occurred while processing your question: {str(e)}")

if __name__ == "__main__":
    main()
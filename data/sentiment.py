import json
import os
from textblob import TextBlob
from statistics import mean
from transformers import pipeline
import numpy as np
from collections import defaultdict
import re
import logging
import warnings
warnings.filterwarnings('ignore')

class ReviewAnalyzer:
    def __init__(self):
        print("Initializing models...")
        try:
            self.summarizer = pipeline("summarization", model="facebook/bart-large-cnn")
            self.sentiment_analyzer = pipeline("sentiment-analysis", 
                                            model="nlptown/bert-base-multilingual-uncased-sentiment")
        except Exception as e:
            print(f"Error initializing models: {str(e)}")
            raise
        
    def extract_review_text(self, review):
        """Extract the actual review text from the review string."""
        try:
            # Extract text between quotes, after the term indicator
            match = re.search(r'review \d+: \"(.+?)\"$', review)
            if match:
                return match.group(1)
            return review
        except Exception as e:
            print(f"Error extracting review text: {str(e)}")
            return ""

    def count_syllables(self, word):
        """Count syllables in a word."""
        try:
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
        except Exception as e:
            return 1

    def analyze_text(self, text):
        """Analyze individual review text for metrics."""
        try:
            blob = TextBlob(text)
            
            # Sentiment Analysis (-100 to 100)
            sentiment = blob.sentiment.polarity * 100
            
            # Difficulty Analysis (0 to 100)
            difficulty_words = {
                'extremely hard': 5, 'very hard': 4, 'hard': 3,
                'difficult': 3, 'challenging': 2, 'tough': 2,
                'complex': 2, 'intense': 2, 'demanding': 2,
                'heavy workload': 3, 'extremely easy': -5,
                'very easy': -4, 'easy': -3, 'simple': -2,
                'straightforward': -2, 'clear': -1, 'manageable': -1,
                'light': -2, 'basic': -2, 'layup': -4
            }
            
            # Quality Analysis (0 to 100)
            quality_words = {
                'excellent': 5, 'amazing': 5, 'fantastic': 5,
                'outstanding': 5, 'great': 4, 'very good': 4,
                'good': 3, 'helpful': 2, 'engaging': 2,
                'effective': 2, 'poor': -3, 'bad': -3,
                'terrible': -4, 'worst': -5, 'awful': -4,
                'horrible': -4, 'mediocre': -2, 'boring': -2,
                'useless': -3, 'waste': -4
            }
            
            text_lower = text.lower()
            
            # Calculate scores
            difficulty_score = 50
            for word, weight in difficulty_words.items():
                if word in text_lower:
                    difficulty_score += weight * 10
            difficulty_score = max(0, min(100, difficulty_score))
            
            quality_score = 50
            for word, weight in quality_words.items():
                if word in text_lower:
                    quality_score += weight * 10
            quality_score = max(0, min(100, quality_score))
            
            # Time Relevance (0 to 100)
            term_match = re.search(r'(\d{2})[FWSX]', text)
            time_relevance = 0
            if term_match:
                term_year = int(term_match.group(1))
                actual_year = 2000 + term_year if term_year < 24 else 1900 + term_year
                time_relevance = ((actual_year - 2000) / (2024 - 2000)) * 100
            
            # Review Length and Readability
            words = text.split()
            word_count = len(words)
            length_score = min(100, (word_count / 200) * 100)
            
            sentences = blob.sentences
            if len(sentences) == 0 or word_count == 0:
                readability = 50
            else:
                syllable_count = sum(self.count_syllables(word) for word in words)
                readability = max(0, min(100, 206.835 - 1.015 * (word_count / len(sentences)) - 84.6 * (syllable_count / word_count)))
            
            return {
                'metrics': {
                    'sentiment': round(sentiment, 2),
                    'difficulty': round(difficulty_score, 2),
                    'quality': round(quality_score, 2),
                    'time_relevance': round(time_relevance, 2),
                    'length': round(length_score, 2),
                    'readability': round(readability, 2)
                }
            }
        except Exception as e:
            print(f"Error analyzing text: {str(e)}")
            return {
                'metrics': {
                    'sentiment': 0,
                    'difficulty': 50,
                    'quality': 50,
                    'time_relevance': 0,
                    'length': 0,
                    'readability': 50
                }
            }

    def summarize_reviews(self, reviews):
        """Generate a comprehensive summary and analysis of reviews."""
        try:
            # Extract and clean review texts
            review_texts = [self.extract_review_text(review) for review in reviews if review]
            if not review_texts:
                return self.get_empty_analysis()

            # Combine reviews and handle length
            combined_text = " ".join(review_texts)
            input_length = len(combined_text.split())
            
            # Adjust summary length based on input
            max_length = min(150, max(50, input_length // 2))
            min_length = min(50, max(10, input_length // 4))

            # Generate summary
            if input_length < 30:
                summary = "Reviews too brief for meaningful summary."
            else:
                try:
                    summary = self.summarizer(
                        combined_text, 
                        max_length=max_length,
                        min_length=min_length,
                        do_sample=False,
                        truncation=True
                    )[0]['summary_text']
                except Exception as e:
                    print(f"Summarization error: {str(e)}")
                    summary = "Error generating summary."

            # Analyze reviews
            analyses = [self.analyze_text(text) for text in review_texts]
            
            # Calculate aggregate metrics
            metrics = self.calculate_aggregate_metrics(analyses, len(reviews))
            
            return {
                "summary": summary,
                "difficulty": self.get_rating(metrics['difficulty_score'], 'difficulty'),
                "quality": self.get_rating(metrics['quality_score'], 'quality'),
                "sentiment": self.get_rating(metrics['sentiment_score'], 'sentiment'),
                "metrics": metrics
            }
        except Exception as e:
            print(f"Error in summarize_reviews: {str(e)}")
            return self.get_empty_analysis()

    def get_empty_analysis(self):
        """Return empty analysis structure."""
        return {
            "summary": "No valid reviews available.",
            "difficulty": "Unknown",
            "quality": "Unknown",
            "sentiment": "Unknown",
            "metrics": {
                "difficulty_score": 50,
                "quality_score": 50,
                "sentiment_score": 0,
                "readability_score": 50,
                "review_count": 0,
                "avg_review_length": 0,
                "recency_score": 0
            }
        }

    def calculate_aggregate_metrics(self, analyses, review_count):
        """Calculate aggregate metrics from individual analyses."""
        try:
            def safe_weighted_average(metric):
                weights = [a['metrics']['time_relevance'] + 50 for a in analyses]
                values = [a['metrics'][metric] for a in analyses]
                return sum(w * v for w, v in zip(weights, values)) / sum(weights) if weights else 50

            return {
                "difficulty_score": round(safe_weighted_average('difficulty'), 2),
                "quality_score": round(safe_weighted_average('quality'), 2),
                "sentiment_score": round(safe_weighted_average('sentiment'), 2),
                "readability_score": round(safe_weighted_average('readability'), 2),
                "review_count": review_count,
                "avg_review_length": round(mean([a['metrics']['length'] for a in analyses]), 2) if analyses else 0,
                "recency_score": round(max([a['metrics']['time_relevance'] for a in analyses]), 2) if analyses else 0
            }
        except Exception as e:
            print(f"Error calculating aggregate metrics: {str(e)}")
            return self.get_empty_analysis()['metrics']

    def get_rating(self, score, metric_type):
        """Convert numerical scores to ratings."""
        try:
            ranges = {
                'difficulty': [
                    (0, 20, "Very Easy"),
                    (20, 40, "Easy"),
                    (40, 60, "Moderate"),
                    (60, 80, "Challenging"),
                    (80, 100, "Very Challenging")
                ],
                'quality': [
                    (0, 20, "Poor"),
                    (20, 40, "Below Average"),
                    (40, 60, "Average"),
                    (60, 80, "Good"),
                    (80, 100, "Excellent")
                ],
                'sentiment': [
                    (-100, -60, "Very Negative"),
                    (-60, -20, "Negative"),
                    (-20, 20, "Neutral"),
                    (20, 60, "Positive"),
                    (60, 100, "Very Positive")
                ]
            }

            for low, high, label in ranges[metric_type]:
                if low <= score < high:
                    return label
            return ranges[metric_type][-1][2]
        except Exception as e:
            print(f"Error getting rating: {str(e)}")
            return "Unknown"

    def analyze_teacher_data(self, input_file, output_file):
        """Process the teacher-organized JSON file and add analysis."""
        print(f"Loading data from {input_file}...")
        try:
            with open(input_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
        except Exception as e:
            print(f"Error loading input file: {str(e)}")
            return

        analyzed_data = {}
        total_teachers = len(data)
        
        for i, (teacher_name, teacher_data) in enumerate(data.items(), 1):
            print(f"Processing teacher {i}/{total_teachers}: {teacher_name}")
            try:
                analyzed_teacher = {
                    "departments": defaultdict(dict),
                    "overall_analysis": None
                }
                
                all_teacher_reviews = []
                
                # Process each department and class
                for dept, classes in teacher_data.get("departments", {}).items():
                    for class_code, class_info in classes.items():
                        if class_info.get("reviews"):
                            try:
                                analysis = self.summarize_reviews(class_info["reviews"])
                                analyzed_teacher["departments"][dept][class_code] = {
                                    "reviews": class_info["reviews"],
                                    "terms": class_info.get("terms", []),
                                    "analysis": analysis
                                }
                                all_teacher_reviews.extend(class_info["reviews"])
                            except Exception as e:
                                print(f"Error processing class {class_code}: {str(e)}")
                
                # Generate overall teacher analysis
                if all_teacher_reviews:
                    analyzed_teacher["overall_analysis"] = self.summarize_reviews(all_teacher_reviews)
                
                analyzed_data[teacher_name] = analyzed_teacher
                
            except Exception as e:
                print(f"Error processing teacher {teacher_name}: {str(e)}")
                continue

        print(f"Saving analyzed data to {output_file}...")
        try:
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(analyzed_data, f, indent=2, ensure_ascii=False)
            print("Analysis complete!")
        except Exception as e:
            print(f"Error saving output file: {str(e)}")

def main():
    analyzer = ReviewAnalyzer()
    
    input_file = 'processed_teachers.json'
    output_file = 'analyzed_teachers.json'
    
    try:
        analyzer.analyze_teacher_data(input_file, output_file)
    except Exception as e:
        print(f"Error in main execution: {str(e)}")

if __name__ == "__main__":
    main()

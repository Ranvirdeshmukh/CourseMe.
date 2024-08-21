from flask import Flask, request, jsonify
from flask_cors import CORS
from cachedcourse import CachedCourseAnalysis
import logging
import os
from google.cloud import error_reporting

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Initialize CachedCourseAnalysis
analyzer = CachedCourseAnalysis()

# Initialize Google Cloud Error Reporting
error_client = error_reporting.Client()

def initialize_data():
    try:
        analyzer.load_data()
        logger.info("Data loaded successfully from GCS")
    except Exception as e:
        logger.error(f"Failed to load data from GCS: {str(e)}")
        error_client.report_exception()
        # Implement your fallback mechanism here if needed

initialize_data()

@app.route('/', methods=['GET'])
def home():
    return "AI Chatbot server is running!"

@app.route('/health', methods=['GET'])
def health_check():
    if analyzer.course_data:
        return jsonify({"status": "healthy", "message": "Data loaded and server is running"}), 200
    else:
        return jsonify({"status": "unhealthy", "message": "No course data available"}), 503

@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        question = data.get('question')
        if not question:
            logger.warning("Received request with no question")
            return jsonify({"error": "No question provided"}), 400
        
        logger.info(f"Received question: {question}")
        
        if not analyzer.course_data:
            logger.error("Attempted to answer question with no course data loaded")
            return jsonify({"error": "Course data not available. Please try again later."}), 503
        
        answer = analyzer.answer_question(question)
        logger.info(f"Generated answer: {answer}")
        return jsonify({"answer": answer})
    except Exception as e:
        logger.error(f"An error occurred while processing the question: {str(e)}", exc_info=True)
        error_client.report_exception()
        return jsonify({"error": "An internal server error occurred"}), 500

@app.route('/api/reload', methods=['POST'])
def reload_data():
    try:
        initialize_data()
        return jsonify({"message": "Data reloaded successfully"}), 200
    except Exception as e:
        logger.error(f"Failed to reload data: {str(e)}")
        error_client.report_exception()
        return jsonify({"error": "Failed to reload data"}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    app.run(host='0.0.0.0', port=port)
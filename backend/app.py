from flask import Flask, request, jsonify
from flask_cors import CORS
from ai3 import CourseAnalysisAI

app = Flask(__name__)

# Configure CORS
CORS(app, resources={r"/*": {"origins": "http://localhost:3000", "methods": ["GET", "POST", "OPTIONS"]}})

ai = None

def initialize_ai():
    global ai
    print("Initializing AI...")
    ai = CourseAnalysisAI()
    ai.load_data()
    print("AI initialized and data loaded")

@app.route('/', methods=['GET'])
def home():
    return "AI Chatbot server is running!"

@app.route('/api/chat', methods=['POST', 'OPTIONS'])
def chat():
    if request.method == 'OPTIONS':
        # Respond to preflight request
        return '', 204
    
    global ai
    if ai is None:
        return jsonify({"error": "AI not initialized"}), 500

    data = request.json
    question = data.get('question')
    if not question:
        return jsonify({"error": "No question provided"}), 400
    
    try:
        print(f"Received question: {question}")
        answer = ai.answer_question(question)
        print(f"Generated answer: {answer}")
        return jsonify({"answer": answer})
    except Exception as e:
        print(f"Error processing question: {str(e)}")
        return jsonify({"error": f"An error occurred while processing your question: {str(e)}"}), 500

@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

if __name__ == '__main__':
    initialize_ai()
    print("Starting Flask server...")
    app.run(debug=True)
else:
    initialize_ai()
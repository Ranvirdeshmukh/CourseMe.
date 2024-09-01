import os
from flask import Flask, request, jsonify
import requests
import traceback
from urllib.parse import unquote, quote
from requests.utils import requote_uri
from flask import request, jsonify
from urllib.parse import unquote, quote_plus
from bs4 import BeautifulSoup
from flask_cors import CORS

app = Flask(__name__)

CORS(app, resources={r"/*": {"origins": ["http://localhost:3000", "https://courseme.ai", "https://www.courseme.ai", "https://courseme-62h3.onrender.com"]}})


@app.route('/test-url')
def test_url():
    url = "https://oracle-www.dartmouth.edu/dart/groucho/course_desc.display_course_desc?term=202403&subj=AAAS&numb=053"
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    try:
        response = requests.get(url, headers=headers, timeout=10)
        return jsonify({
            #"status_code": response.status_code,
            #"headers": dict(response.headers),
            "content": response.text[:1000]  # First 1000 characters of content
        })
    except requests.RequestException as e:
        return jsonify({"error": str(e)})

@app.route('/')
def hello():
    return "Hello, World!"

@app.route('/test-connection')
def test_connection():
    try:
        response = requests.get('https://www.google.com')
        return f"Connection successful, status code: {response.status_code}"
    except requests.RequestException as e:
        return f"Connection failed: {str(e)}"
        


BASE_URL = "https://oracle-www.dartmouth.edu/dart/groucho/course_desc.display_course_desc"

@app.route('/fetch-text', methods=['GET'])
def fetch_text():
    subj = request.args.get('subj')
    numb = request.args.get('numb')
    term = request.args.get('term', '202403')  # Default to 202403 if not provided

    if not subj or not numb:
        return jsonify({"error": "Both 'subj' and 'numb' parameters are required"}), 400

    url = f"{BASE_URL}?term={term}&subj={subj}&numb={numb}"
    
    print(f"Requesting URL: {url}")  # For debugging

    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }

    try:
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()  # Raise an exception for bad status codes
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Find the table containing the course description
        table = soup.find('table', attrs={'bgcolor': 'white', 'width': '100%'})
        if table:
            # Find all td elements in the table
            td_elements = table.find_all('td')
            if len(td_elements) > 1:
                # Get the second td in the table, which contains the description
                description_td = td_elements[1]
                # Extract text and remove any leading/trailing whitespace
                description = description_td.get_text(strip=True)
                
                return jsonify({
                    "status_code": response.status_code,
                    "content": description,
                    "url": url
                })
            else:
                return jsonify({
                    "error": "Unexpected table structure",
                    "url": url,
                    "table_content": str(table)
                }), 404
        else:
            return jsonify({
                "error": "Could not find course description table in the page content",
                "url": url,
                "page_content": response.text[:1000]  # First 1000 characters of the response for debugging
            }), 404

    except IndexError as e:
        return jsonify({
            "error": f"IndexError: {str(e)}",
            "url": url,
            "trace": traceback.format_exc()
        }), 500
    except requests.RequestException as e:
        return jsonify({
            "error": f"RequestException: {str(e)}",
            "type": type(e).__name__,
            "url": url
        }), 500
    except Exception as e:
        return jsonify({
            "error": f"Unexpected error: {str(e)}",
            "type": type(e).__name__,
            "url": url,
            "trace": traceback.format_exc()
        }), 500

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    app.run(host='0.0.0.0', port=port, debug=True)
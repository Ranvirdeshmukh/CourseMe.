import requests

url = "https://oracle-www.dartmouth.edu/dart/groucho/course_desc.display_course_desc?term=202403&subj=AAAS&numb=053"
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
}

response = requests.get(url, headers=headers)
print(response.status_code)
print(response.text[:500])  # Print first 500 characters of the response
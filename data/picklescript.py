import json
import pickle

def pickle_json_file(json_file_path, pickle_file_path):
    # Read the JSON file
    with open(json_file_path, 'r') as json_file:
        data = json.load(json_file)
    
    # Pickle the data
    with open(pickle_file_path, 'wb') as pickle_file:
        pickle.dump(data, pickle_file)

    print(f"JSON file '{json_file_path}' has been pickled to '{pickle_file_path}'")

# Example usage
json_file_path = 'courses.json'
pickle_file_path = 'output.pickle'

pickle_json_file(json_file_path, pickle_file_path)
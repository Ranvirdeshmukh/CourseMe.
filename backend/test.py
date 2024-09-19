import pickle

def load_and_process_data(pickle_file):
    with open(pickle_file, 'rb') as f:
        data = pickle.load(f)
    
    all_classes = []
    for department, classes in data.items():
        if department != "Template":
            all_classes.extend(classes)
    
    return all_classes

def search_classes(query, all_classes):
    query = query.lower()
    results = []
    
    for class_info in all_classes:
        if query in class_info['class name'].lower():
            results.append(class_info)
    
    return results

def main():
    # Load and process the data from the pickled file
    all_classes = load_and_process_data('output.pickle')
    
    while True:
        search_query = input("Enter a search term for class names (or 'quit' to exit): ")
        if search_query.lower() == 'quit':
            break
        
        search_results = search_classes(search_query, all_classes)
        
        if search_results:
            print(f"\nFound {len(search_results)} matching classes:")
            for result in search_results:
                print(f"- {result['class name']}")
                print(f"  Distribs: {result['distribs']}")
                print(f"  Number of reviews: {result['num of reviews']}")
                print(f"  Quality: {result['quality']}")
                print(f"  Layup: {result['layup']}")
                print()
        else:
            print("No matching classes found.")
        print()

if __name__ == "__main__":
    main()
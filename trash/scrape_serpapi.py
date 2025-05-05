import json
from serpapi import GoogleSearch

# SerpApi API key
API_KEY = "your_serpapi_api_key"

# Load states and cities from cities.json
with open("cities.json", "r") as file:
    states_cities = json.load(file)

# Function to extract criteria from description or title
def extract_criteria(description):
    criteria = {
        "mat": "mat" in description.lower(),
        "reformer": "reformer" in description.lower(),
        "private": "private" in description.lower(),
        "group": "group" in description.lower(),
        "barre": "barre" in description.lower(),
        "online": "online" in description.lower(),
        "freeTrial": "free trial" in description.lower()
    }
    return criteria

# Function to scrape data for a city
def scrape_city_data(city, state):
    query = f"Pilates studios in {city}, {state}"
    search = GoogleSearch({
        "q": query,
        "location": f"{city}, {state}",
        "api_key": API_KEY
    })
    results = search.get_dict()
    local_results = results.get("local_results", [])
    
    studios = []
    for result in local_results:
        studio = {
            "name": result.get("title"),
            "city": city,
            "state": state,
            "rating": result.get("rating"),
            "website": result.get("link"),
            "criteria": extract_criteria(result.get("snippet", ""))
        }
        studios.append(studio)
    return studios

# Main function to scrape data for all states and cities
def scrape_pilates_studios():
    data = []
    for state, cities in states_cities.items():
        state_data = {"state": state, "studios": []}
        for city in cities:
            city_studios = scrape_city_data(city, state)
            state_data["studios"].extend(city_studios)
        state_data["totalStudios"] = len(state_data["studios"])
        state_data["citiesCount"] = len(cities)
        data.append(state_data)
    
    # Save data to JSON file
    with open("pilates_studios_serpapi.json", "w") as json_file:
        json.dump(data, json_file, indent=4)

# Run the script
if __name__ == "__main__":
    scrape_pilates_studios()

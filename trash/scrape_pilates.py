import requests
from bs4 import BeautifulSoup
import json
import time
import random

# Load cities from a JSON file
def load_cities(file_path="cities.json"):
    with open(file_path, "r") as file:
        return json.load(file)

# Fetch free proxies from a public proxy list
def fetch_proxies():
    url = "https://free-proxy-list.net/"
    response = requests.get(url)
    soup = BeautifulSoup(response.text, "html.parser")
    proxies = []
    for row in soup.select("table#proxylisttable tbody tr"):
        columns = row.find_all("td")
        if columns[6].text == "yes":  # Only HTTPS proxies
            proxies.append(f"{columns[0].text}:{columns[1].text}")
    
    if not proxies:
        print("No proxies found. Please check the proxy source or try again later.")
        exit(1)  # Exit the script if no proxies are found

    print(f"Fetched proxies: {proxies}")
    return proxies

# Rotate proxies for each request
def get_random_proxy(proxies):
    return {"http": f"http://{random.choice(proxies)}", "https": f"http://{random.choice(proxies)}"}

# Scrape Google search results for Pilates studios
def scrape_google(city, state, proxies):
    if not proxies:
        print("No proxies available. Skipping scraping for this city.")
        return []

    query = f"Pilates studios in {city}, {state}"
    url = f"https://www.google.com/search?q={query.replace(' ', '+')}"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }

    proxy = get_random_proxy(proxies)  # Get a random proxy
    try:
        response = requests.get(url, headers=headers, proxies=proxy, timeout=10)
        if response.status_code != 200:
            print(f"Failed to fetch results for {city}, {state} with proxy {proxy}")
            return []
    except requests.exceptions.RequestException as e:
        print(f"Request failed for {city}, {state} with proxy {proxy}: {e}")
        return []

    soup = BeautifulSoup(response.text, "html.parser")
    results = []

    # Extract search result titles and snippets
    for result in soup.select(".tF2Cxc"):
        title = result.select_one(".DKV0Md").text if result.select_one(".DKV0Md") else "Unknown Studio"
        snippet = result.select_one(".VwiC3b").text if result.select_one(".VwiC3b") else ""
        website = result.select_one("a")["href"] if result.select_one("a") else None

        # Extract criteria from the snippet
        criteria = {
            "mat": "mat" in snippet.lower(),
            "reformer": "reformer" in snippet.lower(),
            "private": "private" in snippet.lower(),
            "group": "group" in snippet.lower(),
            "barre": "barre" in snippet.lower(),
            "online": "online" in snippet.lower(),
            "freeTrial": "free trial" in snippet.lower()
        }

        results.append({
            "name": title,
            "city": city,
            "state": state,
            "rating": None,
            "website": website,
            "criteria": criteria
        })

    return results

# Main function to scrape Pilates studios for all states and cities
def scrape_pilates_studios():
    all_data = []
    proxies = fetch_proxies()  # Fetch proxies

    states_and_cities = load_cities()  # Load cities from JSON file

    for state, cities in states_and_cities.items():
        print(f"Scraping Pilates studios in {state}...")
        state_data = {"state": state, "studios": [], "totalStudios": 0, "citiesCount": 0}

        for city in cities:
            print(f"  Scraping {city}, {state}...")
            studios = scrape_google(city, state, proxies)
            state_data["studios"].extend(studios)
            time.sleep(2)  # Add delay to avoid being blocked

        state_data["totalStudios"] = len(state_data["studios"])
        state_data["citiesCount"] = len(cities)
        all_data.append(state_data)

    # Save the data to a JSON file
    with open("pilates_studios.json", "w") as json_file:
        json.dump(all_data, json_file, indent=2)

    print("Scraping complete. Data saved to pilates_studios.json")

# Run the scraper
if __name__ == "__main__":
    scrape_pilates_studios()
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
    return proxies

# Rotate proxies for each request
def get_random_proxy(proxies):
    return {"http": f"http://{random.choice(proxies)}", "https": f"http://{random.choice(proxies)}"}

# Scrape Google search results for Pilates studios
def scrape_pilates_studios(cities, proxies):
    base_url = "https://www.google.com/search?q="
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
    pilates_data = {}

    for state, city_list in cities.items():
        pilates_data[state] = {"studios": [], "totalStudios": 0, "citiesCount": len(city_list)}

        for city in city_list:
            query = f"Pilates studios in {city}, {state}"
            url = base_url + requests.utils.quote(query)

            success = False
            while not success:
                proxy = get_random_proxy(proxies)
                try:
                    response = requests.get(url, headers=headers, proxies=proxy, timeout=10)
                    if response.status_code == 429 or response.status_code == 403:  # Blocked or CAPTCHA
                        print(f"Blocked or CAPTCHA detected. Switching proxy...")
                        time.sleep(600)  # Wait 10 minutes before retrying
                        continue

                    soup = BeautifulSoup(response.text, "html.parser")
                    results = soup.select(".tF2Cxc")  # Google search result container

                    for result in results:
                        name = result.select_one("h3").text if result.select_one("h3") else None
                        website = result.select_one("a")["href"] if result.select_one("a") else None
                        description = result.select_one(".VwiC3b").text if result.select_one(".VwiC3b") else ""

                        # Extract criteria from the description
                        criteria = {
                            "mat": "mat" in description.lower(),
                            "reformer": "reformer" in description.lower(),
                            "private": "private" in description.lower(),
                            "group": "group" in description.lower(),
                            "barre": "barre" in description.lower(),
                            "online": "online" in description.lower(),
                            "freeTrial": "free trial" in description.lower(),
                        }

                        # Add studio data
                        pilates_data[state]["studios"].append({
                            "name": name,
                            "city": city,
                            "state": state,
                            "rating": None,  # Google search results don't always include ratings
                            "website": website,
                            "criteria": criteria,
                        })

                    pilates_data[state]["totalStudios"] += len(results)
                    success = True
                except Exception as e:
                    print(f"Error with proxy {proxy}: {e}. Switching proxy...")
                    continue

            print(f"Scraped studios for {city}, {state}.")
            time.sleep(10)  # Delay between requests

    return pilates_data

# Save data to a JSON file
def save_data(data, file_path="pilates_studios.json"):
    with open(file_path, "w") as file:
        json.dump(data, file, indent=4)

# Main function
def main():
    cities = load_cities()
    proxies = fetch_proxies()
    pilates_data = scrape_pilates_studios(cities, proxies)
    save_data(pilates_data)
    print("Scraping complete. Data saved to pilates_studios.json.")

if __name__ == "__main__":
    main()
    
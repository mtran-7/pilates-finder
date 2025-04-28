import json
import time
import requests
import pandas as pd
from bs4 import BeautifulSoup  # Add this for website scraping
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
from concurrent.futures import ThreadPoolExecutor

# Google Places API key
API_KEY = 'AIzaSyAQDmCEpeHw4L9RThWaKkpGuoZHq4jjwkg'

# Updated Criteria Keywords
CRITERIA_KEYWORDS = {
    "reformer": ["reformer", "reformer pilates", "reformer class"],
    "mat": ["mat", "mat pilates", "yoga mat"],
    "barre": ["barre", "barre class", "barre workout"],
    "online": ["online", "virtual", "live stream"],
    "private": ["private", "one-on-one", "personal training"],
    "group": ["group", "group class", "group training", "class"],
    "tower": ["tower", "tower pilates", "cadillac"],
    "freeTrial": ["free trial", "free class", "complimentary session"]
}

# Function to infer criteria from name, website, or description
def infer_criteria(name, website_content, description=None, reviews=None):
    """Infer criteria based on name, website content, description, and reviews."""
    criteria = {key: False for key in CRITERIA_KEYWORDS}
    text = (name + " " + (website_content or "") + " " + (description or "")).lower()
    if reviews:
        text += " " + " ".join(reviews).lower()
    
    print(f"Combined Text for Matching: {text}")  # Debugging log
    
    for key, keywords in CRITERIA_KEYWORDS.items():
        for keyword in keywords:
            if keyword in text:
                print(f"Matched keyword '{keyword}' for criterion '{key}'")  # Debugging log
                criteria[key] = True
    return criteria

# Function to fetch Pilates studios for a city using multiple queries and combine results
def fetch_studios(city, state):
    """Fetch Pilates studios for a city using multiple queries and combine results."""
    queries = [
        f"Pilates in {city}, {state}",
        f"reformer pilates in {city}, {state}",
    ]
    all_results = []
    unique_place_ids = set()  # Track unique place IDs

    for query in queries:
        url = f"https://maps.googleapis.com/maps/api/place/textsearch/json"
        params = {
            "key": API_KEY,
            "query": query
        }
        while True:
            response = requests.get(url, params=params)
            response.raise_for_status()
            results = response.json().get("results", [])

            for result in results:
                place_id = result.get("place_id")
                types = result.get("types", [])
                name = result.get("name", "").lower()
                if place_id not in unique_place_ids and ("pilates_studio" in types or "pilates" in name):
                    unique_place_ids.add(place_id)
                    all_results.append(result)

            next_page_token = response.json().get("next_page_token")
            if not next_page_token:
                break
            time.sleep(2)
            params["pagetoken"] = next_page_token

    return all_results

# Function to fetch additional details for a studio
def fetch_studio_details(place_id):
    url = f"https://maps.googleapis.com/maps/api/place/details/json"
    params = {
        "key": API_KEY,
        "place_id": place_id,
        "fields": "name,formatted_phone_number,opening_hours,reviews,photos,website,rating,types,user_ratings_total"
    }
    response = requests.get(url, params=params)
    response.raise_for_status()
    return response.json().get("result", {})

# Function to get a photo URL from the Google Places API
def get_photo_url(photo_reference):
    return f"https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference={photo_reference}&key={API_KEY}"

# Global cache for website content
website_content_cache = {}

def fetch_website_content(url):
    """Fetch the content of a website using requests and BeautifulSoup, with a fallback to Selenium."""
    if url in website_content_cache:
        return website_content_cache[url]  # Return cached content if available

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }

    try:
        # Primary method: Use requests and BeautifulSoup
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "html.parser")
        content = " ".join([tag.get_text(strip=True) for tag in soup.find_all(["p", "h1", "h2", "h3", "div", "span", "meta"])])
        if "pilates" in content.lower():
            website_content_cache[url] = content  # Cache the content
            return content
    except Exception as e:
        print(f"Failed to fetch website content with requests for {url}: {e}")

    # Fallback to Selenium
    try:
        chrome_options = Options()
        chrome_options.add_argument("--headless")
        chrome_options.add_argument("--disable-gpu")
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument(f"user-agent={headers['User-Agent']}")

        driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=chrome_options)
        driver.get(url)
        driver.implicitly_wait(5)
        elements = driver.find_elements(By.XPATH, "//p | //h1 | //h2 | //h3 | //div | //span | //meta")
        content = " ".join([element.text for element in elements if element.text.strip()])
        driver.quit()

        website_content_cache[url] = content  # Cache the content
        return content
    except Exception as e:
        print(f"Failed to fetch website content with Selenium for {url}: {e}")
        return ""

# Main function to scrape Pilates studios in New York City, NY
def scrape_pilates_nyc():
    city = "New York City"
    state = "NY"
    print(f"Fetching studios in {city}, {state}...")
    studios = fetch_studios(city, state)
    if not studios:
        print(f"No studios found in {city}, {state}")
        return

    data = []
    processed_place_ids = set()  # Track processed place IDs

    def process_studio(studio):
        place_id = studio.get("place_id")
        if place_id in processed_place_ids:
            return None  # Skip duplicate place IDs

        processed_place_ids.add(place_id)
        details = fetch_studio_details(place_id)

        name = details.get("name")
        rating = details.get("rating")
        phone = details.get("formatted_phone_number")
        opening_hours = details.get("opening_hours", {}).get("weekday_text", [])
        reviews = [review.get("text", "") for review in details.get("reviews", [])]
        num_reviews = details.get("user_ratings_total", 0)
        website = details.get("website", "")
        description = " ".join(details.get("types", []))

        website_content = fetch_website_content(website) if website else ""
        concatenated_text = f"{name} {description} {website_content}".lower()

        if "pilates" not in concatenated_text and "pilates_studio" not in details.get("types", []):
            print(f"Skipping {name} (place_id: {place_id})")
            return None

        criteria = infer_criteria(name, website_content, description, reviews)
        print(f"Including {name} (place_id: {place_id})")

        return {
            "Name": name,
            "Rating": rating,
            "Number of Reviews": num_reviews,
            "Phone": phone,
            "Opening Hours": "\n".join(opening_hours),
            "Website": website,
            "Photo URL": get_photo_url(details.get("photos", [{}])[0].get("photo_reference")) if details.get("photos") else None,
            "Reformer": criteria["reformer"],
            "Mat": criteria["mat"],
            "Barre": criteria["barre"],
            "Online": criteria["online"],
            "Private": criteria["private"],
            "Group": criteria["group"],
            "Tower": criteria["tower"],
            "Free Trial": criteria["freeTrial"],
        }

    with ThreadPoolExecutor(max_workers=10) as executor:
        results = list(executor.map(process_studio, studios))

    data = [result for result in results if result]
    df = pd.DataFrame(data)
    df.to_excel("pilates_nyc.xlsx", index=False)
    print("Data saved to pilates_nyc.xlsx")

if __name__ == "__main__":
    scrape_pilates_nyc()
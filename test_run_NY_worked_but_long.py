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
        f"lagree in {city}, {state}",
        f"fitness studio in {city}, {state}"
    ]
    all_results = []
    unique_names = set()  # Track unique place names

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
                name = result.get("name")
                if name not in unique_names:
                    unique_names.add(name)
                    all_results.append(result)

            # Check if there's a next_page_token
            next_page_token = response.json().get("next_page_token")
            if not next_page_token:
                break

            # Wait for a short time before making the next request (required by Google API)
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

def fetch_website_content(url):
    """Fetch the content of a website using Selenium with a headless Chrome browser."""
    try:
        # Set up headless Chrome options
        chrome_options = Options()
        chrome_options.add_argument("--headless")  # Run Chrome in headless mode
        chrome_options.add_argument("--disable-gpu")  # Disable GPU acceleration
        chrome_options.add_argument("--no-sandbox")  # Bypass OS security model
        chrome_options.add_argument("--disable-dev-shm-usage")  # Overcome limited resource problems
        chrome_options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36")
        # Initialize the WebDriver
        driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=chrome_options)
        driver.get(url)
        # Wait for the page to load (increase wait time to 5 seconds)
        driver.implicitly_wait(5)
        # Extract text from <p>, <h1>, <h2>, <h3>, <div>, <span>, and <meta> tags
        elements = driver.find_elements(By.XPATH, "//p | //h1 | //h2 | //h3 | //div | //span | //meta")
        content = " ".join([element.text for element in elements if element.text.strip()])
        # Log the fetched content for debugging
        print(f"Fetched content for {url}: {content[:500]}...")  # Log first 500 characters
        # Close the browser
        driver.quit()
        return content
    except Exception as e:
        print(f"Failed to fetch website content for {url}: {e}")
        return ""

# Main function to scrape Pilates studios in New York City, NY
def scrape_pilates_nyc():
    city = "New York City"
    state = "NY"
    print(f"Fetching studios in {city}, {state}...")
    studios = fetch_studios(city, state)
    print(f"Raw API Results: {studios}")
    if not studios:
        print(f"No studios found in {city}, {state}")
        return

    data = []
    processed_names = set()  # Keep track of processed studio names

    for studio in studios:
        place_id = studio.get("place_id")
        details = fetch_studio_details(place_id)

        name = details.get("name")
        if name in processed_names:
            print(f"Skipping duplicate studio: {name}")
            continue  # Skip if the name has already been processed

        processed_names.add(name)  # Add the name to the set of processed names

        rating = details.get("rating")
        phone = details.get("formatted_phone_number")
        opening_hours = details.get("opening_hours", {}).get("weekday_text", [])
        reviews = [review.get("text", "") for review in details.get("reviews", [])]
        num_reviews = details.get("user_ratings_total", 0)  # Get the total number of reviews
        website = details.get("website", "")
        description = " ".join(details.get("types", []))  # Use the "types" field as a description

        # Always fetch website content
        website_content = fetch_website_content(website) if website else ""
        concatenated_text = f"{name} {description} {website_content}".lower()

        # Log the types field and concatenated string for filtering
        print(f"Types for {name}: {details.get('types', [])}")
        print(f"Filtering String for {name}: {concatenated_text}")

        # Include studios if "pilates" is in the concatenated text or "pilates_studio" is in the types
        if "pilates" not in concatenated_text and "pilates_studio" not in details.get("types", []):
            print(f"Skipping {name} as it does not match relevant keywords or types")
            continue

        # Infer criteria
        criteria = infer_criteria(name, website_content, description, reviews)

        # Log matched criteria for debugging
        print(f"Studio: {name}")
        print(f"Website: {website}")
        print(f"Matched Criteria: {criteria}")
        print(f"Number of Reviews: {num_reviews}")

        data.append({
            "Name": name,
            "Rating": rating,
            "Number of Reviews": num_reviews,  # Add the number of reviews to the output
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
        })
        time.sleep(1)  # Delay to avoid rate limits

    # Export data to Excel
    df = pd.DataFrame(data)
    df.to_excel("pilates_nyc.xlsx", index=False)
    print("Data saved to pilates_nyc.xlsx")

if __name__ == "__main__":
    scrape_pilates_nyc()
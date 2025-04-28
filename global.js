// ==========================
// GLOBAL VARIABLES & FUNCTIONS
// ==========================
let allStudiosData = null; // Global variable to store the data

// Function to load data from pilates_studios.json
async function loadStudiosData() {
    try {
        const response = await fetch("pilates_studios.json");
        if (!response.ok) throw new Error("Failed to load data");
        const flatData = await response.json();

        // Group studios by state
        const groupedData = flatData.reduce((acc, studio) => {
            const state = studio.State;
            if (!acc[state]) {
                acc[state] = { state, studios: [] };
            }
            acc[state].studios.push({
                name: studio.Name,
                city: studio.City,
                address: studio.Address,
                rating: studio.Rating,
                number_of_reviews: studio["Number of Reviews"],
                phone: studio.Phone,
                opening_hours: studio["Opening Hours"].split("\n"), // Convert string to array
                website: studio.Website,
                photo_url: studio["Photo URL"],
                criteria: {
                    Reformer: studio.Reformer,
                    Mat: studio.Mat,
                    Barre: studio.Barre,
                    Online: studio.Online,
                    Private: studio.Private,
                    Group: studio.Group,
                    Tower: studio.Tower,
                    Free_Trial: studio["Free Trial"]
                }
            });
            return acc;
        }, {});

        // Convert grouped data to an array
        allStudiosData = Object.values(groupedData);
        console.log("Data loaded and grouped successfully:", allStudiosData);
    } catch (error) {
        console.error("Error loading pilates_studios.json:", error);
        document.body.innerHTML = "<p>Unable to load studio data. Please try again later.</p>";
    }
}

// Helper function to map criteria to emojis
function getEmojiForCriteria(criteria) {
    const emojiMap = {
        Reformer: "🏋️‍♀️",
        Mat: "🟦",
        Private: "🔒",
        Group: "👥",
        Online: "🌐",
        Free_Trial: "🎟️"
    };
    return emojiMap[criteria] || "✔️"; // Default icon if not found
}

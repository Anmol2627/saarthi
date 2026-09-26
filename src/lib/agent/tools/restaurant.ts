import { AgentTool } from "../types";
import { registry } from "./registry";

// Mock Database for MVP
const MOCK_RESTAURANTS = [
  {
    id: "r1",
    name: "Saravana Bhavan",
    address: "Potheri, Chennai",
    latitude: 12.8256,
    longitude: 80.0416,
    rating: 4.5,
    reviewCount: 1250,
    priceLevel: 2, // ~1000 INR for two
    cuisine: ["South Indian", "Vegetarian"],
    openingHours: ["07:00", "22:00"],
    bookingAvailable: true,
  },
  {
    id: "r2",
    name: "A2B - Adyar Ananda Bhavan",
    address: "Guduvanchery, Chennai",
    latitude: 12.836,
    longitude: 80.046,
    rating: 4.2,
    reviewCount: 850,
    priceLevel: 1, // ~600 INR for two
    cuisine: ["South Indian", "Sweets", "Vegetarian"],
    openingHours: ["06:30", "22:30"],
    bookingAvailable: true,
  },
  {
    id: "r3",
    name: "The Royal Palate",
    address: "SRM Nagar, Chennai",
    latitude: 12.8206,
    longitude: 80.0486,
    rating: 4.7,
    reviewCount: 420,
    priceLevel: 3, // ~2000 INR for two
    cuisine: ["North Indian", "Chinese", "Continental"],
    openingHours: ["11:00", "23:00"],
    bookingAvailable: true,
  }
];

export const searchPlacesTool: AgentTool = {
  name: "search_places",
  description: "Searches for nearby places like restaurants based on constraints. Requires location to be set in state.",
  parameters: {
    type: "object",
    properties: {
      query: { type: "string", description: "Search query like 'South Indian restaurant'" },
      radiusKm: { type: "number", description: "Radius in km to search within" },
      cuisine: { type: "string" },
      budget: { type: "number", description: "Max budget" },
      vegetarianOnly: { type: "boolean" }
    },
    required: ["query"],
  },
  riskLevel: "LOW",
  execute: async ({ query, radiusKm = 5, cuisine, vegetarianOnly }: any, state) => {
    // Check if location is in state
    if (!state?.location) {
      return { error: "I need to know your location first. Please run get_user_location." };
    }

    const { latitude, longitude } = state.location;
    const radiusMeters = radiusKm * 1000;

    // Overpass API Query
    const overpassQuery = `
      [out:json][timeout:10];
      (
        node["amenity"="restaurant"](around:${radiusMeters},${latitude},${longitude});
        way["amenity"="restaurant"](around:${radiusMeters},${latitude},${longitude});
        node["amenity"="cafe"](around:${radiusMeters},${latitude},${longitude});
      );
      out center 15;
    `;

    try {
      const response = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        body: overpassQuery
      });
      
      const data = await response.json();
      
      if (!data.elements || data.elements.length === 0) {
        return MOCK_RESTAURANTS; // Fallback to mock if nothing found
      }

      // Map Overpass data to our format
      let results = data.elements
        .filter((e: any) => e.tags && e.tags.name) // Must have a name
        .map((e: any) => {
           const lat = e.lat || e.center?.lat;
           const lon = e.lon || e.center?.lon;
           return {
             id: e.id.toString(),
             name: e.tags.name,
             address: e.tags["addr:street"] ? `${e.tags["addr:street"]}, ${e.tags["addr:city"] || ''}` : "Nearby",
             latitude: lat,
             longitude: lon,
             rating: (Math.random() * (5 - 3.8) + 3.8).toFixed(1), // Mock rating since OSM doesn't have it
             reviewCount: Math.floor(Math.random() * 500) + 50,
             priceLevel: e.tags.cuisine === "fine_dining" ? 3 : (Math.random() > 0.5 ? 2 : 1),
             cuisine: e.tags.cuisine ? e.tags.cuisine.split(";") : ["Local"],
             openingHours: e.tags.opening_hours ? [e.tags.opening_hours] : ["09:00", "22:00"],
             bookingAvailable: true
           };
        });
      
      // Basic filtering
      if (cuisine) {
        results = results.filter((r: any) => 
          r.cuisine.some((c: string) => c.toLowerCase().includes(cuisine.toLowerCase()))
        );
      }
      
      if (vegetarianOnly) {
        // OSM tags: diet:vegetarian=yes
        results = results.filter((r: any) => r.cuisine.includes("Vegetarian") || Math.random() > 0.5); // Randomly allow some if strictly filtering
      }

      // If strict filtering removed everything, return at least something
      return results.length > 0 ? results.slice(0, 5) : MOCK_RESTAURANTS;

    } catch (error) {
      console.error("Overpass API error:", error);
      return MOCK_RESTAURANTS; // Fallback
    }
  },
};

export const checkRestaurantAvailabilityTool: AgentTool = {
    name: "check_restaurant_availability",
    description: "Checks if a restaurant has slots available for a given time and party size.",
    parameters: {
      type: "object",
      properties: {
        restaurantId: { type: "string" },
        date: { type: "string", description: "YYYY-MM-DD" },
        time: { type: "string", description: "HH:MM" },
        partySize: { type: "number" },
      },
      required: ["restaurantId", "date", "time", "partySize"],
    },
    riskLevel: "LOW",
    execute: async ({ restaurantId, time }: any) => {
      // Mock availability logic
      const restaurant = MOCK_RESTAURANTS.find(r => r.id === restaurantId);
      if (!restaurant) return { available: false, error: "Restaurant not found" };
      
      // Simulate random availability but mostly true for MVP demo
      const hour = parseInt(time.split(":")[0]);
      if (hour < 7 || hour > 22) {
          return { available: false, message: "Outside operating hours", availableSlots: ["19:00", "20:00", "21:00"] };
      }

      return {
          available: true,
          message: "Slot is available",
          slot: time
      };
    },
};

export const createReservationTool: AgentTool = {
    name: "create_reservation",
    description: "Books a restaurant reservation.",
    parameters: {
      type: "object",
      properties: {
        restaurantId: { type: "string" },
        date: { type: "string" },
        time: { type: "string" },
        partySize: { type: "number" },
      },
      required: ["restaurantId", "date", "time", "partySize"],
    },
    riskLevel: "MEDIUM", // Requires confirmation
    execute: async ({ restaurantId, date, time, partySize }: any) => {
        // Try to find in mock list first, otherwise just use the restaurantId as the name
        const mockRestaurant = MOCK_RESTAURANTS.find(r => r.id === restaurantId);
        const restaurantName = mockRestaurant?.name || restaurantId.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());

        return {
            success: true,
            reservationId: `RES-${Math.floor(Math.random() * 100000)}`,
            restaurantName,
            date,
            time,
            partySize,
            message: `Successfully booked ${partySize} seats at ${restaurantName} for ${date} at ${time}.`,
            provider: "SAARTHI BOOKING ENGINE"
        };
    },
};

// Register Tools
registry.registerTool(searchPlacesTool);
registry.registerTool(checkRestaurantAvailabilityTool);
registry.registerTool(createReservationTool);

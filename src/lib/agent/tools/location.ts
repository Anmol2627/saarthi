import { AgentTool } from "../types";
import { registry } from "./registry";

export const getUserLocationTool: AgentTool = {
  name: "get_user_location",
  description: "Gets the user's current location to help find nearby places.",
  parameters: {
    type: "object",
    properties: {},
  },
  riskLevel: "LOW",
  execute: async () => {
    // Simulated location for MVP (SRM / Tech Park area example)
    return {
      latitude: 12.8236,
      longitude: 80.0436,
      address: "SRM Tech Park, Chennai",
    };
  },
};

export const calculateDistanceTool: AgentTool = {
  name: "calculate_distance",
  description: "Calculates the distance between two points in km.",
  parameters: {
    type: "object",
    properties: {
      lat1: { type: "number" },
      lon1: { type: "number" },
      lat2: { type: "number" },
      lon2: { type: "number" },
    },
    required: ["lat1", "lon1", "lat2", "lon2"],
  },
  riskLevel: "LOW",
  execute: async ({ lat1, lon1, lat2, lon2 }: any) => {
    // Basic Haversine implementation for distance
    const R = 6371; // km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return { distanceKm: parseFloat((R * c).toFixed(1)) };
  },
};

export const getDirectionsTool: AgentTool = {
  name: "get_directions",
  description: "Gets a map link for directions to a specific address.",
  parameters: {
    type: "object",
    properties: {
      destination: { type: "string" },
    },
    required: ["destination"],
  },
  riskLevel: "LOW",
  execute: async ({ destination }: any) => {
    return {
      url: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
        destination
      )}`,
    };
  },
};

// Register Tools
registry.registerTool(getUserLocationTool);
registry.registerTool(calculateDistanceTool);
registry.registerTool(getDirectionsTool);

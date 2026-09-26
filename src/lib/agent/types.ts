export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface TaskState {
  intent?: string;
  location?: Location;
  date?: string;
  time?: string;
  partySize?: number;
  budget?: number;
  cuisine?: string[];
  preferences?: string[];
  selectedOption?: string;

  status:
    | "collecting_requirements"
    | "searching"
    | "awaiting_selection"
    | "awaiting_confirmation"
    | "executing"
    | "completed"
    | "failed";
}

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

export interface AgentTool {
  name: string;
  description: string;
  parameters: any; // JSON schema for the parameters
  riskLevel: RiskLevel;
  execute: (args: any, state?: TaskState) => Promise<any>;
}

export interface AgentResponse {
  message: string;
  state: TaskState;
  toolsUsed: Array<{ name: string; args: any; result: any }>;
  requiresConfirmation?: boolean;
}

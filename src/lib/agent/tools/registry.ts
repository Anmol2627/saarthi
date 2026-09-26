import { AgentTool, RiskLevel, TaskState } from "../types";

export class ToolRegistry {
  private tools: Map<string, AgentTool> = new Map();

  registerTool(tool: AgentTool) {
    this.tools.set(tool.name, tool);
  }

  getTool(name: string): AgentTool | undefined {
    return this.tools.get(name);
  }

  // Gets the tools formatted for the Sarvam AI Chat Completions API
  getSarvamTools() {
    return Array.from(this.tools.values()).map((tool) => ({
      type: "function",
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      },
    }));
  }

  async executeTool(
    name: string,
    args: any,
    state?: TaskState,
    userConfirmed: boolean = false
  ): Promise<{ result: any; requiresConfirmation: boolean; error?: string }> {
    const tool = this.tools.get(name);
    
    if (!tool) {
      return { result: null, requiresConfirmation: false, error: `Tool ${name} not found` };
    }

    // Risk Engine check
    if (tool.riskLevel === "HIGH" && !userConfirmed) {
       return { result: null, requiresConfirmation: true };
    }
    
    if (tool.riskLevel === "MEDIUM" && !userConfirmed) {
      return { result: null, requiresConfirmation: true };
    }

    try {
      const result = await tool.execute(args, state);
      return { result, requiresConfirmation: false };
    } catch (err: any) {
      return { result: null, requiresConfirmation: false, error: err.message };
    }
  }
}

export const registry = new ToolRegistry();

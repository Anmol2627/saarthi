// Initialize all tools to register them
import "./tools/location";
import "./tools/restaurant";
import { registry } from "./tools/registry";
import { TaskState } from "./types";
import { SarvamAIClient } from "sarvamai";

const client = new SarvamAIClient({
  apiSubscriptionKey: process.env.SARVAM_API_KEY,
});

const SYSTEM_PROMPT = `
You are SAARTHI, a multilingual, voice-first AI agent that helps users accomplish real-world tasks.
Your primary current skill is restaurant discovery and reservation.
You understand English, Hindi, and Hinglish. Always respond naturally in the language the user uses.

Follow these rules:
1. Understand the user's intent.
2. If the user asks for something, DO NOT invent results. Use your tools to find real data.
3. If you lack critical information to use a tool (like date, time, party size for booking), ASK the user.
4. DO NOT ask too many questions at once. Ask only what is strictly necessary to proceed.
5. If the user selects an option to book/execute, IMMEDIATELY call the relevant tool (e.g. create_reservation). DO NOT ask for final confirmation yourself — the tool execution engine will automatically intercept it and ask the user for secure confirmation.
6. Keep responses concise and conversational.
7. If the user refers to "the first one", use the context of previous results.
`;

export async function processUserMessage(
  message: string,
  state: TaskState,
  history: any[] = []
): Promise<{ reply: string; newState: TaskState; requiresConfirmation: boolean; toolUsed?: any }> {
  
  // Inject current Date and Time
  const now = new Date();
  const currentDate = now.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const currentTime = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  const dynamicPrompt = SYSTEM_PROMPT + `\n\nCURRENT CONTEXT:\n- Date: ${currentDate}\n- Time: ${currentTime}`;

  // Format history for Sarvam AI
  const messages = [
    { role: "system", content: dynamicPrompt },
    ...history,
    { role: "user", content: message }
  ];

  try {
    let currentMessages: any[] = [...messages];
    let currentState = { ...state };
    let finalReply = "";
    let finalToolUsed = undefined;
    let finalRequiresConfirmation = false;
    let forceNoTools = false;
    
    // Check if we are confirming a previously paused tool
    if (currentState.status === "awaiting_confirmation" && message.toLowerCase().includes("yes")) {
       const toolArgs = currentState.selectedOption;
       const toolName = "create_reservation"; // We know it's booking for MVP
       
       const toolResult = await registry.executeTool(toolName, toolArgs, currentState, true);
       currentState = { ...currentState, status: "executing", selectedOption: undefined };
       
       // Force the LLM to summarize the success
       currentMessages.push({ role: "system", content: `Tool execution complete: ${JSON.stringify(toolResult.result)}. Tell the user.` });
       finalToolUsed = { name: toolName, args: toolArgs, result: toolResult.result };
       forceNoTools = true; // Prevent the LLM from trying to call it again!
    }

    // Loop up to 3 times to handle chained tool calls (e.g. get_location -> search_places)
    for (let i = 0; i < 3; i++) {
      const response = await client.chat.completions({
        model: "sarvam-105b-conversations",
        messages: currentMessages as any,
        tools: forceNoTools ? undefined : (registry.getSarvamTools() as any),
        tool_choice: forceNoTools ? undefined : "auto",
      });

      const responseMessage = response.choices[0].message;
      
      // Ensure content is a string (even if empty) to satisfy API schema requirements for tool calls
      if (responseMessage.content === null || responseMessage.content === undefined) {
         responseMessage.content = "";
      }
      
      currentMessages.push(responseMessage);
      
      // Check if the model wants to call a tool
      if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
        const toolCall = responseMessage.tool_calls[0];
        const toolName = toolCall.function.name;
        const toolArgs = JSON.parse(toolCall.function.arguments);

        const toolDef = registry.getTool(toolName);
        if (!toolDef) {
           finalReply = `Sorry, I encountered an internal error. Tool ${toolName} not found.`;
           break;
        }

        // Check if it requires confirmation
        if ((toolDef.riskLevel === "HIGH" || toolDef.riskLevel === "MEDIUM") && !currentState.status.includes("awaiting_confirmation")) {
           finalReply = `I am ready to execute ${toolName}. Should I proceed?`;
           currentState = { ...currentState, status: "awaiting_confirmation", selectedOption: toolArgs };
           finalRequiresConfirmation = true;
           finalToolUsed = { name: toolName, args: toolArgs, status: 'pending_confirmation' };
           break;
        }

        // Execute tool
        const toolResult = await registry.executeTool(toolName, toolArgs, currentState, true);
        
        currentState = { ...currentState, status: "executing" };
        if (toolName === "get_user_location" && toolResult.result && !toolResult.error) {
          currentState.location = toolResult.result;
        }

        currentMessages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            name: toolName,
            content: JSON.stringify(toolResult.result),
        });

        // We record the last tool used so the UI can render its card if applicable
        finalToolUsed = { name: toolName, args: toolArgs, result: toolResult.result };
        
        // Loop again to let the LLM process the tool result
        continue;
      }

      // No tool calls, we have a final text response
      finalReply = responseMessage.content || "";
      
      // Fallback if the LLM gets confused and returns empty text after a tool execution
      if (!finalReply.trim() && finalToolUsed) {
         if (finalToolUsed.name === "check_restaurant_availability") {
            finalReply = "The slot is available! Should I go ahead and confirm the booking for you?";
            currentState = { ...currentState, status: "awaiting_confirmation", selectedOption: finalToolUsed.args };
            finalRequiresConfirmation = true;
            finalToolUsed = { ...finalToolUsed, name: "create_reservation", status: 'pending_confirmation' };
         } else {
            finalReply = `I have completed the action: ${finalToolUsed.name}.`;
         }
      }
      
      break;
    }

    return {
      reply: finalReply,
      newState: currentState,
      requiresConfirmation: finalRequiresConfirmation,
      toolUsed: finalToolUsed
    };

  } catch (error: any) {
    console.error("Sarvam API Error:", error);
    return {
      reply: "Sorry, I am facing some technical difficulties connecting to my brain.",
      newState: state,
      requiresConfirmation: false
    };
  }
}

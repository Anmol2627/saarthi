import { NextResponse } from "next/server";
import { processUserMessage } from "@/lib/agent/saarthi";
import { TaskState } from "@/lib/agent/types";

export async function POST(request: Request) {
  try {
    const { message, state, history } = await request.json();

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const currentState: TaskState = state || { status: "collecting_requirements" };
    const chatHistory = history || [];

    const result = await processUserMessage(message, currentState, chatHistory);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Chat API Error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}

// gpt.ts
import OpenAI from "openai";
import { ChatCompletionMessageParam } from "openai/resources";
import readline from "readline";

const openai = new OpenAI({
  apiKey: process.env.API_KEY,
});
const GPT_MODEL = "gpt-4o-mini-2024-07-18";

// Global counter to track how many times capturePlace is called
let capturePlacenotCalled = 0;

export async function callGPT(
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
  toolSchema: OpenAI.Chat.Completions.ChatCompletionTool[],
  functions: { [key: string]: (input: any) => {} }
) {
  // Get the GPT model's response
  const completions = await openai.chat.completions.create({
    model: GPT_MODEL,
    messages,
    tools: toolSchema,
  });

  const message = completions.choices[0].message;
  console.log("GPT response:", message.content);
  messages.push(message);

  // Process any tool calls in the response (updating capturePlaceCount as needed)
  const toolsPresent = await handleToolCalls(message, messages, functions);

  // If the capturePlace tool hasn't been called more than 2 times,
  // add a system prompt instructing the model to ask the user for their place.
  if (capturePlacenotCalled >= 1) {
    messages.push({
      role: "system",
      content:
        "Return the logged result and ask the user to name a valid place",
    });
  }

  // If no tool calls were processed, get user input to continue the conversation.
  if (!toolsPresent) {
    const userInput = await getUserInput("User: ");
    messages.push({ role: "user", content: userInput });
  }

  // Continue the conversation recursively.
  await callGPT(messages, toolSchema, functions);
  return message;
}

async function handleToolCalls(
  message: any,
  messages: ChatCompletionMessageParam[],
  functions: { [key: string]: (input: any) => {} }
) {
  if (message && message.tool_calls && message.tool_calls.length > 0) {
    let placeFlag = 1;
    console.log("message.tool_calls: ", message.tool_calls);
    for (const toolCall of message.tool_calls) {
      // If the model called capturePlace, increment the counter.
      if (toolCall.function.name === "capturePlace") {
        placeFlag = 0;
      }

      const functionArgs = JSON.parse(toolCall.function.arguments);
      console.log(
        `Function arguments for ${toolCall.function.name}:`,
        functionArgs
      );
      let result: any = null;
      const functionMessages: ChatCompletionMessageParam[] = [];
      result = functions[toolCall.function.name]({
        functionMessages,
        ...functionArgs,
      });
      const toolMessage: ChatCompletionMessageParam = {
        role: "tool",
        tool_call_id: toolCall.id,
        content: JSON.stringify({ result }),
      };
      messages.push(toolMessage);
      messages.push(...functionMessages);
      console.log("Tool message:", toolMessage);
    }
    if (placeFlag) {
      capturePlacenotCalled++;
    }
    return true;
  } else {
    console.log("No tool calls in the message.");
    return false;
  }
}

async function getUserInput(prompt: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

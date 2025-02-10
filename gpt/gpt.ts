import OpenAI from "openai";
import { ChatCompletionMessageParam } from "openai/resources";
import readline from "readline";

const openai = new OpenAI({
  apiKey: process.env.API_KEY,
});
const GPT_MODEL = "gpt-4o-mini-2024-07-18";

export async function callGPT(
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
  toolSchema: OpenAI.Chat.Completions.ChatCompletionTool[],
  functions: {
    [key: string]: (input: any) => {};
  }
) {
  const completions = await openai.chat.completions.create({
    model: GPT_MODEL,
    messages,
    tools: toolSchema,
  });

  const message = completions.choices[0].message;
  console.log("GPT response: " + message.content);
  messages.push(message);
  const toolsPresent = await handleToolCalls(message, messages, functions);
  if (!toolsPresent) {
    const userInput = await getUserInput("User:");
    messages.push({ role: "user", content: userInput });
  }
  await callGPT(messages, toolSchema, functions);
  return message;
}

/**
 * Iterates over all tool calls in the provided message and processes them.
 */
async function handleToolCalls(
  message: any,
  messages: ChatCompletionMessageParam[],
  functions: {
    [key: string]: (input: any) => {};
  }
) {
  if (message && message.tool_calls && message.tool_calls.length > 0) {
    for (const toolCall of message.tool_calls) {
      // Only process recognized function calls.
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

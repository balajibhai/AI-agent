import { OpenAI } from "openai";
import { ChatCompletionMessageParam } from "openai/resources";
require("dotenv").config();
import readline from "readline";

const openai = new OpenAI({
  apiKey: process.env.API_KEY,
});

const GPT_MODEL = "gpt-4o-mini-2024-07-18";

function captureMood(
  messages: ChatCompletionMessageParam[],
  mood: string,
  time: string
) {
  console.log("captureMood -> mood:", mood);
  console.log("captureMood -> time:", time);
  if (time === "unknown" || time === "current") {
    const systemMessage: ChatCompletionMessageParam = {
      role: "system",
      content: "The time is unknown. Please provide a specific time.",
    };
    messages.push(systemMessage);
  }
  return { mood, time };
}

function capturePlace(messages: ChatCompletionMessageParam[], place: string) {
  console.log("capturePlace -> place:", place);
  if (place === "unknown") {
    const systemMessage: ChatCompletionMessageParam = {
      role: "system",
      content: "The place is unknown. Please provide a valid location.",
    };
    messages.push(systemMessage);
  }
  return { place };
}

/**
 * Processes a single tool call:
 * - Parses the function arguments.
 * - Calls the appropriate function (captureMood or capturePlace).
 * - Creates and pushes a tool message with the result.
 */
function processToolCall(
  toolCall: any,
  messages: ChatCompletionMessageParam[]
) {
  const functionArgs = JSON.parse(toolCall.function.arguments);
  console.log(
    `Function arguments for ${toolCall.function.name}:`,
    functionArgs
  );
  let result: any = null;
  const functionMessages: ChatCompletionMessageParam[] = [];
  if (toolCall.function.name === "capturing_mood") {
    result = captureMood(
      functionMessages,
      functionArgs.mood,
      functionArgs.time
    );
    console.log(`Result: ${result.mood} at ${result.time}`);
  } else if (toolCall.function.name === "capturing_place") {
    result = capturePlace(functionMessages, functionArgs.place);
    console.log(`Result: ${result.place}`);
  }
  const toolMessage: ChatCompletionMessageParam = {
    role: "tool",
    tool_call_id: toolCall.id,
    content: JSON.stringify({ result }),
  };
  messages.push(toolMessage);
  messages.push(...functionMessages);
  console.log("Tool message:", toolMessage);
}

/**
 * Iterates over all tool calls in the provided message and processes them.
 */
async function handleToolCalls(
  message: any,
  messages: ChatCompletionMessageParam[]
) {
  if (message && message.tool_calls && message.tool_calls.length > 0) {
    for (const toolCall of message.tool_calls) {
      // Only process recognized function calls.
      if (
        toolCall.function.name === "capturing_mood" ||
        toolCall.function.name === "capturing_place"
      ) {
        processToolCall(toolCall, messages);
      }
    }
    return true;
  } else {
    console.log("No tool calls in the message.");
    return false;
  }
}

async function main() {
  const systemPrompt =
    "You are a friendly bot. Your task is to capture data and call the appropriate functions.\
    Do not make assumptions while calling tools.";
  console.log("systemPrompt:", systemPrompt);

  const userPrompt = "I ate a delicious food at 4:19 happily in the evening!";
  console.log("userPrompt:", userPrompt);

  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];

  const tools: OpenAI.ChatCompletionTool[] = [
    {
      type: "function",
      function: {
        name: "capturing_mood",
        description:
          "Captures the mood of the user and logs the time of the mood.",
        strict: true,
        parameters: {
          type: "object",
          required: ["mood", "time"],
          properties: {
            mood: {
              type: "string",
              description: "The current mood detected.",
            },
            time: {
              type: "string",
              description: "The time associated with the mood.",
            },
          },
          additionalProperties: false,
        },
      },
    },
    {
      type: "function",
      function: {
        name: "capturing_place",
        description: "Captures the location of the user",
        strict: true,
        parameters: {
          type: "object",
          required: ["place"],
          properties: {
            place: {
              type: "string",
              description:
                "The detected place from the input sentence. Must be a valid location name (e.g., 'San Jose').",
            },
          },
          additionalProperties: false,
        },
      },
    },
  ];

  try {
    await callGPT(messages, tools);
  } catch (error) {
    console.error("Error during API call:", error);
  }
}

main();
async function callGPT(
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
  tools: OpenAI.Chat.Completions.ChatCompletionTool[]
) {
  const completions = await openai.chat.completions.create({
    model: GPT_MODEL,
    messages,
    tools,
  });

  const message = completions.choices[0].message;
  console.log("Assistant:" + message.content);
  messages.push(message);
  const toolsPresent = await handleToolCalls(message, messages);
  if (!toolsPresent) {
    const userInput = await getUserInput("User:");
    messages.push({ role: "user", content: userInput });
  }
  await callGPT(messages, tools);
  return message;
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

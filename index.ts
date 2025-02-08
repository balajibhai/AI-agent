import { OpenAI } from "openai";
import { ChatCompletionMessageParam } from "openai/resources";
require("dotenv").config();

// Ensure you have set your OpenAI API key in the environment variable OPENAI_API_KEY
const openai = new OpenAI({
  apiKey: process.env.API_KEY,
});

const GPT_MODEL = "gpt-4o-mini-2024-07-18";

// Define the local arithmetic functions
function captureMood(mood: string, time: string) {
  console.log("mood: ", mood);
  console.log("time: ", time);
  return { mood, time };
}

function capturePlace(place: string) {
  console.log("place: ", place);
  return { place };
}

async function main() {
  // Example user prompt. You can modify this prompt as needed.

  const systemPrompt = `You are a friendly bot, capture the appropriate data \
  and call appropriate functions based on the user input. \
  Don't assume anything by yourself. If there are any unknown data for any function, \
  don't assume anything and don't call that particular function. If there is no place mentioned from the user side then \
  ask the user for their location and then call the appropriate function.`;
  console.log("systemPrompt: ", systemPrompt);
  const userPrompt =
    "I ate a delicious food on the moon at 4:19 in the evening!!!";
  console.log("userPrompt: ", userPrompt);
  // Set up the conversation messages
  const messages: ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: systemPrompt,
    },
    {
      role: "user",
      content: userPrompt,
    },
  ];

  // Define the functions for the API (these definitions will tell the model
  // what functions are available and their parameters)
  const tools: OpenAI.ChatCompletionTool[] = [
    {
      type: "function",
      function: {
        name: "capturing_mood",
        description:
          "Captures the mood of the user and logs time of the mood of the user based on the input sentence",
        strict: true,
        parameters: {
          type: "object",
          required: ["mood", "time"],
          properties: {
            mood: {
              type: "string",
              description:
                "Detect the current mood of the user from the input sentence",
            },
            time: {
              type: "string",
              description: "Time of the mood",
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
        description: `Captures the place of the user based on the input sentence`,
        strict: true,
        parameters: {
          type: "object",
          required: ["place"],
          properties: {
            place: {
              type: "string",
              description:
                "Detected place from the input sentence \
                (even when given in latitude and longitude give the result as a place name. For eg: San Jose)",
            },
          },
          additionalProperties: false,
        },
      },
    },
  ];

  try {
    // Make the first API call with function calling enabled.
    const completions = await openai.chat.completions.create({
      model: GPT_MODEL, // a model that supports function calling
      messages,
      tools: tools,
    });

    const message = completions.choices[0].message;
    console.log(
      "response message with tools to call: ",
      JSON.stringify(message, null, 2)
    );
    messages.push(message);
    if (message && message.tool_calls) {
      for await (const tool_call of message.tool_calls) {
        if (
          tool_call.function.name === "capturing_mood" ||
          tool_call.function.name === "capturing_place"
        ) {
          const functionArgs = JSON.parse(tool_call.function.arguments);
          console.log("functionArgs: ", functionArgs);
          let result = null;
          if (tool_call.function.name === "capturing_mood") {
            result = captureMood(functionArgs.mood, functionArgs.time);
            console.log(`Result: ${result.mood} at ${result.time}`);
          } else if (tool_call.function.name === "capturing_place") {
            result = capturePlace(functionArgs.place);
            console.log(`Result: ${result.place}`);
          }
          const toolMessage: ChatCompletionMessageParam = {
            role: "tool",
            tool_call_id: tool_call.id,
            content: JSON.stringify({ result }),
          };
          messages.push(toolMessage);
          console.log("toolMessage: ", toolMessage);
        }
      }

      console.log("messages sent: ", JSON.stringify(messages, null, 2));

      // Optionally, you can send the result back to the API to continue the conversation.
      const secondResponse = await openai.chat.completions.create({
        model: GPT_MODEL,
        messages,
      });

      console.log(
        "\nResponse after sending function result back to the model:"
      );
      console.log(JSON.stringify(secondResponse, null, 2));
    } else {
      // No function call was triggered—simply output the response.
      console.log("Response:", message);
    }
  } catch (error) {
    console.error("Error during API call:", error);
  }
}

main();

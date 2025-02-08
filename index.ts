import { OpenAI } from "openai";
import { ChatCompletionMessageParam } from "openai/resources";

// Ensure you have set your OpenAI API key in the environment variable OPENAI_API_KEY
const openai = new OpenAI({
  apiKey: "dummy_key",
});

const GPT_MODEL = "gpt-4o-mini-2024-07-18";

// Define the local arithmetic functions
function findMood(mood: string, time: string) {
  console.log("mood: ", mood);
  console.log("time: ", time);
}

async function main() {
  // Example user prompt. You can modify this prompt as needed.

  const systemPrompt =
    "Find the mood as well as log the time of the mood of the user based on the input sentence.";
  console.log("systemPrompt: ", systemPrompt);
  const userPrompt = "I ate a delicious food at 4:19 in the evening!!!";
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
        name: "finding_mood",
        description:
          "Finds the mood and logs time of the mood of the user based on the input sentence",
        strict: true,
        parameters: {
          type: "object",
          required: ["mood", "time"],
          properties: {
            mood: {
              type: "string",
              description: "Detected mood from the input sentence",
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
        if (tool_call.function.name === "finding_mood") {
          const functionArgs = JSON.parse(tool_call.function.arguments);
          console.log("functionArgs: ", functionArgs);
          const result = findMood(functionArgs.mood, functionArgs.time);
          const toolMessage: ChatCompletionMessageParam = {
            role: "tool",
            tool_call_id: tool_call.id,
            content: JSON.stringify({ result }),
          };
          messages.push(toolMessage);
          console.log(`Result: ${result}`);
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

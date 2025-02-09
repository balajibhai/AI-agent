import { OpenAI } from "openai";
import { ChatCompletionMessageParam } from "openai/resources";
require("dotenv").config();

const openai = new OpenAI({
  apiKey: process.env.API_KEY,
});

const GPT_MODEL = "gpt-4o-mini-2024-07-18";

function captureMood(mood: string, time: string) {
  console.log("captureMood -> mood:", mood);
  console.log("captureMood -> time:", time);
  return { mood, time };
}

function capturePlace(place: string) {
  console.log("capturePlace -> place:", place);
  return { place };
}

async function main() {
  const systemPrompt =
    "You are a friendly bot. Capture the appropriate data and call the appropriate functions based on the user input.\
If the user input lacks place information then ask the user for their location, don't take it as unknown and only after you get\
the place then call the appropriate function. Only call the function capturing_place if the user explicitly mentions\
a valid place name. If the place is missing or unclear, do not call the function—instead, ask the user to clarify.";
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
          "Captures the mood of the user and logs the time of the mood based on the input sentence.",
        strict: true,
        parameters: {
          type: "object",
          required: ["mood", "time"],
          properties: {
            mood: {
              type: "string",
              description: "The current mood detected from the input sentence.",
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
        description:
          "Captures the place of the user based on the input sentence. Call this function only if a valid and explicit place is provided.Do not call if the place is 'unknown' or missing, don't make assumptions, instead, ask the user for clarification.",
        strict: true,
        parameters: {
          type: "object",
          required: ["place"],
          properties: {
            place: {
              type: "string",
              description:
                "The detected place from the input sentence. Must be a valid place name (e.g., 'San Jose') and should not be 'unknown' or empty.",
            },
          },
          additionalProperties: false,
        },
      },
    },
  ];

  try {
    const completions = await openai.chat.completions.create({
      model: GPT_MODEL,
      messages,
      tools,
    });

    const message = completions.choices[0].message;
    console.log(
      "Response message (first call):",
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
          console.log("Function arguments:", functionArgs);
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
          console.log("Tool message:", toolMessage);
        }
      }

      const secondResponse = await openai.chat.completions.create({
        model: GPT_MODEL,
        messages,
      });
      console.log(
        "\nResponse after sending function result back:",
        JSON.stringify(secondResponse, null, 2)
      );
    }
    console.log(
      "No tool call triggered. It appears that the place information is missing."
    );

    const userPrompt2 = "I am at Toronto.";
    console.log("userPrompt2 (new input):", userPrompt2);
    messages.push({
      role: "user",
      content: userPrompt2,
    });

    const secondResponse = await openai.chat.completions.create({
      model: GPT_MODEL,
      messages,
      tools,
    });
    const secondMessage = secondResponse.choices[0].message;
    console.log(
      "Response message after providing location:",
      JSON.stringify(secondMessage, null, 2)
    );
    messages.push(secondMessage);

    if (
      secondMessage &&
      secondMessage.tool_calls &&
      secondMessage.tool_calls.length > 0
    ) {
      for await (const tool_call of secondMessage.tool_calls) {
        if (tool_call.function.name === "capturing_place") {
          const functionArgs = JSON.parse(tool_call.function.arguments);
          console.log("Function arguments from second call:", functionArgs);
          const result = capturePlace(functionArgs.place);
          console.log(`Result from second call: ${result.place}`);
          const toolMessage: ChatCompletionMessageParam = {
            role: "tool",
            tool_call_id: tool_call.id,
            content: JSON.stringify({ result }),
          };
          messages.push(toolMessage);
          console.log("Tool message:", toolMessage);
        }
      }
      const thirdResponse = await openai.chat.completions.create({
        model: GPT_MODEL,
        messages,
      });
      console.log(
        "Final response after processing location function:",
        JSON.stringify(thirdResponse, null, 2)
      );
    } else {
      console.log(
        "Even after the new user prompt, no tool call for capturing_place was triggered."
      );
    }
  } catch (error) {
    console.error("Error during API call:", error);
  }
}

main();

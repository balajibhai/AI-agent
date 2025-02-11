require("dotenv").config();
import {
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from "openai/resources";
// import { cook } from "./cook/cook";
import { callGPT } from "./gpt/gpt";

const functions = {
  captureMood: async (captureMood: {
    messages: ChatCompletionMessageParam[];
    mood: string;
    time: string;
  }) => {
    const { messages, mood, time } = captureMood;
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
  },
  capturePlace: (capturePlace: {
    messages: ChatCompletionMessageParam[];
    place: string;
  }) => {
    const { messages, place } = capturePlace;
    console.log("capturePlace -> place:", place);
    if (place === "unknown") {
      const systemMessage: ChatCompletionMessageParam = {
        role: "system",
        content: "The place is unknown. Please provide a valid location.",
      };
      messages.push(systemMessage);
    }
    return { place };
  },
  captureEvent: (captureEvent: { event: string }) => {
    const { event } = captureEvent;
    console.log("captureEvent -> event:", event);
    return { event };
  },
};

const toolSchema: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "captureMood",
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
      name: "capturePlace",
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
  {
    type: "function",
    function: {
      name: "captureEvent",
      description: "Captures the input of the user as 'news'  or 'history'",
      strict: true,
      parameters: {
        type: "object",
        required: ["event"],
        properties: {
          event: {
            type: "string",
            description:
              "The detected event from analysing the user input whether it is a 'news' or 'history'",
            enum: ["news", "history"],
          },
        },
        additionalProperties: false,
      },
    },
  },
];
async function main() {
  const systemPrompt =
    "You are a friendly bot. Your task is to capture data and call the appropriate functions.\
    Do not make assumptions while calling tools. Return the captured data to the user.";
  console.log("systemPrompt:", systemPrompt);

  const userPrompt = "I ate a delicious food at 4:19 happily in the evening!";
  console.log("userPrompt:", userPrompt);

  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];

  try {
    await callGPT(messages, toolSchema, functions);
  } catch (error) {
    console.error("Error during API call:", error);
  }
}

main();
// cook();

import {
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from "openai/resources";
import { callGPT } from "../gpt/gpt";

const functions = {
  addOrUpdateVegatables: ({
    operation,
    itemName,
    quantity,
    functionMessages,
  }: {
    operation: "add" | "update" | "delete";
    itemName: string;
    quantity: number;
    functionMessages: ChatCompletionMessageParam[];
  }): { success: boolean; message: string } => {
    console.log("addOrUpdateVegatables called with:", {
      operation,
      itemName,
      quantity,
      functionMessages,
    });
    // Dummy output
    return {
      success: true,
      message: `Vegetable ${itemName} ${operation} operation processed with quantity ${quantity}.`,
    };
  },

  addCookingCapability: ({
    dishName,
    vegetableNames,
    functionMessages,
  }: {
    dishName: string;
    vegetableNames: string[];
    functionMessages: ChatCompletionMessageParam[];
  }): { success: boolean; message: string } => {
    console.log("addCookingCapability called with:", {
      dishName,
      vegetableNames,
      functionMessages,
    });
    // Dummy output
    return {
      success: true,
      message: `Cooking capability added for dish ${dishName} with vegetables: ${vegetableNames.join(
        ", "
      )}.`,
    };
  },

  updateCookingCapability: ({
    operation,
    dishName,
    vegetableNames,
    functionMessages,
  }: {
    operation: "add" | "delete";
    dishName: string;
    vegetableNames: string[];
    functionMessages: ChatCompletionMessageParam[];
  }): { success: boolean; message: string } => {
    console.log("updateCookingCapability called with:", {
      operation,
      dishName,
      vegetableNames,
      functionMessages,
    });
    // Dummy output
    return {
      success: true,
      message: `Cooking capability for ${dishName} updated with ${operation} operation for vegetables: ${vegetableNames.join(
        ", "
      )}.`,
    };
  },

  deleteCookingCapability: ({
    dishName,
    functionMessages,
  }: {
    dishName: string;
    functionMessages: ChatCompletionMessageParam[];
  }): { success: boolean; message: string } => {
    console.log("deleteCookingCapability called with:", {
      dishName,
      functionMessages,
    });
    // Dummy output
    return {
      success: true,
      message: `Cooking capability for dish ${dishName} has been deleted.`,
    };
  },

  logCookingForTheDay: ({
    dishes,
    functionMessages,
  }: {
    dishes: string[];
    functionMessages: ChatCompletionMessageParam[];
  }): { success: boolean; message: string } => {
    console.log("logCookingForTheDay called with:", {
      dishes,
      functionMessages,
    });
    // Dummy output
    return {
      success: true,
      message: `Cooking log for today: ${dishes.join(", ")}.`,
    };
  },

  whatToCookUniquelyInLast7daysBasedOnTheInventory: ({
    functionMessages,
  }: {
    functionMessages: ChatCompletionMessageParam[];
  }): { success: boolean; dish: string } => {
    console.log(
      "whatToCookUniquelyInLast7daysBasedOnTheInventory called with:",
      {
        functionMessages,
      }
    );
    // Dummy output: returning a dummy dish name
    return {
      success: true,
      dish: "UniqueDummyDish",
    };
  },
};

const toolSchema: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "addOrUpdateVegatables",
      description: "Add, update, or delete a vegetable in the inventory.",
      parameters: {
        type: "object",
        properties: {
          operation: {
            type: "string",
            enum: ["add", "update", "delete"],
            description: "The type of operation to perform.",
          },
          itemName: {
            type: "string",
            description: "The name of the vegetable item.",
          },
          quantity: {
            type: "number",
            description: "The quantity for the given vegetable.",
          },
        },
        required: ["operation", "itemName", "quantity"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "addCookingCapability",
      description:
        "Add cooking capability for a dish by specifying the dish name and the required vegetables.",
      parameters: {
        type: "object",
        properties: {
          dishName: {
            type: "string",
            description: "The name of the dish.",
          },
          vegetableNames: {
            type: "array",
            items: {
              type: "string",
            },
            description: "A list of vegetable names required for the dish.",
          },
        },
        required: ["dishName", "vegetableNames"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "updateCookingCapability",
      description:
        "Update cooking capability for a dish by adding or deleting vegetables.",
      parameters: {
        type: "object",
        properties: {
          operation: {
            type: "string",
            enum: ["add", "delete"],
            description:
              "The operation to perform on the dish's vegetable list.",
          },
          dishName: {
            type: "string",
            description: "The name of the dish.",
          },
          vegetableNames: {
            type: "array",
            items: {
              type: "string",
            },
            description:
              "A list of vegetable names to add or remove from the dish.",
          },
        },
        required: ["operation", "dishName", "vegetableNames"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "deleteCookingCapability",
      description: "Delete the cooking capability of a given dish.",
      parameters: {
        type: "object",
        properties: {
          dishName: {
            type: "string",
            description:
              "The name of the dish to remove from cooking capabilities.",
          },
        },
        required: ["dishName"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "logCookingForTheDay",
      description: "Log the dishes cooked for the day.",
      parameters: {
        type: "object",
        properties: {
          dishes: {
            type: "array",
            items: {
              type: "string",
            },
            description: "A list of dishes cooked today.",
          },
        },
        required: ["dishes"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "whatToCookUniquelyInLast7daysBasedOnTheInventory",
      description:
        "Determine a unique dish to cook in the last 7 days based on current inventory.",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
];
export async function cook() {
  const systemPrompt =
    "You are a friendly bot. Your task is to capture data and call the appropriate functions.\
    Do not make assumptions while calling tools.";
  console.log("systemPrompt:", systemPrompt);

  const userPrompt = "add 5 brinjal";
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

export const testFun = () => {
  console.log("testFun called");
  return "testFun called";
};

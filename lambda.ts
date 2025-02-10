// index.js

import axios from "axios";
import { testFun } from "./cook/cook";

export const handler = async (event: any, context: any) => {
  console.log("Received event:", JSON.stringify(event));
  testFun();
  const method = event.requestContext.http.method;

  if (method === "GET") {
    // Handle WhatsApp's verification challenge
    const params = event.queryStringParameters || {};
    const mode = params["hub.mode"];
    const token = params["hub.verify_token"];
    const challenge = params["hub.challenge"];

    const VERIFY_TOKEN = process.env.VERIFY_TOKEN || "mySecretToken";

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("Webhook verified successfully.");
      return {
        statusCode: 200,
        headers: { "Content-Type": "text/plain" },
        body: challenge,
      };
    } else {
      console.error("Verification token mismatch.");
      return {
        statusCode: 403,
        body: "Verification token mismatch.",
      };
    }
  } else if (method === "POST") {
    // Handle incoming webhook events (e.g., messages)
    let body;
    try {
      body = JSON.parse(event.body);
    } catch (err) {
      console.error("Error parsing request body:", err);
      return {
        statusCode: 400,
        body: "Invalid JSON payload.",
      };
    }

    console.log("Webhook event body:", JSON.stringify(body));

    // WhatsApp webhook events are delivered within the "entry" array.
    // Loop through entries and then through any message changes.
    if (body.entry && Array.isArray(body.entry)) {
      for (const entry of body.entry) {
        if (entry.changes && Array.isArray(entry.changes)) {
          for (const change of entry.changes) {
            if (
              change.value &&
              change.value.messages &&
              Array.isArray(change.value.messages)
            ) {
              for (const message of change.value.messages) {
                // Extract the sender's phone number and the message text.
                const sender = message.from;
                let text = "";
                if (message.text && message.text.body) {
                  text = message.text.body;
                }
                console.log(
                  `Echoing back message "${text}" to sender ${sender}`
                );

                // Send the same text back to the user.
                await sendTextMessage(sender, text);
              }
            }
          }
        }
      }
    }

    // Respond to WhatsApp that the event was received.
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "EVENT_RECEIVED" }),
    };
  } else {
    return {
      statusCode: 405,
      body: "Method Not Allowed",
    };
  }
};

/**
 * sendTextMessage calls the WhatsApp Business API to send a text message.
 * @param {string} recipient - The WhatsApp phone number (in international format) to send the message to.
 * @param {string} text - The text message to send.
 */
async function sendTextMessage(recipient: any, text: any) {
  // Retrieve environment variables
  const phoneNumberId = process.env.PHONE_NUMBER_ID;
  const accessToken = process.env.ACCESS_TOKEN;

  if (!phoneNumberId || !accessToken) {
    console.error(
      "PHONE_NUMBER_ID or ACCESS_TOKEN environment variable not set."
    );
    return;
  }

  // Construct the WhatsApp API URL. (Use your API version as needed.)
  const url = `https://graph.facebook.com/v15.0/${phoneNumberId}/messages`;

  // Create the payload for sending a text message.
  const payload = {
    messaging_product: "whatsapp",
    to: recipient,
    text: {
      body: text,
    },
  };

  try {
    const response = await axios.post(url, payload, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });
    console.log("Message sent successfully:", response.data);
  } catch (error: any) {
    console.error(
      "Error sending message:",
      error.response ? error.response.data : error.message
    );
  }
}

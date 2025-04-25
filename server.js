const express = require("express");
const axios = require("axios");
require("dotenv").config();

const app = express();
app.use(express.json());

const token = process.env.WHATSAPP_TOKEN;
const phoneId = process.env.WHATSAPP_PHONE_ID;

// ============ Send WhatsApp Message API ============
app.post("/send-message", async (req, res) => {
  const { to, message } = req.body;

  try {
    const response = await axios.post(
      `https://graph.facebook.com/v19.0/${phoneId}/messages`,
      {
        messaging_product: "whatsapp",
        to: to,
        type: "text",
        text: {
          body: message,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    res.status(200).json({ status: "Message sent ✅", data: response.data });
  } catch (error) {
    console.error("Send message error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to send message", details: error.response?.data });
  }
});


// ===================Webhook Verification===================
app.get("/webhook", (req, res) => {
  const verify_token = "Admin1#";

  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token) {
    if (mode === "subscribe" && token === verify_token) {
      console.log("✅ Webhook verified!");
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  }
});

// ===================Webhook Message Receiver===================
let latestMessages = [];

app.post("/webhook", (req, res) => {
  const body = req.body;

  if (body.object === "whatsapp_business_account") {
    const entry = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    if (entry) {
      const msg = {
        from: entry.from,
        msg: entry.text?.body || "[non-text message]",
        timestamp: entry.timestamp,
      };

      latestMessages.push(msg);
      console.log("📥 New Message:", msg);
    }

    res.sendStatus(200);
  } else {
    res.sendStatus(404);
  }
});

// =================== API to Get Messages ===================
app.get("/messages", (req, res) => {
  res.json(latestMessages);
});

// ============ Server Start ============
app.listen(5000, () => {
  console.log("🚀 Server running on http://localhost:5000");
});

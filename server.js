// =================== WhatsApp API Server ===================

const express = require("express");
const axios = require("axios");
const cors = require("cors"); 
require("dotenv").config();

const app = express();

// =================== Middlewares ===================
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON bodies

// =================== Constants ===================
const token = process.env.WHATSAPP_TOKEN;
const phoneId = process.env.WHATSAPP_PHONE_ID;
const verify_token = process.env.WHATSAPP_VERIFY_TOKEN || "Admin1#";

// =================== Send WhatsApp Message API ===================
app.post("/send-message", async (req, res) => {  
  const { to, message } = req.body;

  if (!to || !message) {
    return res.status(400).json({ error: "Missing 'to' or 'message' fields" });
  }

  try {
    const url = `https://graph.facebook.com/v19.0/${phoneId}/messages`;

    const payload = {
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: message },
    };

    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    const response = await axios.post(url, payload, { headers });

    res.status(200).json({
      status: "✅ Message sent successfully",
      data: response.data,
    });
  } catch (error) {
    console.error("❌ Error sending message:", error.response?.data || error.message);
    res.status(500).json({
      error: "Failed to send message",
      details: error.response?.data || error.message,
    });
  }
});

// =================== Webhook Verification API ===================
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const tokenFromMeta = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && tokenFromMeta) {
    if (mode === "subscribe" && tokenFromMeta === verify_token) {
      console.log("✅ Webhook verified successfully!");
      return res.status(200).send(challenge);
    } else {
      console.warn("⚠️ Webhook verification failed: wrong token");
      return res.sendStatus(403);
    }
  }

  res.sendStatus(400);
});

// =================== Webhook Message Receiver ===================
let latestMessages = [];

app.post("/webhook", async (req, res) => {
  const body = req.body;

  if (body.object === "whatsapp_business_account") {
    const entry = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    if (entry) {
      const incomingMessage = {
        from: entry.from,
        msg: entry.text?.body || "[non-text message]",
        timestamp: entry.timestamp,
      };

      latestMessages.push(incomingMessage);
      console.log("📥 New incoming message:", incomingMessage);

      // Save to MongoDB
      try {
        await MessageModel.create(incomingMessage);
        console.log("✅ Message saved to DB");
      } catch (err) {
        console.error("❌ Error saving message to DB:", err.message);
      }
    }

    res.sendStatus(200);
  } else {
    res.sendStatus(404);
  }
});


// =================== Get Latest Messages API ===================
app.get("/messages", async (req, res) => {
  try {
    const messages = await MessageModel.find().sort({ createdAt: -1 }); // latest first
    res.status(200).json({
      status: "✅ Messages fetched from DB",
      count: messages.length,
      messages,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch messages from DB" });
  }
});



// =================== Health Check API ===================
app.get("/", (req, res) => {
  res.send("✅ WhatsApp API Server is running!");
});

// =================== Server Start ===================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server started at http://localhost:${PORT}`);
});

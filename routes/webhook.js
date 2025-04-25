const express = require('express');
const Message = require('../models/Message');
const { sendMessageToClients } = require('../socket');

const router = express.Router();

// Verification for WhatsApp webhook (required)
router.get('/', (req, res) => {
  const VERIFY_TOKEN = 'EAATYWE3UaNkBO2zKV9yAuMWrr77QL2MZAsKS2oOCh0LZBXONxUa0BkTGV8AtSQsQsU9hMe6eKo22Y5xtySkROH9PAFKweAYzSZCPUZAdJEgqftlqJ1ob4KPaGmOniKDj1enPOXZAlsCFQ0fdbTmKCscqTGIX496Bp31ru68yhvQJDeCFBh8RvwlBOcQ72c04b516DNHnhF9SKpfqtazQ2fi7cUQAFMZAmu0C5j';

  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token && mode === 'subscribe' && token === VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  } else {
    return res.sendStatus(403);
  }
});

// Actual webhook endpoint
router.post('/', async (req, res) => {
  try {
    const entry = req.body.entry[0];
    const changes = entry.changes[0];
    const msgData = changes.value.messages?.[0];

    if (msgData) {
      const from = msgData.from;
      const message = msgData.text.body;
      const newMsg = await Message.create({
        from,
        message,
        timestamp: new Date()
      });

      sendMessageToClients(newMsg);
    }

    res.sendStatus(200);
  } catch (err) {
    console.error('Webhook Error:', err);
    res.sendStatus(500);
  }
});

module.exports = router;

// routes/smsRoutes.js
const express = require("express");
const router = express.Router();
const { sendSMS } = require("../util/sendSMS");

let latestMessageParts = 0; // Track how many parts were sent in the last SMS

// POST /send - handles sending SMS using the reusable sendSMS.js
router.post("/send", async (req, res) => {
  const { number, message } = req.body;

  if (!number || !message) {
    return res.status(400).send("⚠️ Phone number and message are required.");
  }

  try {
    const result = await sendSMS(number, message);
    latestMessageParts = result.parts || 1;
    res.send("✅ SMS sent.");
  } catch (error) {
    console.error("❌ SMS send error:", error.message);
    res.status(500).send(`❌ SMS send failed: ${error.message}`);
  }
});

// GET /get-message-parts - returns how many message parts were sent
router.get("/get-message-parts", (req, res) => {
  res.json({ totalParts: latestMessageParts });
});

module.exports = router;

// routes/smsRoutes.js
const express = require("express");
const router = express.Router();
const { sendSMS } = require("../util/sendSMS");

/**
 * GET /
 * Renders the landing page (index.ejs)
 */
router.get("/", (req, res) => {
  res.render("index"); // No need to pass status — alert will be handled in browser
});

/**
 * POST /send-sms
 * Handles SMS submission from form (AJAX POST)
 * Returns JSON response with status message for alert()
 */
router.post("/send-sms", async (req, res) => {
  const { number, message } = req.body;

  try {
    const result = await sendSMS(number, message);

    const statusMsg = result.success
      ? result.retried
        ? "✅ Message sent successfully, but some parts required retrying."
        : `✅ Message sent successfully (${result.parts} part${result.parts > 1 ? "s" : ""})`
      : "⚠️ Message could not be sent.";

    // Respond with JSON — not rendering a new view
    res.json({ status: statusMsg });

  } catch (err) {
    res.json({ status: `❌ ${err.message}` });
  }
});

module.exports = router;

// utils/sendSMS.js
const { serialPort, parser } = require("../serial");

let smsStatus = null;           // Stores latest SMS status from Arduino
let isProcessing = false;       // Prevents concurrent SMS sending

// Listen for serial responses and update smsStatus accordingly
parser.on("data", (data) => {
  const trimmedData = data.trim();
  if (["SMS_SENT", "SMS_FAILED"].includes(trimmedData)) {
    smsStatus = trimmedData;
  }
});

/**
 * Waits for either "SMS_SENT" or "SMS_FAILED" from Arduino.
 * Times out after 10 seconds.
 */
function waitForSmsSent() {
  return new Promise((resolve, reject) => {
    let timeout = setTimeout(() => reject(new Error("Timeout waiting for SMS_SENT")), 10000);
    let checkInterval = setInterval(() => {
      if (smsStatus === "SMS_SENT") {
        clearTimeout(timeout);
        clearInterval(checkInterval);
        smsStatus = null;
        resolve();
      } else if (smsStatus === "SMS_FAILED") {
        clearTimeout(timeout);
        clearInterval(checkInterval);
        smsStatus = null;
        reject(new Error("SMS sending failed"));
      }
    }, 500);
  });
}

/**
 * Splits the message into parts, making sure not to break words.
 * Default part length: 150 characters.
 * Example result: ["This is part 1...", "This is part 2..."]
 */
function splitMessage(msg, maxLen = 150) {
  let parts = [];
  let currentPart = "";

  msg.split(" ").forEach(word => {
    if ((currentPart + word).length > maxLen) {
      parts.push(currentPart.trim());
      currentPart = word + " ";
    } else {
      currentPart += word + " ";
    }
  });

  if (currentPart.trim().length > 0) {
    parts.push(currentPart.trim());
  }

  return parts;
}

/**
 * Sends SMS using the serial port, supporting multipart messages.
 * Automatically retries each part up to 3 times if failed.
 * Adds headers like (1/3), (2/3), etc., for multipart messages.
 */
async function sendSMS(number, message) {
  if (isProcessing) throw new Error("SMS is currently being processed");
  isProcessing = true;

  try {
    const messageParts = splitMessage(message);             // Split long message
    const isMultipart = messageParts.length > 1;

    for (let i = 0; i < messageParts.length; i++) {
      // Add "(1/3)", "(2/3)", etc., if multipart
      let fullMessage = isMultipart
        ? `(${i + 1}/${messageParts.length}) ${messageParts[i]}`
        : messageParts[i];

      let command = `SEND_SMS,${number},${fullMessage}\n`;
      console.log(`Sending command: ${command}`);

      let attempts = 0;
      let sent = false;

      // Retry sending this part up to 3 times
      while (attempts < 3 && !sent) {
        serialPort.write(command);
        try {
          await waitForSmsSent();  // Wait for "SMS_SENT"
          sent = true;
        } catch {
          attempts++;
        }
      }

      if (!sent) {
        throw new Error(`Failed to send part ${i + 1}`);
      }

      // Delay between parts
      await new Promise(res => setTimeout(res, 2000));
    }

    return { success: true, parts: messageParts.length };
  } catch (err) {
    throw err;
  } finally {
    isProcessing = false;
  }
}

module.exports = { sendSMS };

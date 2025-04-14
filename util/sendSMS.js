// util/sendSMS.js
const { serialPort, parser } = require("../serial");

let smsStatus = null;           // Tracks the latest SMS status received from Arduino
let isProcessing = false;       // Prevents concurrent SMS processing

// 🔄 Listen to Arduino's response messages (via Serial)
parser.on("data", (data) => {
  const trimmed = data.trim();
  console.log("📥 Arduino says:", trimmed);

  // Track SMS status so we can resolve/reject the promise
  if (["SMS_SENT", "SMS_FAILED"].includes(trimmed)) {
    smsStatus = trimmed;
  }
});

/**
 * ⏳ Waits until the Arduino sends either "SMS_SENT" or "SMS_FAILED".
 * Times out after 10 seconds if no valid response is received.
 */
function waitForSmsSent() {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("⏱ Timeout waiting for SMS_SENT")), 10000);
    const interval = setInterval(() => {
      if (smsStatus === "SMS_SENT") {
        clearTimeout(timeout);
        clearInterval(interval);
        smsStatus = null;
        resolve();
      } else if (smsStatus === "SMS_FAILED") {
        clearTimeout(timeout);
        clearInterval(interval);
        smsStatus = null;
        reject(new Error("❌ SMS_FAILED received from Arduino"));
      }
    }, 500);
  });
}

/**
 * 🧠 Splits a long message into segments no longer than 150 characters each.
 * This prevents breaking messages mid-word and helps with multipart SMS.
 */
function splitMessage(message, maxLen = 150) {
  let parts = [];
  let currentPart = "";

  message.split(" ").forEach(word => {
    if ((currentPart + word).length > maxLen) {
      parts.push(currentPart.trim());
      currentPart = word + " ";
    } else {
      currentPart += word + " ";
    }
  });

  if (currentPart.trim()) {
    parts.push(currentPart.trim());
  }

  return parts;
}

/**
 * 📤 Sends an SMS (or multipart SMS) via the Arduino-GSM module.
 * Automatically retries each part up to 3 times if sending fails.
 * Adds multipart headers (e.g. (1/3), (2/3)) when needed.
 */
async function sendSMS(number, message) {
    if (isProcessing) throw new Error("⚠️ SMS sending already in progress.");
    isProcessing = true;
  
    let retried = false; // Will be true if any part had to retry
  
    try {
      const messageParts = splitMessage(message);
      const isMultipart = messageParts.length > 1;
  
      for (let i = 0; i < messageParts.length; i++) {
        const partHeader = isMultipart ? `(${i + 1}/${messageParts.length}) ` : "";
        const fullMessage = `${partHeader}${messageParts[i]}`;
  
        const command = `SEND_SMS,${number},${fullMessage}\n`;
        console.log("📤 Sending command to Arduino:", command.trim());
  
        let attempts = 0;
        let sent = false;
  
        while (attempts < 3 && !sent) {
          serialPort.write(command, (err) => {
            if (err) console.error("❌ Error writing to serial port:", err.message);
          });
  
          try {
            await waitForSmsSent();
            sent = true;
          } catch (err) {
            console.warn(`⚠️ Part ${i + 1} failed (attempt ${attempts + 1})`);
            attempts++;
            retried = true;
          }
        }
  
        if (!sent) {
          throw new Error("Sending message failed. Check signal or load.");
        }
  
        await new Promise(res => setTimeout(res, 2000)); // Delay between parts
      }
  
      return {
        success: true,
        parts: messageParts.length,
        retried
      };
  
    } catch (err) {
      throw err;
    } finally {
      isProcessing = false;
    }
  }
  

module.exports = { sendSMS };

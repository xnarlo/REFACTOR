// server.js
const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const smsRoutes = require("./routes/smsRoutes"); // Router for SMS handling

const app = express();
const PORT = 3000;

// View engine: EJS for rendering .ejs files in /views
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Parse form data (for URL-encoded forms, if needed)
app.use(bodyParser.urlencoded({ extended: false }));

// Parse JSON body (for AJAX fetch requests)
app.use(express.json());

// Serve static assets (e.g., CSS, images) from /public
app.use(express.static(path.join(__dirname, "public")));

// Register routes
app.use("/", smsRoutes);

// Start the Express server
app.listen(PORT, () => {
  console.log(`🚀 Server is running at http://localhost:${PORT}`);
});

// server.js
const express = require("express");
const path = require("path");
const smsRoutes = require("./routes/smsRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse form data and JSON
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Set EJS as the view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Serve static files (e.g., CSS/JS under /public if needed)
app.use(express.static(path.join(__dirname, "public")));

// Register SMS routes (POST /send, GET /get-message-parts)
app.use("/", smsRoutes);

// Route to render manual SMS form
app.get("/manualsms", (req, res) => {
  res.render("manualsms");
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});

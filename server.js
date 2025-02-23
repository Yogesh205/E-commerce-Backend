require("dotenv").config(); // Load env variables first

const express = require("express");
const cors = require("cors");
const axios = require("axios");
const cookieParser = require("cookie-parser"); // ✅ Added for cookies
const connectDB = require("./config/db");
const paymentRoutes = require("./routes/paymentRoutes");
const authRoutes = require("./routes/authRoutes");

// Connect to MongoDB
connectDB();

const app = express();

// ✅ CORS Configuration (Only Once)
const corsOptions = {
  origin: "https://zesty-caramel-5edb9a.netlify.app", // ✅ Allow only frontend
  credentials: true, // ✅ Allow cookies & authentication headers
};
app.use(cors(corsOptions)); // ✅ CORRECTED: Removed duplicate

// ✅ Middleware (Always before routes)
app.use(express.json()); // Body parser
app.use(cookieParser()); // ✅ Allow reading cookies

// ✅ API Routes
app.use("/api/auth", authRoutes);
app.use("/api/v1/payment", paymentRoutes);

// ✅ Test Route
app.get("/", (req, res) => {
  res.send("✅ API is running...");
});

// ✅ Mistral AI Chatbot Route
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;

if (!MISTRAL_API_KEY) {
  console.error("❌ Error: MISTRAL_API_KEY is missing in .env file");
}

app.post("/api/v1/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message field is required" });
    }

    if (!MISTRAL_API_KEY) {
      return res.status(500).json({ error: "Server configuration issue" });
    }

    const response = await axios.post(
      "https://api.mistral.ai/v1/chat/completions",
      {
        model: "mistral-medium",
        messages: [{ role: "user", content: message }],
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${MISTRAL_API_KEY}`,
        },
      }
    );

    // Ensure response structure is valid
    const botReply =
      response.data?.choices?.[0]?.message?.content || "No response from AI";
    res.json({ reply: botReply });
  } catch (error) {
    console.error(
      "❌ Error in Mistral API call:",
      error.response?.data || error.message
    );
    res.status(500).json({ error: "Something went wrong with Mistral AI API" });
  }
});

// ✅ Start Server
const PORT = process.env.PORT || 4000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

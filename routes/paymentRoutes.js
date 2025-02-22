const express = require("express");
const router = express.Router();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

router.post("/create-checkout-session", async (req, res) => {
  try {
    // Validate request body
    if (
      !req.body.items ||
      !Array.isArray(req.body.items) ||
      req.body.items.length === 0
    ) {
      return res
        .status(400)
        .json({ error: "Invalid request. Items array is required." });
    }

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"], // ✅ UPI removed, only "card" allowed for USD
      line_items: req.body.items.map((item) => ({
        price_data: {
          currency: "usd", // ✅ Make sure the currency is correct
          product_data: { name: item.name || "Unknown Item" },
          unit_amount: item.price ? item.price * 100 : 1000, // ✅ Ensure price is valid
        },
        quantity: item.quantity || 1, // ✅ Default quantity to 1 if missing
      })),
      mode: "payment",
      success_url: "http://localhost:3000/success",
      cancel_url: "http://localhost:3000/cancel",
    });

    console.log("✅ Checkout Session Created:", session.url); // 🔹 Debugging
    res.json({ url: session.url }); // ✅ Send Stripe checkout URL to frontend
  } catch (error) {
    console.error("❌ Error creating checkout session:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

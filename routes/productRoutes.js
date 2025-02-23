const express = require("express");
const router = express.Router();
const Product = require("../models/Product"); // Tumhara product model

// 🔍 Search products API
router.get("/search", async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ message: "Query parameter is required" });
    }

    const products = await Product.find({
      name: { $regex: query, $options: "i" }, // Case-insensitive search
    });

    res.json({ success: true, products });
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = router;

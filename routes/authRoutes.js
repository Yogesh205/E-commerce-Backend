// authRoutes.js - Authentication Routes
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const User = require("../models/User");
const cookieParser = require("cookie-parser");

dotenv.config();
const router = express.Router();
router.use(cookieParser());

// ✅ REGISTER USER
router.post("/register", async (req, res) => {
    try {
        console.log("🔹 Register API Hit", req.body);
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ message: "Email already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ name, email: email.toLowerCase(), password: hashedPassword });
        await newUser.save();
        console.log("✅ User registered successfully:", newUser.email);

        res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
        console.error("❌ Registration Error:", error.message);
        res.status(500).json({ message: "Server Error" });
    }
});

// ✅ LOGIN USER
router.post("/login", async (req, res) => {
    try {
        console.log("🔹 Login API Hit", req.body);
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        // Check if JWT_SECRET is missing
        if (!process.env.JWT_SECRET) {
            console.error("❌ Error: JWT_SECRET is missing in .env file");
            return res.status(500).json({ message: "Internal Server Error" });
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id, name: user.name },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "Strict",
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        console.log("✅ Login successful:", email);
        res.status(200).json({ message: "Login Successful", user: { id: user._id, name: user.name, email: user.email }, token });

    } catch (error) {
        console.error("❌ Login Error:", error.message);
        res.status(500).json({ message: "Server Error" });
    }
});

// ✅ LOGOUT USER
router.post("/logout", (req, res) => {
    res.clearCookie("token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Strict",
    });
    console.log("✅ User logged out");
    res.status(200).json({ message: "Logout successful" });
});

// ✅ GET CURRENT USER (Protected Route)
router.get("/me", async (req, res) => {
    try {
        let token = req.cookies.token || req.headers.authorization?.split(" ")[1];
        if (!token) {
            return res.status(401).json({ message: "Unauthorized - No Token Found" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).select("-password");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({ user });

    } catch (error) {
        console.error("❌ Authentication Error:", error.message);
        return res.status(401).json({ message: "Unauthorized - Invalid or Expired Token" });
    }
});

module.exports = router;

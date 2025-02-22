const express = require("express");
const serverless = require("serverless-http");

const app = express();
app.use(express.json());

app.get("/api/hello", (req, res) => {
    res.json({ message: "Hello from Vercel backend!" });
});

module.exports.handler = serverless(app);

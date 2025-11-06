import express, { json, urlencoded } from "express";
const app = express();
// import { join } from "path";
import connectDB from "./config/db.js";
import expressSession from "express-session";
import dotenv from "dotenv";
// importing routes
import userRoutes from "./routes/user.js";
// import { createClient } from "redis";   // Remove Redis client setup from here. because we are moving it to config/redis.js
import { connectRedis } from "./config/redis.js";

// Remove the entire Redis client setup block and replace with:
await connectRedis();

app.use(express.json());

dotenv.config();

await connectDB();

// models
// const hishaabModel = require("./models/hishaab"); // format

app.set("view engine", "ejs");
// app.set("views", join(__dirname, "views"));
app.use(json());
app.use(urlencoded({ extended: true }));
// app.use(static(join(__dirname, "public")));
app.use(
    expressSession({
        secret: "random stuff",
        resave: false,
        saveUninitialized: false,
    })
);

// using routes
app.use("/api/v1", userRoutes);

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

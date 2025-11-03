import express, { json, urlencoded } from "express";
const app = express();
// import { join } from "path";
import connectDB from "./config/db.js";
import expressSession from "express-session";
import dotenv from "dotenv";

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

// app.get("/", (req, res) => {
//   res.render("home");
// });

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

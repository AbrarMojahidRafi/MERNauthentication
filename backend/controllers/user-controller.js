import TryCatch from "../middlewares/TryCatch.js";
import sanitize from "mongo-sanitize";

export const registerUser = TryCatch(async (req, res) => {
  const { name, email, password } = sanitize(req.body);

  //   res.status(201).json({ message: "User registered successfully" });
  res.status(201).json({ name, email, password });
});

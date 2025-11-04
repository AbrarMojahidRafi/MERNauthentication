import TryCatch from "../middlewares/TryCatch.js";

export const registerUser = TryCatch(async (req, res) => {
  const { name, email, password } = req.body;

  //   res.status(201).json({ message: "User registered successfully" });
  res.status(201).json({ name, email, password });
});

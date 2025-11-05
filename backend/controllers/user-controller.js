import { registerSchema } from "../config/zod.js";
import TryCatch from "../middlewares/TryCatch.js";
import sanitize from "mongo-sanitize";

export const registerUser = TryCatch(async (req, res) => {
  const senitizedBody = sanitize(req.body);
  const validatedData = registerSchema.safeParse(senitizedBody);

  if (!validatedData.success) {
    let zorError = validatedData.error;

    let firstErrorMessage = "validation error";
    let allErrors = [];

    if (zorError.issues && Array.isArray(zorError.issues)) {
      allErrors = zorError.issues.map((issue) => ({
        field: issue.path ? issue.path.join(".") : "unknown",
        message: issue.message || "Invalid value",
        code: issue.code || "invalid_type",
      }));

      firstErrorMessage = allErrors[0].message || firstErrorMessage;
    }

    return res.status(400).json({
      message: firstErrorMessage,
      errors: allErrors,
    });
  }

  const { name, email, password } = validatedData.data;

  //   res.status(201).json({ message: "User registered successfully" });
  res.status(201).json({ name, email, password });
});
 
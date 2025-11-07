import z from "zod";

export const registerSchema = z.object({
    name: z
        .string()
        .min(3, { message: "Name must be at least 3 characters" })
        .max(50, { message: "Name cannot exceed 50 characters" }),
    email: z.string().email({ message: "Invalid email address" }).toLowerCase(),
    password: z
        .string()
        .min(8, { message: "Password must be at least 8 characters" })
        .max(128, { message: "Password cannot exceed 128 characters" }),
    role: z.enum(["user", "admin"]).default("user"),
});

export const loginSchema = z.object({
    email: z.string().email({ message: "Invalid email address" }).toLowerCase(),
    password: z
        .string()
        .min(8, { message: "Password must be at least 8 characters" })
        .max(128, { message: "Password cannot exceed 128 characters" }),
});

import Joi from "joi";
import mongoose from "mongoose";

const userSchema = mongoose.Schema(
    {
        name: {
            type: String,
            trim: true,
            required: [true, "Name is required"],
            minLength: [3, "Name must be at least 3 characters"],
            maxLength: [50, "Name cannot exceed 50 characters"],
            index: true,
        },
        email: {
            type: String,
            trim: true,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            index: true,
        },
        password: {
            type: String,
            required: [true, "Password is required"],
            minLength: [8, "Password must be at least 8 characters"],
            select: false, // Hide password by default when querying
        },
        role: {
            type: String,
            enum: ["user", "admin"],
            default: "user",
        },
    },
    {
        timestamps: true, // This will add createdAt and updatedAt fields
    }
);

function validateUserModel(data) {
    const userValidationSchema = Joi.object({
        name: Joi.string().min(3).max(50).required(),

        email: Joi.string()
            .email({ tlds: { allow: true } })
            .lowercase()
            .required(),

        password: Joi.string().min(8).max(128).required(),

        role: Joi.string().valid("user", "admin").default("user"),
    });

    let { error } = userValidationSchema.validate(data);
    return error;
}

// // JWT Token generation method
// userSchema.methods.generateToken = function() {
//     try {
//         return jwt.sign(
//             {
//                 userId: this._id.toString(),
//                 email: this.email,
//                 role: this.role
//             },
//             process.env.JWT_SECRET_KEY_FOR_GENERATING_TOKEN,
//             { expiresIn: '15d' }
//         );
//     } catch (error) {
//         console.error("Error generating token:", error);
//         throw new Error("Token generation failed");
//     }
// }

const UserModel = mongoose.model("User", userSchema);

export { validateUserModel, UserModel };

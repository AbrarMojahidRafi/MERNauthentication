import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, ArrowLeft } from "lucide-react";
import { toast } from "react-toastify";
import { server } from "../main";
import axios from "axios";

const VerifyOtp = () => {
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [isBtnLoading, setIsBtnLoading] = useState(false);
    const [resendTimer, setResendTimer] = useState(60);
    const [canResend, setCanResend] = useState(false);
    const inputRefs = useRef([]);
    const navigate = useNavigate();

    useEffect(() => {
        // Focus first input on mount
        inputRefs.current[0]?.focus();

        // Timer for resend button
        if (resendTimer > 0) {
            const timer = setTimeout(() => {
                setResendTimer(resendTimer - 1);
            }, 1000);
            return () => clearTimeout(timer);
        } else {
            setCanResend(true);
        }
    }, [resendTimer]);

    const handleChange = (index, value) => {
        // Only allow numbers
        // if (value && !/^\d$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto-focus next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index, e) => {
        // Handle backspace
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData("text").slice(0, 6);

        if (!/^\d+$/.test(pastedData)) return;

        const newOtp = [...otp];
        pastedData.split("").forEach((char, index) => {
            if (index < 6) {
                newOtp[index] = char;
            }
        });
        setOtp(newOtp);

        // Focus last filled input or last input
        const lastIndex = Math.min(pastedData.length, 5);
        inputRefs.current[lastIndex]?.focus();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const otpCode = otp.join("");

        if (otpCode.length !== 6) {
            toast.error("সম্পূর্ণ OTP কোড লিখুন");
            return;
        }

        setIsBtnLoading(true);
        try {
            const email = localStorage.getItem("email");
            const { data } = await axios.post(
                `${server}/api/v1/verify-otp`,
                { email, otp: otpCode },
                {
                    headers: {
                        "Content-Type": "application/json",
                    },
                    withCredentials: true,
                }
            );
            toast.success(data.message);
            localStorage.removeItem("email");
            navigate("/");
        } catch (error) {
            toast.error(
                error.response?.data?.message || "OTP verification failed"
            );
        } finally {
            setIsBtnLoading(false);
        }
    };

    const handleResend = async () => {
        if (!canResend) return;

        try {
            const email = localStorage.getItem("email");
            const { data } = await axios.post(
                `${server}/api/v1/resend-otp`,
                { email },
                {
                    headers: {
                        "Content-Type": "application/json",
                    },
                    withCredentials: true,
                }
            );
            toast.success(data.message || "OTP পুনরায় পাঠানো হয়েছে");
            setResendTimer(60);
            setCanResend(false);
            setOtp(["", "", "", "", "", ""]);
            inputRefs.current[0]?.focus();
        } catch (error) {
            toast.error(
                error.response?.data?.message || "OTP পাঠাতে ব্যর্থ হয়েছে"
            );
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 px-4 py-8">
            <div className="w-full max-w-md">
                {/* Back Button */}
                <button
                    onClick={() => navigate("/login")}
                    className="mb-4 flex items-center text-gray-600 hover:text-gray-800 transition-colors">
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Back to Login
                </button>

                {/* Verification Card */}
                <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
                    {/* Header */}
                    <div className="text-center space-y-2">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-4">
                            <Shield className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-800">
                            Verify OTP
                        </h1>
                        <p className="text-gray-500">
                            আপনার ইমেইলে পাঠানো ৬ সংখ্যার কোড লিখুন
                        </p>
                        <p className="text-sm text-gray-400">
                            {localStorage.getItem("email")}
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* OTP Input Fields */}
                        <div className="flex justify-center gap-2 sm:gap-3">
                            {otp.map((digit, index) => (
                                <input
                                    key={index}
                                    ref={(el) =>
                                        (inputRefs.current[index] = el)
                                    }
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) =>
                                        handleChange(index, e.target.value)
                                    }
                                    onKeyDown={(e) => handleKeyDown(index, e)}
                                    onPaste={handlePaste}
                                    className="w-12 h-12 sm:w-14 sm:h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                    required
                                />
                            ))}
                        </div>

                        {/* Resend Section */}
                        <div className="text-center space-y-2">
                            {canResend ? (
                                <button
                                    type="button"
                                    onClick={handleResend}
                                    className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                                    OTP পাননি? পুনরায় পাঠান
                                </button>
                            ) : (
                                <p className="text-gray-500 text-sm">
                                    Resend OTP in{" "}
                                    <span className="font-semibold text-blue-600">
                                        {resendTimer}s
                                    </span>
                                </p>
                            )}
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-all duration-200 shadow-lg hover:shadow-xl"
                            disabled={isBtnLoading}>
                            {isBtnLoading ? "Verifying..." : "Verify OTP"}
                        </button>
                    </form>

                    {/* Help Text */}
                    <div className="text-center text-sm text-gray-500 pt-4 border-t">
                        <p>কোড পাচ্ছেন না? আপনার spam folder চেক করুন</p>
                    </div>
                </div>

                {/* Footer Text */}
                <p className="text-center text-sm text-gray-500 mt-6">
                    OTP verification দ্বারা আপনার অ্যাকাউন্ট সুরক্ষিত থাকে
                </p>
            </div>
        </div>
    );
};

export default VerifyOtp;

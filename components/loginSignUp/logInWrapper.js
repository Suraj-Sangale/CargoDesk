import React, { useEffect, useState, useRef, useCallback } from "react";
import { Controller, useForm } from "react-hook-form";
import { loginValidation } from "@/utilities/validations/auth";
import { postApiData } from "@/utilities/services/apiService";
import { useRouter } from "next/router";
import { showToast } from "@/utilities/toastService";
import { getSafeRedirectUrl } from "@/utilities/authConfig";
import {
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiArrowLeft,
  FiCheckCircle,
  FiRefreshCw,
} from "react-icons/fi";

export default function LoginWrapper() {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    control,
  } = useForm();

  const router = useRouter();

  const initialFormData = {
    email_id: "",
    password: "",
  };
  const [formData, setFormData] = useState(initialFormData);

  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [section, setSection] = useState("login"); // "login" | "register" | "forgotPassword"
  const [validation, setValidation] = useState({});
  const [successMsg, setSuccessMsg] = useState("");

  // ============================================================
  // Forgot Password Flow States
  // ============================================================
  const [fpStep, setFpStep] = useState("email"); // "email" | "otp" | "newPassword"
  const [fpEmail, setFpEmail] = useState("");
  const [fpOtp, setFpOtp] = useState(["", "", "", ""]);
  const [fpResetToken, setFpResetToken] = useState("");
  const [fpNewPassword, setFpNewPassword] = useState("");
  const [fpConfirmPassword, setFpConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fpLoading, setFpLoading] = useState(false);
  const [fpError, setFpError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  const otpInputRefs = [
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
  ];

  // Resend cooldown timer tick
  useEffect(() => {
    let timer = null;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [resendCooldown]);

  useEffect(() => {
    const temp = {
      email_id: register("email_id", loginValidation.email_id),
      password: register("password", loginValidation.password),
    };

    setValidation(temp);
  }, [register]);

  const updateSelectedForm = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const getDestinationUrl = (user = null) => {
    const role = (user?.role || "").toLowerCase().trim();
    const defaultPath =
      role === "maintenance_supervisor" ? "/maintenance-supervisor" : "/";
    return getSafeRedirectUrl(router.query.redirect, defaultPath);
  };

  // Regular login submit
  const onSubmit = async () => {
    setLoading(true);
    setApiError("");

    try {
      const payload = {
        email_id: formData.email_id.trim(),
        password: formData.password.trim(),
      };
      const response = await postApiData("VERIFY_USER_LOGIN", payload);
      if (response.status) {
        showToast({
          message: response.message || "Login successful",
          type: "success",
        });
        const destination = getDestinationUrl(response.user);
        window.location.href = destination;
      } else {
        showToast({
          message: response.message || "Invalid credentials",
          type: "error",
        });
      }
    } catch (err) {
      showToast({
        message: "Invalid email_id or password",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const tempLogIn = async () => {
    setLoading(true);
    setApiError("");

    try {
      const payload = {
        email_id: "suraj@agnibyte.com",
        password: "Agnibyte@2025",
      };
      const response = await postApiData("VERIFY_USER_LOGIN", payload);
      if (response.status) {
        showToast({
          message: response.message || "Login successful",
          type: "success",
        });
        const destination = getDestinationUrl(response.user);
        window.location.href = destination;
      } else {
        showToast({
          message: response.message || "Invalid credentials",
          type: "error",
        });
      }
    } catch (err) {
      showToast({
        message: "Invalid email_id or password",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // Reset forgot password state when leaving or returning
  const resetForgotPasswordFlow = () => {
    setFpStep("email");
    setFpEmail("");
    setFpOtp(["", "", "", ""]);
    setFpResetToken("");
    setFpNewPassword("");
    setFpConfirmPassword("");
    setFpError("");
    setFpLoading(false);
    setResendCooldown(0);
  };

  const handleStartForgotPassword = () => {
    resetForgotPasswordFlow();
    // Pre-fill with login email if user already typed one
    if (formData.email_id && formData.email_id.includes("@")) {
      setFpEmail(formData.email_id.trim());
    }
    setSection("forgotPassword");
  };

  // Helper to mask email for privacy (e.g. s***e@domain.com)
  const maskEmail = (email) => {
    if (!email || !email.includes("@")) return email;
    const [name, domain] = email.split("@");
    if (name.length <= 2) return `${name[0]}*@${domain}`;
    return `${name[0]}${"*".repeat(Math.min(name.length - 2, 4))}${name[name.length - 1]}@${domain}`;
  };

  // 1. Send OTP
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    setFpError("");

    const cleanEmail = fpEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setFpError("Please enter a valid email address");
      return;
    }

    setFpLoading(true);
    try {
      const response = await postApiData("FORGOT_PASSWORD_SEND_OTP", {
        email: cleanEmail,
      });

      if (response.status) {
        showToast({
          message: response.message || "Verification code sent to your email",
          type: "success",
        });
        setFpStep("otp");
        setResendCooldown(60);
        // Focus first OTP field shortly after transition
        setTimeout(() => {
          if (otpInputRefs[0].current) otpInputRefs[0].current.focus();
        }, 100);
      } else {
        setFpError(response.message || "Failed to send verification code");
        showToast({
          message: response.message || "Failed to send code",
          type: "error",
        });
      }
    } catch (err) {
      setFpError("Failed to connect to server. Please try again.");
    } finally {
      setFpLoading(false);
    }
  };

  // 2. OTP Input Digit change handler
  const handleOtpDigitChange = (val, idx) => {
    const digit = val.replace(/\D/g, "").slice(-1);
    const newOtp = [...fpOtp];
    newOtp[idx] = digit;
    setFpOtp(newOtp);
    setFpError("");

    // Advance to next box if digit entered
    if (digit && idx < 3) {
      otpInputRefs[idx + 1]?.current?.focus();
    }
  };

  const handleOtpKeyDown = (e, idx) => {
    if (e.key === "Backspace") {
      if (!fpOtp[idx] && idx > 0) {
        otpInputRefs[idx - 1]?.current?.focus();
      }
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").trim();
    const digits = pasted.replace(/\D/g, "").slice(0, 4).split("");
    if (digits.length > 0) {
      const newOtp = ["", "", "", ""];
      digits.forEach((d, i) => {
        if (i < 4) newOtp[i] = d;
      });
      setFpOtp(newOtp);
      const nextIdx = Math.min(digits.length, 3);
      otpInputRefs[nextIdx]?.current?.focus();
    }
  };

  // 3. Verify OTP
  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    setFpError("");

    const code = fpOtp.join("");
    if (code.length !== 4) {
      setFpError("Please enter the complete 4-digit verification code");
      return;
    }

    setFpLoading(true);
    try {
      const response = await postApiData("FORGOT_PASSWORD_VERIFY_OTP", {
        email: fpEmail.trim().toLowerCase(),
        otp: code,
      });

      if (response.status && response.resetToken) {
        showToast({
          message: "Code verified successfully",
          type: "success",
        });
        setFpResetToken(response.resetToken);
        setFpStep("newPassword");
      } else {
        setFpError(response.message || "Invalid verification code");
        showToast({
          message: response.message || "Invalid code",
          type: "error",
        });
      }
    } catch (err) {
      setFpError("Error verifying code. Please try again.");
    } finally {
      setFpLoading(false);
    }
  };

  // 4. Save New Password
  const handleResetPassword = async (e) => {
    if (e) e.preventDefault();
    setFpError("");

    if (!fpNewPassword || fpNewPassword.length < 8) {
      setFpError("Password must be at least 8 characters long");
      return;
    }

    if (fpNewPassword !== fpConfirmPassword) {
      setFpError("Passwords do not match");
      return;
    }

    setFpLoading(true);
    try {
      const response = await postApiData("FORGOT_PASSWORD_RESET", {
        email: fpEmail.trim().toLowerCase(),
        resetToken: fpResetToken,
        newPassword: fpNewPassword,
      });

      if (response.status) {
        showToast({
          message: "Password reset successfully! Please log in.",
          type: "success",
        });
        // Pre-fill login email and switch to login
        updateSelectedForm("email_id", fpEmail.trim().toLowerCase());
        setValue("email_id", fpEmail.trim().toLowerCase());
        setValue("password", "");
        resetForgotPasswordFlow();
        setSection("login");
      } else {
        setFpError(response.message || "Failed to reset password");
        showToast({
          message: response.message || "Failed to reset password",
          type: "error",
        });
      }
    } catch (err) {
      setFpError("Error resetting password. Please try again.");
    } finally {
      setFpLoading(false);
    }
  };

  const getSectionTitle = () => {
    if (section === "login") return "Login";
    if (section === "register") return "Register";
    if (section === "forgotPassword") {
      if (fpStep === "email") return "Forgot Password";
      if (fpStep === "otp") return "Verify Code";
      if (fpStep === "newPassword") return "Reset Password";
    }
    return "CargoDesk";
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative px-4">
      <div className="background-image"></div>

      <div className="max-w-sm w-full bg-white/20 backdrop-blur-lg border border-white/30 rounded-xl p-8 text-white shadow-2xl transition-all duration-300">
        <h2 className="text-2xl font-bold mb-6 text-center tracking-tight">
          {getSectionTitle()}
        </h2>

        {/* ============================================================
            SECTION 1: REGULAR LOGIN FORM
            ============================================================ */}
        {section === "login" && (
          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Email */}
            <div className="relative border-b-2 border-white/30">
              <Controller
                control={control}
                name="email_id"
                rules={{ required: "Email is required" }}
                render={({ field }) => (
                  <input
                    {...field}
                    placeholder=""
                    className="w-full bg-transparent outline-none text-white peer h-10"
                    onChange={(e) => {
                      field.onChange(e);
                      updateSelectedForm("email_id", e.target.value);
                    }}
                    autoComplete="email"
                  />
                )}
              />

              <label
                className="absolute left-0 top-2 text-white/70 text-sm transition-all
                         peer-placeholder-shown:top-2.5 
                         peer-placeholder-shown:text-base 
                         peer-placeholder-shown:text-white/50 
                         peer-focus:top-[-20px] 
                         peer-focus:text-sm 
                         peer-focus:text-white 
                         peer-[&:not(:placeholder-shown)]:top-[-20px] 
                         peer-[&:not(:placeholder-shown)]:text-sm 
                         peer-[&:not(:placeholder-shown)]:text-white"
              >
                Email
              </label>
            </div>
            {errors.email_id && (
              <p className="text-red-400 mt-1 text-xs">{errors.email_id.message}</p>
            )}

            {/* Password */}
            <div className="relative border-b-2 border-white/30 mt-9">
              <Controller
                control={control}
                name="password"
                rules={{ required: "Password is required" }}
                render={({ field }) => (
                  <input
                    {...field}
                    type="password"
                    placeholder=""
                    className="w-full bg-transparent outline-none text-white peer h-10"
                    onChange={(e) => {
                      field.onChange(e);
                      updateSelectedForm("password", e.target.value);
                    }}
                    autoComplete="current-password"
                  />
                )}
              />
              <label
                className="absolute left-0 top-2 text-white/70 text-sm transition-all
                      peer-placeholder-shown:top-2.5 
                      peer-placeholder-shown:text-base 
                      peer-placeholder-shown:text-white/50 
                      peer-focus:top-[-20px] 
                      peer-focus:text-sm 
                      peer-focus:text-white 
                      peer-[&:not(:placeholder-shown)]:top-[-20px] 
                      peer-[&:not(:placeholder-shown)]:text-sm 
                      peer-[&:not(:placeholder-shown)]:text-white"
              >
                Password
              </label>
            </div>
            {errors.password && (
              <p className="text-red-400 mt-1 text-xs">{errors.password.message}</p>
            )}

            {/* API Error */}
            {apiError && (
              <p className="text-red-400 text-center mb-3 text-xs">{apiError}</p>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-white text-black font-semibold mt-5 py-2.5 rounded-lg hover:bg-opacity-80 active:scale-[0.98] transition-all cursor-pointer mb-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Log In"}
            </button>

            <button
              type="button"
              onClick={tempLogIn}
              className="w-full bg-white/10 border border-white/30 text-white font-semibold py-2 rounded-lg hover:bg-white/20 active:scale-[0.98] transition-all cursor-pointer mb-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 text-xs"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Temp Log In (Super Admin)"}
            </button>

            {/* Success Message */}
            {successMsg && (
              <p className="text-green-400 text-center mb-3 text-xs">{successMsg}</p>
            )}

            {/* Forgot Password Link */}
            <div className="flex items-center justify-between text-sm text-white/80 hover:text-white mt-3">
              <button
                type="button"
                className="underline hover:text-white cursor-pointer focus-visible:outline-none text-xs"
                onClick={handleStartForgotPassword}
              >
                Forgot password?
              </button>
            </div>

            {/* Register Link */}
            <p className="text-center text-white/80 text-xs mt-6 cursor-default">
              Don&apos;t have an account?{" "}
              <button
                type="button"
                className="underline hover:text-white cursor-pointer focus-visible:outline-none"
                onClick={() => setSection("register")}
              >
                Register
              </button>
            </p>
          </form>
        )}

        {/* ============================================================
            SECTION 2: FORGOT PASSWORD FLOW (3 SUB-STEPS)
            ============================================================ */}
        {section === "forgotPassword" && (
          <div className="space-y-4">
            {/* --------------------------------------------------------
                SUB-STEP 1: ENTER REGISTERED EMAIL
                -------------------------------------------------------- */}
            {fpStep === "email" && (
              <form onSubmit={handleSendOtp} className="space-y-5">
                <p className="text-xs text-white/80 leading-relaxed text-center">
                  Enter your registered email address to receive a 4-digit verification code.
                </p>

                <div className="relative border-b-2 border-white/30 pt-2">
                  <input
                    type="email"
                    value={fpEmail}
                    onChange={(e) => {
                      setFpEmail(e.target.value);
                      setFpError("");
                    }}
                    placeholder=""
                    className="w-full bg-transparent outline-none text-white peer h-10 pr-8"
                    autoFocus
                    required
                    autoComplete="email"
                  />
                  <FiMail className="absolute right-0 top-3 text-white/50 w-4 h-4 pointer-events-none" />
                  <label
                    className="absolute left-0 top-2 text-white/70 text-sm transition-all
                             peer-placeholder-shown:top-2.5 
                             peer-placeholder-shown:text-base 
                             peer-placeholder-shown:text-white/50 
                             peer-focus:top-[-20px] 
                             peer-focus:text-sm 
                             peer-focus:text-white 
                             peer-[&:not(:placeholder-shown)]:top-[-20px] 
                             peer-[&:not(:placeholder-shown)]:text-sm 
                             peer-[&:not(:placeholder-shown)]:text-white"
                  >
                    Registered Email
                  </label>
                </div>

                {fpError && (
                  <p className="text-rose-300 text-xs text-center font-medium bg-rose-500/20 py-1.5 px-2 rounded border border-rose-500/30">
                    {fpError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={fpLoading || !fpEmail.trim()}
                  className="w-full bg-white text-black font-semibold py-2.5 rounded-lg hover:bg-opacity-90 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                >
                  {fpLoading ? "Sending Code..." : "Send Verification Code"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    resetForgotPasswordFlow();
                    setSection("login");
                  }}
                  className="w-full flex items-center justify-center gap-1.5 text-xs text-white/80 hover:text-white transition-colors cursor-pointer pt-1"
                >
                  <FiArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Login</span>
                </button>
              </form>
            )}

            {/* --------------------------------------------------------
                SUB-STEP 2: ENTER 4-DIGIT OTP
                -------------------------------------------------------- */}
            {fpStep === "otp" && (
              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <div className="text-center space-y-1">
                  <p className="text-xs text-white/80">
                    Enter the 4-digit verification code sent to:
                  </p>
                  <p className="text-xs font-mono font-bold text-white bg-white/10 px-2 py-0.5 rounded inline-block">
                    {maskEmail(fpEmail)}
                  </p>
                </div>

                {/* 4 Digit Boxes */}
                <div
                  className="flex items-center justify-center gap-3 pt-2"
                  onPaste={handleOtpPaste}
                >
                  {fpOtp.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={otpInputRefs[idx]}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpDigitChange(e.target.value, idx)}
                      onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                      className="w-12 h-14 text-center text-2xl font-black bg-white/10 border-2 border-white/30 rounded-xl text-white outline-none focus:border-white focus:bg-white/20 transition-all font-mono shadow-inner"
                      autoFocus={idx === 0}
                    />
                  ))}
                </div>

                {fpError && (
                  <p className="text-rose-300 text-xs text-center font-medium bg-rose-500/20 py-1.5 px-2 rounded border border-rose-500/30">
                    {fpError}
                  </p>
                )}

                {/* Resend Cooldown Counter */}
                <div className="flex items-center justify-between text-xs text-white/80 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setFpStep("email");
                      setFpError("");
                    }}
                    className="underline hover:text-white cursor-pointer"
                  >
                    Change Email
                  </button>

                  {resendCooldown > 0 ? (
                    <span className="text-white/60">
                      Resend in {resendCooldown}s
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={fpLoading}
                      className="flex items-center gap-1 text-white font-semibold underline hover:text-white/90 cursor-pointer disabled:opacity-50"
                    >
                      <FiRefreshCw className="w-3 h-3" />
                      <span>Resend Code</span>
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={fpLoading || fpOtp.join("").length !== 4}
                  className="w-full bg-white text-black font-semibold py-2.5 rounded-lg hover:bg-opacity-90 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {fpLoading ? "Verifying..." : "Verify Code"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    resetForgotPasswordFlow();
                    setSection("login");
                  }}
                  className="w-full flex items-center justify-center gap-1.5 text-xs text-white/80 hover:text-white transition-colors cursor-pointer pt-1"
                >
                  <FiArrowLeft className="w-3.5 h-3.5" />
                  <span>Cancel & Back to Login</span>
                </button>
              </form>
            )}

            {/* --------------------------------------------------------
                SUB-STEP 3: SET NEW PASSWORD
                -------------------------------------------------------- */}
            {fpStep === "newPassword" && (
              <form onSubmit={handleResetPassword} className="space-y-5">
                <p className="text-xs text-white/80 text-center leading-relaxed">
                  Your code has been verified. Enter a secure new password for your account.
                </p>

                {/* New Password Field */}
                <div className="relative border-b-2 border-white/30 pt-2">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={fpNewPassword}
                    onChange={(e) => {
                      setFpNewPassword(e.target.value);
                      setFpError("");
                    }}
                    placeholder=""
                    className="w-full bg-transparent outline-none text-white peer h-10 pr-8"
                    autoFocus
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-0 top-3 text-white/70 hover:text-white transition-colors cursor-pointer"
                    tabIndex={-1}
                  >
                    {showNewPassword ? (
                      <FiEyeOff className="w-4 h-4" />
                    ) : (
                      <FiEye className="w-4 h-4" />
                    )}
                  </button>
                  <label
                    className="absolute left-0 top-2 text-white/70 text-sm transition-all
                             peer-placeholder-shown:top-2.5 
                             peer-placeholder-shown:text-base 
                             peer-placeholder-shown:text-white/50 
                             peer-focus:top-[-20px] 
                             peer-focus:text-sm 
                             peer-focus:text-white 
                             peer-[&:not(:placeholder-shown)]:top-[-20px] 
                             peer-[&:not(:placeholder-shown)]:text-sm 
                             peer-[&:not(:placeholder-shown)]:text-white"
                  >
                    New Password (min 8 chars)
                  </label>
                </div>

                {/* Confirm Password Field */}
                <div className="relative border-b-2 border-white/30 pt-2">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={fpConfirmPassword}
                    onChange={(e) => {
                      setFpConfirmPassword(e.target.value);
                      setFpError("");
                    }}
                    placeholder=""
                    className="w-full bg-transparent outline-none text-white peer h-10 pr-8"
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-0 top-3 text-white/70 hover:text-white transition-colors cursor-pointer"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? (
                      <FiEyeOff className="w-4 h-4" />
                    ) : (
                      <FiEye className="w-4 h-4" />
                    )}
                  </button>
                  <label
                    className="absolute left-0 top-2 text-white/70 text-sm transition-all
                             peer-placeholder-shown:top-2.5 
                             peer-placeholder-shown:text-base 
                             peer-placeholder-shown:text-white/50 
                             peer-focus:top-[-20px] 
                             peer-focus:text-sm 
                             peer-focus:text-white 
                             peer-[&:not(:placeholder-shown)]:top-[-20px] 
                             peer-[&:not(:placeholder-shown)]:text-sm 
                             peer-[&:not(:placeholder-shown)]:text-white"
                  >
                    Confirm New Password
                  </label>
                </div>

                {/* Password Matching / Strength Hint */}
                {fpNewPassword && (
                  <div className="text-[11px] space-y-1 pt-0.5">
                    <div
                      className={`flex items-center gap-1.5 ${
                        fpNewPassword.length >= 8
                          ? "text-emerald-300"
                          : "text-amber-300"
                      }`}
                    >
                      <FiCheckCircle className="w-3 h-3 shrink-0" />
                      <span>At least 8 characters ({fpNewPassword.length}/8)</span>
                    </div>

                    {fpConfirmPassword && (
                      <div
                        className={`flex items-center gap-1.5 ${
                          fpNewPassword === fpConfirmPassword
                            ? "text-emerald-300"
                            : "text-rose-300"
                        }`}
                      >
                        <FiCheckCircle className="w-3 h-3 shrink-0" />
                        <span>
                          {fpNewPassword === fpConfirmPassword
                            ? "Passwords match"
                            : "Passwords do not match"}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {fpError && (
                  <p className="text-rose-300 text-xs text-center font-medium bg-rose-500/20 py-1.5 px-2 rounded border border-rose-500/30">
                    {fpError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={
                    fpLoading ||
                    fpNewPassword.length < 8 ||
                    fpNewPassword !== fpConfirmPassword
                  }
                  className="w-full bg-white text-black font-semibold py-2.5 rounded-lg hover:bg-opacity-90 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                >
                  {fpLoading ? "Saving Password..." : "Save New Password"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    resetForgotPasswordFlow();
                    setSection("login");
                  }}
                  className="w-full flex items-center justify-center gap-1.5 text-xs text-white/80 hover:text-white transition-colors cursor-pointer pt-1"
                >
                  <FiArrowLeft className="w-3.5 h-3.5" />
                  <span>Cancel & Back to Login</span>
                </button>
              </form>
            )}
          </div>
        )}

        {/* ============================================================
            SECTION 3: REGISTER PLACEHOLDER
            ============================================================ */}
        {section === "register" && (
          <div>
            <h3 className="text-lg font-semibold mb-4 cursor-default text-center">
              Please contact Administrator to register an account.
            </h3>

            <button
              className="w-full bg-white text-black font-semibold py-2.5 rounded-lg hover:bg-opacity-80 transition cursor-pointer"
              onClick={() => setSection("login")}
            >
              Back to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

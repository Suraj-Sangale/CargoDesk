import React, { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import axios from "axios";
import { loginValidation } from "@/utilities/validations/auth";
import { postApiData } from "@/utilities/services/apiService";
import { useRouter } from "next/router";
import { showToast } from "@/utilities/toastService";

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
  const [section, setSection] = useState("login"); // for future register toggle
  const [validation, setValidation] = useState({});
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    const temp = {
      email_id: register("email_id", loginValidation.email_id),
      password: register("password", loginValidation.password),
    };

    setValidation(temp);
  }, []);

  const updateSelectedForm = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const onSubmit = async () => {
    setLoading(true);
    setApiError("");

    try {
      const payload = {
        email_id: formData.email_id.trim(),
        password: formData.password.trim(),
      };
      const response = await postApiData("VERIFY_USER_LOGIN", payload);
      // handle auth token or redirect
      if (response.status) {
        // setSuccessMsg(response.message);
        showToast({
          message: response.message,
          type: "success",
        });
        router.push("/"); // Redirect to home page after successful login
      } else {
        // setApiError(response.message);
        showToast({
          message: response.message,
          type: "error",
        });
      }
    } catch (err) {
      // setApiError("Invalid email_id or password");
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
      // handle auth token or redirect
      if (response.status) {
        // setSuccessMsg(response.message);
        showToast({
          message: response.message,
          type: "success",
        });
        router.push("/"); // Redirect to home page after successful login
      } else {
        // setApiError(response.message);
        showToast({
          message: response.message,
          type: "error",
        });
      }
    } catch (err) {
      // setApiError("Invalid email_id or password");
      showToast({
        message: "Invalid email_id or password",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const sectionTitle = {
    login: "Login",
    register: "Register",
    forgotPassword: "Forgot Password",
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative px-4">
      <div className="background-image"></div>

      <div className="max-w-sm w-full bg-white/20 backdrop-blur-lg border border-white/30 rounded-xl p-8 text-white">
        <h2 className="text-2xl font-bold mb-6 text-center">
          {Object.hasOwn(sectionTitle, section) ? sectionTitle[section] : ""}
        </h2>

        {section == "login" ? (
          <form
            onSubmit={handleSubmit(onSubmit)}
            className=""
          >
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
              <p className="text-red-400 mt-1">{errors.email_id.message}</p>
            )}

            {/* Password */}
            <div className="relative border-b-2 border-white/30 mt-9 mb-6">
              <Controller
                control={control}
                name="password"
                rules={{ required: "Password is required" }}
                render={({ field }) => (
                  <input
                    {...field}
                    placeholder=""
                    className="w-full bg-transparent outline-none text-white peer h-10"
                    onChange={(e) => {
                      field.onChange(e);
                      updateSelectedForm("password", e.target.value);
                    }}
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
            {/* Password Error */}
            {errors.password && (
              <p className="text-red-500 mt-1">{errors.password.message}</p>
            )}

            {/* API Error */}
            {apiError && (
              <p className="text-red-400 text-center mb-3">{apiError}</p>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-white text-black font-semibold py-2 rounded hover:bg-opacity-80 transition cursor-pointer mb-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Log In"}
            </button>
            <button
              type="button"
              onClick={tempLogIn}
              className="w-full bg-white  text-black font-semibold py-2 rounded hover:bg-opacity-80 transition cursor-pointer mb-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Temp Log In"}
            </button>

            {/* Success Message */}
            {successMsg && (
              <p className="text-green-500 text-center mb-3">{successMsg}</p>
            )}

            {/* Forgot Password Link */}
            <div
              className={`flex items-center justify-between text-sm text-white/80 hover:text-white mt-3`}
            >
              <button
                className="underline focus-visible:no-underline focus-visible:outline-none focus-visible:border-b-2 focus-visible:border-blue-500/50"
                onClick={() => setSection("forgotPassword")}
              >
                Forgot password?
              </button>
            </div>

            {/* Register Link */}
            <p className="text-center text-white/80 text-sm mt-6 cursor-default">
              Don&apos;t have an account?{" "}
              <button
                className="underline hover:text-white cursor-pointer focus-visible:no-underline focus-visible:outline-none focus-visible:border-b-2 focus-visible:border-blue-500/50"
                onClick={() => setSection("register")}
              >
                Register
              </button>
            </p>
          </form>
        ) : section === "forgotPassword" ? (
          <div>
            <h3 className="text-lg font-semibold mb-4 cursor-default">
              Please contact Administrator.
            </h3>

            <button
              className="w-full bg-white text-black font-semibold py-2 rounded hover:bg-opacity-80 transition"
              onClick={() => setSection("login")}
            >
              Back to Login
            </button>
          </div>
        ) : (
          <div>
            <h3 className="text-lg font-semibold mb-4 cursor-default">
              Please contact Administrator.
            </h3>

            <button
              className="w-full bg-white text-black font-semibold py-2 rounded hover:bg-opacity-80 transition"
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

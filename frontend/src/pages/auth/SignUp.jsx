// src/pages/SignUp.jsx
import "./signup.css";
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { FaApple } from "react-icons/fa";
import toast from "react-hot-toast";
import { api, logApiBaseUrl } from "../../api/client.js";
import TextField from "../../components/ui/TextField.jsx";
import Button from "../../components/ui/Button.jsx";

const SignUp = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSocialClick = (provider) => {
    toast("Social sign-up is coming soon.");
    console.log(`Social sign-up: ${provider}`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    logApiBaseUrl();

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const res = await api.post("/auth/register", {
        username: formData.username,
        email: formData.email,
        password: formData.password,
      });

      console.log("Signup OK:", res.data);
      toast.success("Account created. You can now sign in.");
      navigate("/login");
    } catch (err) {
      console.error("Signup error:", err.response?.data || err.message);

      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "There was a problem creating your account.";

      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-page art-page-background">
      <div className="signup-bg-overlay" />

      <div className="signup-card glass-panel gradient-border">
        <header className="signup-header">
          <h1 className="signup-title h-display">
            Create your account
          </h1>
          <p className="signup-subtitle">
            Join ArtCollab and start collaborating on ambitious art
            projects.
          </p>
        </header>

        {/* social signup */}
        <div className="signup-social">
          <button
            type="button"
            className="signup-social-btn signup-social-btn-google"
            onClick={() => handleSocialClick("google")}
          >
            <FcGoogle className="signup-social-icon" />
            <span>Sign up with Google</span>
          </button>
          <button
            type="button"
            className="signup-social-btn signup-social-btn-apple"
            onClick={() => handleSocialClick("apple")}
          >
            <FaApple className="signup-social-icon-apple" />
            <span>Sign up with Apple</span>
          </button>
        </div>

        <div className="signup-divider">
          <span className="line" />
          <span className="label">or create with email</span>
          <span className="line" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <TextField
            id="username"
            label="Username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            placeholder="Pick a unique username"
            autoComplete="username"
          />

          <TextField
            id="email"
            label="Email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="you@example.com"
            autoComplete="email"
          />

          <TextField
            id="password"
            label="Password"
            type={showPassword ? "text" : "password"}
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter a strong password"
            autoComplete="new-password"
            rightElement={
              <button
                type="button"
                className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-100 transition-colors"
                onClick={() => setShowPassword((v) => !v)}
              >
                {showPassword ? (
                  <>
                    <EyeOff className="h-3.5 w-3.5" />
                    <span>Hide</span>
                  </>
                ) : (
                  <>
                    <Eye className="h-3.5 w-3.5" />
                    <span>Show</span>
                  </>
                )}
              </button>
            }
          />

          <TextField
            id="confirmPassword"
            label="Confirm password"
            type={showConfirmPassword ? "text" : "password"}
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Re-enter your password"
            autoComplete="new-password"
            rightElement={
              <button
                type="button"
                className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-100 transition-colors"
                onClick={() =>
                  setShowConfirmPassword((v) => !v)
                }
              >
                {showConfirmPassword ? (
                  <>
                    <EyeOff className="h-3.5 w-3.5" />
                    <span>Hide</span>
                  </>
                ) : (
                  <>
                    <Eye className="h-3.5 w-3.5" />
                    <span>Show</span>
                  </>
                )}
              </button>
            }
          />

          <Button
            type="submit"
            className="w-full mt-2"
            size="lg"
            loading={loading}
          >
            Create account
          </Button>
        </form>

        <p className="signup-footer">
          Already have an account?{" "}
          <Link to="/login" className="signup-footer-link">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignUp;

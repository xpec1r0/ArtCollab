// src/pages/auth/login.jsx
import React, { useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";
import axios from "axios";
import { Eye, EyeOff } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { FaApple } from "react-icons/fa";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext.jsx";
import Button from "../../components/ui/Button.jsx";
import TextField from "../../components/ui/TextField.jsx";
import "./login.css";

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError(null);
    setFieldErrors({});
    setSubmitting(true);

    try {
      await login({ identifier, password });

      const from = location.state?.from?.pathname || "/my-projects";
      navigate(from, { replace: true });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const data = error.response?.data;

        if (Array.isArray(data?.errors)) {
          const fe = {};
          data.errors.forEach((err) => {
            if (
              err.path === "email" ||
              err.path === "username" ||
              err.path === "identifier"
            ) {
              fe.identifier = err.msg;
            }
            if (err.path === "password") {
              fe.password = err.msg;
            }
          });
          setFieldErrors(fe);
        }

        if (data?.message) {
          setFormError(data.message);
        } else if (!data?.errors) {
          setFormError(
            "Unable to sign in. Please check your credentials."
          );
        }
      } else {
        setFormError("Unexpected error. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSocialClick = (provider) => {
    // UI only for now; backend OAuth endpoints can be wired later
    toast("Social sign-in is coming soon.");
    console.log(`Social sign-in: ${provider}`);
  };

  return (
    <div className="login-page art-page-background">
      <div className="login-bg-overlay" />

      <div className="login-card glass-panel gradient-border">
        <div className="login-card-header">
          <div className="login-logo-circle">
            <span className="login-logo-text">AC</span>
          </div>
          <div>
            <h1 className="login-title h-display">
              Welcome back
            </h1>
            <p className="login-subtitle">
              Sign in to ArtCollab and keep building bold, collaborative
              art projects.
            </p>
          </div>
        </div>

        {/* Social auth */}
        <div className="login-social">
          <button
            type="button"
            className="login-social-btn login-social-btn-google"
            onClick={() => handleSocialClick("google")}
          >
            <FcGoogle className="login-social-icon" />
            <span>Continue with Google</span>
          </button>
          <button
            type="button"
            className="login-social-btn login-social-btn-apple"
            onClick={() => handleSocialClick("apple")}
          >
            <FaApple className="login-social-icon-apple" />
            <span>Continue with Apple</span>
          </button>
        </div>

        <div className="login-divider">
          <span className="line" />
          <span className="label">or sign in with email</span>
          <span className="line" />
        </div>

        {formError && (
          <div className="login-alert">
            <span className="login-alert-dot" />
            <p>{formError}</p>
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <TextField
            id="identifier"
            label="Email or username"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="you@example.com or @username"
            autoComplete="username"
            error={fieldErrors.identifier}
          />

          <TextField
            id="password"
            label="Password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            error={fieldErrors.password}
            rightElement={
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-100 transition-colors"
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

          <div className="login-row">
            <span className="text-[11px] text-slate-500">
              Keep your credentials private and secure.
            </span>
            <Link
              to="/forgot-password"
              className="login-link"
            >
              Forgot your password?
            </Link>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={submitting}
            className="w-full mt-2"
          >
            Sign in to ArtCollab
          </Button>
        </form>

        <p className="login-footer-text">
          Don&apos;t have an account yet?{" "}
          <Link to="/signup" className="login-link-strong">
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;

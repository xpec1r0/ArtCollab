// src/pages/auth/resetPassword.jsx
import "./resetPassword.css";
import React, { useState } from "react";
import {
  Link,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "../../api/client.js";
import TextField from "../../components/ui/TextField.jsx";
import Button from "../../components/ui/Button.jsx";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);
  const [loading, setLoading] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();

    if (!token) {
      toast.error("Invalid or missing reset token.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      await api.post("/auth/reset-password", {
        token,
        password: newPassword,
      });

      toast.success("Your password has been reset successfully.");
      navigate("/login");
    } catch (err) {
      console.error(
        "Reset password error:",
        err.response?.data || err
      );
      const msg =
        err.response?.data?.message ||
        "There was a problem resetting your password.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reset-page art-page-background">
      <div className="reset-bg-overlay" />

      <div className="reset-card glass-panel gradient-border">
        <div className="reset-form-section">
          <h1 className="reset-title h-display">
            Reset your password
          </h1>
          <p className="reset-subtitle">
            Choose a new password for your ArtCollab account. Make sure
            it is strong and unique.
          </p>

          <form onSubmit={handleReset} className="space-y-4">
            <TextField
              id="new-password"
              label="New password"
              type={showPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
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
              id="confirm-password"
              label="Confirm password"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
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
              variant="primary"
              size="md"
              loading={loading}
              className="w-full md:w-auto"
            >
              Reset password
            </Button>

            <p className="reset-footer">
              Remembered your password?{" "}
              <Link
                to="/login"
                className="reset-footer-link"
              >
                Back to sign in
              </Link>
            </p>
          </form>
        </div>

        <div className="reset-image-section">
          <img src="/images/reset.jpg" alt="Reset password" />
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;

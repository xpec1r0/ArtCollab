// src/pages/auth/forgotPassword.jsx
import "./forgotPassword.css";
import React, { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { api } from "../../api/client.js";
import TextField from "../../components/ui/TextField.jsx";
import Button from "../../components/ui/Button.jsx";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSubmitting(true);
      await api.post("/auth/forgot-password", { email });

      // Backend should send the email (Mailtrap) here
      toast.success(
        "If this email is registered, a password reset link has been sent."
      );
    } catch (err) {
      console.error(
        "Forgot password error:",
        err.response?.data || err
      );
      const msg =
        err.response?.data?.message ||
        "There was a problem sending the reset email.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="forgot-page art-page-background">
      <div className="forgot-bg-overlay" />

      <div className="forgot-card glass-panel gradient-border">
        <h1 className="forgot-title h-display">
          Forgot your password?
        </h1>
        <p className="forgot-subtitle">
          Enter the email associated with your ArtCollab account and we
          will send you a secure reset link.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <TextField
            id="email"
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
          />

          <Button
            type="submit"
            size="md"
            variant="primary"
            loading={submitting}
            className="w-full"
          >
            Send reset link
          </Button>
        </form>

        <p className="forgot-footer">
          Remembered your password?{" "}
          <Link
            to="/login"
            className="forgot-footer-link"
          >
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;

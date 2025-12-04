// src/router/AppRouter.jsx
import React from "react";
import { Routes, Route } from "react-router-dom";

import Homepage from "../pages/marketing/homepage.jsx";
import About from "../pages/marketing/about.jsx";

import Login from "../pages/auth/login.jsx";
import SignUp from "../pages/auth/SignUp.jsx";
import ForgotPassword from "../pages/auth/forgotPassword.jsx";
import ResetPassword from "../pages/auth/resetPassword.jsx";

import ProjectsPage from "../pages/projects/projects.jsx";
import CreateProjectPage from "../pages/projects/CreateProjectPage.jsx";
import MyProjectsPage from "../pages/projects/MyProjectsPage.jsx";

import CreateMediaPage from "../pages/media/CreateMediaPage.jsx";   // 👈 nueva
import ProtectedRoute from "../components/ProtectedRoute.jsx";

import ProfileSettings from "../pages/profile/ProfileSettings.jsx";

function AppRouter() {
  return (
    <Routes>
      {/* Marketing / public */}
      <Route path="/" element={<Homepage />} />
      <Route path="/homepage" element={<Homepage />} />
      <Route path="/about" element={<About />} />

      {/* Public explore */}
      <Route path="/projects" element={<ProjectsPage />} />

      {/* Auth */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/projects/new" element={<CreateProjectPage />} />
        <Route path="/my-projects" element={<MyProjectsPage />} />
        <Route path="/settings/profile" element={<ProfileSettings />} />
        <Route path="/media/new" element={<CreateMediaPage />} />
      </Route>
    </Routes>
  );
}

export default AppRouter;

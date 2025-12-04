// src/api/users.js
import { api } from "./client";

/**
 * Normaliza respuestas tipo { user }, { currentUser }, { data } o payload plano.
 */
const unwrapUser = (data) => {
  if (!data || typeof data !== "object") return null;
  return data.user || data.currentUser || data.data || data;
};

export const getMyProfile = async () => {
  const res = await api.get("/users/me");
  return unwrapUser(res.data);
};

export const updateMyProfile = async (payload) => {
  const res = await api.patch("/users/me/profile", payload);
  return unwrapUser(res.data);
};

export const updateMyPassword = async ({ currentPassword, newPassword }) => {
  const res = await api.patch("/users/me/password", {
    currentPassword,
    newPassword,
  });
  return res.data;
};

export const deactivateMyAccount = async () => {
  const res = await api.delete("/users/me");
  return res.data;
};

// Para cuando hagamos el perfil público /u/:id o similar
export const getUserPublicProfile = async (userId) => {
  const res = await api.get(`/users/${userId}`);
  return unwrapUser(res.data);
};

export const getUserStats = async (userId) => {
  const res = await api.get(`/users/${userId}/stats`);
  return res.data?.stats || null;
};

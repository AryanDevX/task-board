import { apiFetch } from "./client";

export const authApi = {

  register: (data: {
    name: string;
    email: string;
    password: string;
  }) => apiFetch("/auth/register", {
    method: "POST",
    body: JSON.stringify(data)
  }),

  login: (data: {
    email: string;
    password: string;
  }) => apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify(data)
  }),

  logout: () => apiFetch("/auth/logout", {
    method: "POST"
  }),

  myProfile: () => apiFetch("/auth/myprofile")
};
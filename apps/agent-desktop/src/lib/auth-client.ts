import { convexClient } from "@convex-dev/better-auth/client/plugins";
import {
  emailOTPClient,
  genericOAuthClient,
  phoneNumberClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

// Desktop auth strategy:
//   Dev:  Vite proxy forwards /api/auth/* → Convex site URL (same-origin, no CORS)
//   Prod: Tauri loads from tauri:// so we go through diplomate.ga (hosted, always on)
// No dependency on running agent-web locally.
const isDev = import.meta.env.DEV;
const AUTH_URL = isDev
  ? "http://localhost:3003"            // same-origin → Vite proxy → Convex
  : "https://diplomate.ga";            // production auth server

export const authClient = createAuthClient({
  baseURL: AUTH_URL,
  plugins: [
    convexClient(),
    genericOAuthClient(),
    emailOTPClient(),
    phoneNumberClient(),
  ],
});

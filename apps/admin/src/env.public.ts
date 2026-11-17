export const ENV = {
  VITE_SERVER_URL: import.meta.env.VITE_SERVER_URL ?? "http://localhost:3000",
} as const;

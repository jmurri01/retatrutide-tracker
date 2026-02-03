/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "#e5e7eb",       // used by border-border
        background: "#ffffff",   // used by bg-background
        foreground: "#000000",   // used by text-foreground
        primary: "#2563eb",      // used by text-primary/bg-primary
        secondary: "#6b7280",    // used by text-secondary/bg-secondary
        muted: "#f5f5f5",        // generic low-contrast background
        accent: "#3b82f6",       // blue accent if needed
      },
    },
  },
  plugins: [],
};
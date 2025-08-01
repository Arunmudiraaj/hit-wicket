/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
          colors: {
            hitwicket: {
              blue: "#1E3A8A",       // Deep Blue - Background
              orange: "#FF6F00",     // Power Orange - CTA & Highlights
              orangeDark: "#E65C00", // Hover state for orange
              gold: "#FFD700",       // Gold - Rewards, Wins
              grayLight: "#F5F5F5",  // Light Gray - Cards, Neutral
              navy: "#0A192F",       // Dark Navy - Overlays, Text
              white: "#FFFFFF",
              textLight: "#E0E0E0",  // Light text
              red: "#FF3B3B",        // For out status / danger
            },
          },
        },
      },
    plugins: [],
  }
  
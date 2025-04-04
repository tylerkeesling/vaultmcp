import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  // In Tailwind v4, most of the theme is now defined using @theme in CSS
  // Here we only need to specify content paths and any plugins
  plugins: [],
};

export default config;

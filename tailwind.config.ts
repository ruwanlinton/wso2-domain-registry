import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        wso2: {
          orange: "#FF7300",
          "orange-dark": "#E56500",
          "orange-light": "#FF9940",
        },
      },
    },
  },
  plugins: [],
};

export default config;

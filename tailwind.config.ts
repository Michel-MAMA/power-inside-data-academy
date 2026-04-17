import type { Config } from "tailwindcss";

const config: Config = {
    content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
    theme: {
        extend: {
            boxShadow: {
                glow: "0 30px 80px rgba(14, 165, 233, 0.18)",
            },
            backgroundImage: {
                "hero-gradient": "radial-gradient(circle at top, rgba(14,165,233,0.18), transparent 40%), radial-gradient(circle at bottom right, rgba(59,130,246,0.16), transparent 25%)",
            },
        },
    },
    plugins: [],
};

export default config;

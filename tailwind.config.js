/** @type {import("tailwindcss").Config} */
module.exports = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}"
    ],
    theme: {
        extend: {
            width: {
                "160": "40rem"
            },
            transitionTimingFunction: {
                hill: "cubic-bezier(0.4, 0, 0.2, 1)"
            }
        }
    },
    plugins: [
        require("@tailwindcss/forms")
    ]
}
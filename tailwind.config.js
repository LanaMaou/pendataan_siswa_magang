/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./views/**/*.ejs"],
  theme: {
    extend: {
      fontFamily: {
        quicksand: "Quicksand",
      },
      container: {
        center: true,
      },
    },
  },
  plugins: [],
};

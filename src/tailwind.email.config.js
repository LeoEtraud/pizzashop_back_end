/** @type {import('tailwindcss').Config} */
export default {
  content: [],
  theme: { extend: {} },
  // Em e-mail, o preflight do Tailwind costuma atrapalhar:
  corePlugins: { preflight: false },
};

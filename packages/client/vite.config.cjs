const { defineConfig } = require('vite');
const react = require('@vitejs/plugin-react');
const monacoEditorPlugin = require('vite-plugin-monaco-editor').default;
const tailwindcss = require('@tailwindcss/postcss');
const autoprefixer = require('autoprefixer');

module.exports = defineConfig({
  plugins: [
    react(),
    monacoEditorPlugin({}),
  ],
  css: {
    postcss: {
      plugins: [
        tailwindcss,
        autoprefixer,
      ],
    },
  },
});
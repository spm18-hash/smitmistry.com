// @ts-check
import { defineConfig, fontProviders } from "astro/config";

export default defineConfig({
  experimental: {
    incrementalBuild: true,
  },
  site: process.env.PUBLIC_SITE_URL ?? "https://smitmistry.com",

  prefetch: true,

  fonts: [
    {
      provider: fontProviders.google(),
      name: "JetBrains Mono",
      cssVariable: "--font-mono",
      weights: ["400"],
      styles: ["normal"],
      fallbacks: [
        "Consolas",
        "Monaco",
        "Lucida Console",
        "Courier New",
        "monospace",
      ],
    },
    {
      provider: fontProviders.google(),
      cssVariable: "--font-sans",
      name: "Inter",
      weights: ["400", "500", "600"],
      styles: ["normal"],
    },
  ],

  markdown: {
    shikiConfig: {
      themes: { dark: "github-dark", light: "github-light" },
    },
  },
});

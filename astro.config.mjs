// @ts-check
import { defineConfig, fontProviders } from "astro/config";
import { satteri } from "@astrojs/markdown-satteri";

import sitemap from "@astrojs/sitemap";

export default defineConfig({
  experimental: {
    incrementalBuild: true,
  },

  site: "https://smitmistry.com",

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
    processor: satteri(),
    shikiConfig: {
      themes: { dark: "github-dark", light: "github-light" },
    },
  },

  integrations: [sitemap()],
});

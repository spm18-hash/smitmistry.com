import type { CollectionEntry } from "astro:content";
import satori from "satori";
import path from "node:path";
import fs from "node:fs/promises";
import sharp from "sharp";

export async function generateOgImage(post: CollectionEntry<"blog">) {
  const fontRegular = path.resolve(
    "src/assets/fonts/JetBrainsMono-Regular.ttf",
  );
  const regularBuffer = await fs.readFile(fontRegular);

  const svg = await satori(
    {
      key: post.id,
      type: "div",
      props: {
        style: {
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
          backgroundColor: "#000000",
          padding: "80px",
          fontFamily: "JetBrains Mono",
        },
        children: [
          {
            type: "div",
            props: {
              style: {
                fontSize: 64,
                fontWeight: 700,
                color: "#ffffff",
                lineHeight: 1.2,
                maxWidth: "90%",
              },
              children: post.data.title,
            },
          },
          post.data.description
            ? {
                type: "div",
                props: {
                  style: {
                    fontSize: 30,
                    color: "#94a3b8",
                    marginTop: 28,
                    maxWidth: "85%",
                  },
                  children: post.data.description,
                },
              }
            : null,
        ].filter(Boolean),
      },
    },
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: "JetBrains Mono",
          data: regularBuffer,
          weight: 400,
          style: "normal",
        },
      ],
    },
  );
  const svgBuffer = Buffer.from(svg);
  const png = await sharp(svgBuffer).resize({ width: 1200 }).png().toBuffer();

  return png;
}

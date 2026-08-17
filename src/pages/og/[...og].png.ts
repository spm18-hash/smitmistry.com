import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { generateOgImage } from "./_generateImage";

export async function getStaticPaths() {
  const posts = await getCollection("blog");

  return posts.map((post) => ({
    params: {
      og: post.id,
    },
    props: { post },
  }));
}

export const GET: APIRoute = async ({ props }) => {
  const { post } = props;

  const pngBuffer = await generateOgImage(post);

  return new Response(new Uint8Array(pngBuffer), {
    headers: {
      "Content-Type": "image/png",
      // Best practice: Tell browsers and CDNs to cache this heavily
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
};

---
title: Whereas recognition of the inherent dignity
description: This is description
pubDate: 2026-08-01
---

No one shall be subjected to arbitrary arrest, detention or
exile. Everyone is entitled in full equality to a fair and
public hearing by an independent and impartial tribunal, in the
determination of his rights and obligations and of any criminal
charge against him. No one shall be subjected to arbitrary
interference with his privacy, family, home or correspondence,
nor to attacks upon his honour and reputation. Everyone has the
right to the protection of the law against such interference or
attacks.

```json
{
  "extends": "astro/tsconfigs/base",
  // not needed for `strict` or `strictest`
  "compilerOptions": {
    "strictNullChecks": true,
    "allowJs": true
  }
}
```

Everyone has the right to freedom of thought, conscience and
religion; this right includes freedom to change his religion or
belief, and freedom, either alone or in community with others
and in public or private, to manifest his religion or belief in
teaching, practice, worship and observance. Everyone has the
right to freedom of opinion and expression; this right includes
freedom to hold opinions without interference and to seek,
receive and impart information and ideas through any media and
regardless of frontiers. Everyone has the right to rest and
leisure, including reasonable limitation of working hours and
periodic holidays with pay.

---

## Using variable fonts

Fallback fonts are used when the primary font has not yet
loaded, contains missing characters, or cannot be loaded for any
reason. When the fallback font differs significantly from the
primary font, layout shifts may occur during page loading.

```rs
fn first_word(s: &String) -> usize {
    let bytes = s.as_bytes();

    for (i, &item) in bytes.iter().enumerate() {
        if item == b' ' {
            return i;
        }
    }

    s.len()
}
```

To avoid this, Astro automatically tries to generate optimized
fallback fonts from the last defined fallback if it is a generic
font family. It uses sans-serif by default, but it may not match
the desired appearance of your primary font. You can adjust it
in your font configuration:

```ts
// 1. Import utilities from `astro:content`
import { defineCollection } from "astro:content";

// 2. Import loader(s)
import { glob, file } from "astro/loaders";

// 3. Import Zod
import { z } from "astro/zod";

// 4. Define a `loader` and `schema` for each collection
const blog = defineCollection({
  loader: glob({ base: "./src/content/blog", pattern: "**/*.{md,mdx}" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
  }),
});

// 5. Export a single `collections` object to register your collection(s)
export const collections = { blog };
```

You can also opt out of the defaultoptimization by setting
font.optimizedFallbacks to false in your font configuration.
Astro will then use the fallback fonts specified in your
configuration without any additional automatic processing.

---

## Accessing font data programmatically

The fontData object gives you access to all font files downloaded by Astro for your project, along with their metadata.
This means that you are responsible for filtering font files to
find the specific file you need, and for fetching data after
resolving URLs.

This can be useful for advanced use cases where you need direct
access to font files, such as generating OpenGraph images with
Satori in an API Route.

```md
---
title: My Blog Post
slug: my-custom-id/supports/slashes
---

Your blog post content here.
```

The fontData object gives you access to font files
downloaded by Astro for your project, with their metadata.
This means that you are responsible filtering font files to
find the specific file you need, and fetching data after
resolving URLs.

The following example generates an image in a static
file endpoint, assuming that only one font its format have
been configured with a format supported Satori:

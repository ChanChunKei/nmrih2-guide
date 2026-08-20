import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';
import { docsSchema } from '@astrojs/starlight/schema';

export const collections = {
	docs: defineCollection({
		loader: glob({ base: './src/content/guide', pattern: '**/*.{md,mdx}' }),
		schema: docsSchema({
			extend: z.object({
				author: z.string().optional(),
				datePublished: z.coerce.date().optional(),
				dateModified: z.coerce.date().optional(),
				article: z.boolean().optional(),
			}),
		}),
	}),
};

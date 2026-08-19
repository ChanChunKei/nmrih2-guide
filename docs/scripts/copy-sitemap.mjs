import { copyFile } from 'node:fs/promises';

await copyFile(
	new URL('../dist/sitemap-index.xml', import.meta.url),
	new URL('../dist/sitemap.xml', import.meta.url),
);

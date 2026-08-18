// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
	site: 'https://nmrih2guide.com',
	trailingSlash: 'always',
	integrations: [
		starlight({
			title: 'NMRiH2 Guide',
			description: 'Practical, up-to-date guides for No More Room in Hell 2.',
			favicon: '/favicon.svg',
			lastUpdated: false,
			locales: { root: { label: 'English', lang: 'en' } },
			social: [
				{
					icon: 'external',
					label: 'No More Room in Hell 2 on Steam',
					href: 'https://store.steampowered.com/app/292000/No_More_Room_in_Hell_2/',
				},
			],
			head: [
				{ tag: 'meta', attrs: { property: 'og:type', content: 'website' } },
				{ tag: 'meta', attrs: { property: 'og:site_name', content: 'NMRiH2 Guide' } },
			],
			customCss: ['./src/assets/nmrih2.css'],
			sidebar: [
				{ label: 'Start Here', items: ['beginner-guide', 'infection', 'loadouts', 'skills'] },
				{ label: 'Gear', items: ['weapons', 'weapon-attachments'] },
				{
					label: 'Maps',
					items: [
						'maps',
						'maps/raven-rock',
						'maps/power-plant',
						'maps/pottsville',
						'maps/lewiston',
						'maps/broadway',
						'maps/beaulieu-hospital',
						'maps/flooded',
						'maps/lighthouse',
						'maps/night-of-the-living-dead',
					],
				},
			],
		}),
	],
});

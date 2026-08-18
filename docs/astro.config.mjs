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
			locales: {
				root: { label: 'English', lang: 'en' },
				'zh-cn': { label: '简体中文', lang: 'zh-CN' },
			},
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
			components: { Head: './src/components/Head.astro' },
			sidebar: [
				{
					label: 'Start Here',
					translations: { 'zh-cn': '从这里开始' },
					items: ['beginner-guide', 'infection', 'loadouts', 'skills'],
				},
				{
					label: 'Gear',
					translations: { 'zh-cn': '装备' },
					items: ['weapons', 'weapon-attachments'],
				},
				{
					label: 'Maps',
					translations: { 'zh-cn': '地图' },
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

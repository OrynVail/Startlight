import App from './App.svelte'
import { writable } from 'svelte/store'

const defaultConfig = {
	name: 'Oryn',
	location: 'New Delhi',
	units: 'metric',
	apiKey: '',
	flavour: 'mocha',
	backgroundImage: '',
	backgroundBlur: 0,
	links: [
		[
			{ name: 'Gmail', url: 'https://mail.google.com' },
			{ name: 'Calendar', url: 'https://calendar.google.com' },
			{ name: 'Drive', url: 'https://drive.google.com' },
			{ name: 'Docs', url: 'https://docs.google.com' },
		],
		[
			{ name: 'GitHub', url: 'https://github.com' },
			{ name: 'NixOS', url: 'https://search.nixos.org/packages' },
			{ name: 'ChatGPT', url: 'https://chatgpt.com' },
			{ name: 'News', url: 'https://hacker.news' },
		],
		[
			{ name: 'YouTube', url: 'https://youtube.com' },
			{ name: 'Twitch', url: 'https://twitch.tv' },
			{ name: 'Reddit', url: 'https://reddit.com' },
			{ name: 'X', url: 'http://x.com' },
		],
	],
}
const storedConfig = JSON.parse(localStorage.getItem('config')) ?? defaultConfig
const config = writable(storedConfig)
config.subscribe((value) => {
	localStorage.setItem('config', JSON.stringify(value))
	document.body.className = value.flavour
})

const app = new App({
	target: document.body,
	props: {
		config: config,
	},
})

export default app

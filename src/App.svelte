<script>
	import { onMount } from 'svelte';

	export let config

	let settings = false

	let gif = 1

	let d = new Date()
	$: hours = twoDigits(d.getHours() % 12 === 0 ? 12 : d.getHours() % 12)
	$: minutes = twoDigits(d.getMinutes())
	$: date = d.toLocaleDateString('en', {
		weekday: 'long',
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	})
	$: greeting =
		d.getHours() < 2
			? 'night'
			: d.getHours() < 12
			? 'morning'
			: d.getHours() < 18
			? 'afternoon'
			: d.getHours() < 22
			? 'evening'
			: 'night'

	let weather
	let weatherClass = 'none'
	let temperature = 0

	const timeInterval = setInterval(() => {
		d = new Date()
	}, 1000)

	const weatherInterval = setInterval(() => {
		updateWeather()
	}, 300000)

	config.subscribe((value) => {
		updateWeather()
	})

	async function updateWeather() {
		const res = await fetch(
			`http://api.openweathermap.org/data/2.5/weather?q=${$config.location}&units=${$config.units}&appid=${$config.apiKey}`
		)
		if (!res.ok) {
			console.log(res)
			console.warn(
				'Your Openweathermap API key is probably missing or invalid.'
			)
			return
		}
		weather = await res.json()
		console.log(weather)
		temperature = Math.round(weather.main.temp)
		if (weather.weather[0].main === 'Clear') {
			let time = Math.floor(d / 1000)
			if (time < weather.sys.sunrise || time > weather.sys.sunset) {
				weatherClass = 'moon'
			} else {
				weatherClass = 'sun'
			}
		} else if (
			weather.weather[0].main === 'Rain' ||
			weather.weather[0].main === 'Drizzle' ||
			weather.weather[0].main === 'Thunderstorm'
		) {
			weatherClass = 'rain'
		} else if (weather.weather[0].main === 'Snow') {
			weatherClass = 'snow'
		} else {
			weatherClass = 'cloud'
		}
	}

	function twoDigits(n) {
		return n < 10 ? '0' + n : n
	}

	function handleImageUpload(event) {
		const file = event.target.files[0];
		if (!file) return;
		const reader = new FileReader();
		reader.onload = (e) => {
			$config.backgroundImage = e.target.result;
		};
		reader.readAsDataURL(file);
	}

	function removeBackgroundImage() {
		$config.backgroundImage = '';
		$config.backgroundBlur = 0;
	}

	let showLinks = false;

	function toggleLinks() {
		if (showLinks) {
			showLinks = false;
		} else {
			showLinks = true;
			settings = false;
		}
	}
	function toggleSettings() {
		if (settings) {
			settings = false;
		} else {
			settings = true;
			showLinks = false;
		}
	}

	function getAllLinks() {
		// Flatten all columns into a single array with column and index info
		return $config.links.flatMap((col, colIdx) => col.map((link, linkIdx) => ({...link, colIdx, linkIdx})));
	}
	function addLinkGlobal() {
		// Add to the first column by default
		$config.links[0] = [
			...$config.links[0],
			{ name: '', url: '' }
		];
	}

	let searchQuery = '';

	const searchEngines = {
		'!g': 'https://www.google.com/search?q=',
		'!ddg': 'https://duckduckgo.com/?q=',
		'!brave': 'https://search.brave.com/search?q=',
	};

	function handleSearchKeydown(e) {
		if (e.key === 'Enter' && searchQuery.trim()) {
			let url = '';
			const match = searchQuery.match(/^!(g|ddg|brave)\s+(.*)$/i);
			if (match) {
				const tag = `!${match[1].toLowerCase()}`;
				const query = encodeURIComponent(match[2]);
				url = searchEngines[tag] + query;
			} else {
				url = searchEngines['!g'] + encodeURIComponent(searchQuery);
			}
			window.open(url, '_blank');
		}
	}

	let searchBarVisible = false;

	function handleGlobalKeydown(e) {
		if (e.key === '/') {
			e.preventDefault();
			searchBarVisible = true;
			setTimeout(() => {
				const input = document.querySelector('.search-input');
				if (input) input.focus();
			}, 0);
		}
	}

	onMount(() => {
		window.addEventListener('keydown', handleGlobalKeydown);
		return () => window.removeEventListener('keydown', handleGlobalKeydown);
	});
</script>

<main>
	{#if $config.backgroundImage}
		<div id="custom-bg" style="background-image: url('{$config.backgroundImage}'); filter: blur({$config.backgroundBlur}px);"></div>
	{/if}

	{#if !settings && !showLinks}
		<div class="search-bar-container" on:mouseenter={() => searchBarVisible = true} on:mouseleave={() => searchBarVisible = false}>
			<div class="search-bar content-box {$config.flavour} {searchBarVisible ? 'visible' : ''}">
				<input
					type="text"
					placeholder="!g, !ddg, !brave..."
					bind:value={searchQuery}
					on:keydown={handleSearchKeydown}
					class="search-input"
					style="text-align: center;"
				/>
			</div>
		</div>
	{/if}

	{#if showLinks}
		<div id="box" class="content-box {$config.flavour} links-mode">
			<div id="links-panel">
				<h2 id="links-header">Links</h2>
				<div class="links-list">
					{#each getAllLinks() as linkObj}
						<div class="link-edit-row">
							<input type="text" placeholder="Name" bind:value={$config.links[linkObj.colIdx][linkObj.linkIdx].name} />
							<input type="text" placeholder="URL" bind:value={$config.links[linkObj.colIdx][linkObj.linkIdx].url} />
						</div>
					{/each}
				</div>
			</div>
		</div>
	{:else}
		<div id="content">
			<div id="image-container">
				<img
					id="image"
					src={'gifs/1.gif'}
					alt=""
				/>
				<div id="time">{hours}-{minutes}</div>
			</div>
			<div id="box" class="content-box {$config.flavour}">
				{#if settings}
					<div id="settings">
						<h2 id="settings-header">Settings</h2>
						<div class="label">Name</div>
						<input type="text" bind:value={$config.name} />
						<div class="label">Location</div>
						<input type="text" bind:value={$config.location} />
						<div class="label">Openweathermap API key</div>
						<input type="text" bind:value={$config.apiKey} />
						<div class="label">Units</div>
						<select bind:value={$config.units}>
							<option value="metric">metric</option>
							<option value="imperial">imperial</option>
						</select>
						<div class="label">Flavour</div>
						<select bind:value={$config.flavour}>
							<option value="mocha">Mocha</option>
							<option value="frappe">Frappé</option>
							<option value="macchiato">Macchiato</option>
							<option value="latte">Latte</option>
						</select>
						<div class="label">Background Image</div>
						<div class="bg-row">
							<label class="file-label">
								Choose File
								<input type="file" accept="image/*" on:change={handleImageUpload} />
							</label>
							<button class="remove-bg" on:click={removeBackgroundImage} title="Remove background image">✕</button>
							{#if $config.backgroundImage}
								<span class="label" style="margin: 0 0.5rem 0 1.5rem;">Blur</span>
								<input type="range" min="0" max="20" bind:value={$config.backgroundBlur} style="width: 120px; margin-right: 0.5rem;" />
								<span>{$config.backgroundBlur}px</span>
							{/if}
						</div>
					</div>
				{:else}
					<div id="main-content">
						<div id="heading-container">
							<div id="heading">
								<h1 id="greeting">
									Good {greeting}{$config.name ? ', ' + $config.name : ''}.
								</h1>
								<h2 id="date">Today is {date}.</h2>
							</div>
							<div id="weather-container" on:click={updateWeather}>
								{#if weather}
									<div id="temperature">{temperature}°</div>
									<div class="weather-icon {weatherClass}" />
								{/if}
							</div>
						</div>
						<div id="links">
							{#each $config.links as column}
								<div class="link-column">
									{#each column as link}
										<a href={link.url}>
											<span class="arrow">></span>
											<span class="text">{link.name}</span>
										</a>
										<br />
									{/each}
								</div>
							{/each}
						</div>
					</div>
				{/if}
			</div>
		</div>
	{/if}
	<div id="corner">
		<button id="links-button" on:click={toggleLinks} class:active={showLinks}>
			links
		</button>
		<button id="settings-button" on:click={toggleSettings} class:active={settings}>
			settings
		</button>
		<a href="https://github.com/OrynVail/Startlight" id="version">
			<img src="/favicon.svg" alt="Version"/>
		</a>
	</div>
</main>

<style>
	main {
		display: flex;
		justify-content: center;
		align-items: center;
		height: 100%;
		width: 100%;
	}
	#content {
		display: flex;
		animation: appear 0.3s ease-out forwards;
		position: relative;
		z-index: 1;
	}
	#image-container {
		width: 16rem;
		height: inherit;
		position: relative;
		margin-right: 3rem;
		overflow: hidden;
		border-radius: 2rem;
		display: flex;
		justify-content: center;
		align-items: center;
	}
	#image {
		position: absolute;
		height: inherit;
		max-height: 100%;
	}
	#image:hover {
		cursor: pointer;
	}
	#time {
		width: 5rem;
		padding: 1rem;
		background: hsla(0, 0.00%, 0.00%, 0.60);
		border-radius: 1rem;
		animation: time-appear 0.3s ease-out 0.2s forwards;
		font-size: 3rem;
		font-family: Cascadia Code;
		overflow-wrap: break-word;
		text-align: center;
		color: white;
		mix-blend-mode: overlay;
		transform: scale(0);
		backdrop-filter: blur(4px);
	}
	#box {
		padding: 3rem;
		overflow: hidden;
		transition: width 0.2s ease;
	}
	#heading-container {
		width: 100%;
		display: flex;
	}
	#weather-container {
		position: absolute;
		top: 3rem;
		right: 3rem;
		text-align: right;
		width: 7rem;
		height: min-content;
		margin-left: 4rem;
		opacity: 0;
		animation: weather-appear 0.3s ease-out 0.2s forwards;
	}
	#weather-container:hover {
		cursor: pointer;
	}
	#temperature {
		display: inline-block;
		margin: 0.2rem 0 0 0;
		font-size: 1.5rem;
		vertical-align: top;
	}
	h1 {
		margin: 0;
		font: inherit;
		font-size: 2rem;
	}
	#greeting {
		margin-bottom: 2rem;
		margin-right: 12rem;
		opacity: 0;
		animation: text-appear 0.3s ease-out 0.2s forwards;
	}
	#settings-header {
		margin-bottom: 1.5rem;
	}
	h2 {
		margin: 0;
		font: inherit;
		font-size: 1.5rem;
	}
	#date {
		margin-bottom: 3.5rem;
		opacity: 0;
		animation: text-appear 0.3s ease-out 0.225s forwards;
	}
	.label {
		margin: 1rem 0 0.25rem 0;
		font: inherit;
		font-size: 1rem;
	}
	#links {
		display: flex;
		justify-content: space-between;
		margin: 0;
		gap: 3rem;
	}
	.link-column {
		opacity: 0;
		animation: text-appear 0.3s ease-out 0.25s forwards;
	}
	button {
		background: none;
		border: none;
		font: inherit;
		padding: none;
		color: var(--text-dark-color);
		transition: 0.2s ease;
	}
	a {
		display: inline-block;
		text-decoration: none;
		color: var(--text-dark-color);
		transition: 0.2s ease;
		margin-bottom: 2rem;
	}
	a:last-of-type {
		margin-bottom: 0;
	}
	.arrow {
		display: inline-block;
		transform: translate(-22px);
		opacity: 0;
		transition: 0.2s ease;
	}
	.text {
		display: inline-block;
		transform: translate(-22px);
		transition: 0.2s ease;
	}
	a:hover,
	button:hover {
		color: var(--text-color);
		cursor: pointer;
	}
	a:hover .arrow {
		transform: none;
		opacity: 1;
	}
	a:hover .text {
		transform: none;
	}
	a:active:hover,
	button:active:hover {
		transform: scale(0.9);
	}
	select,
	input {
		background: var(--bg-color);
		border: none;
		font: inherit;
		color: inherit;
		padding: 0.5rem;
		border-radius: 0.5rem;
		width: 100%;
	}
	select {
		padding: 0.5rem;
	}
	#settings {
		width: 25rem;
		max-height: 42rem;
		scrollbar-width: thin;
		scrollbar-color: #8880 #0000;
	}
	#settings::-webkit-scrollbar {
		width: 6px;
		background: transparent;
	}
	#settings::-webkit-scrollbar-thumb {
		background: #888;
		border-radius: 3px;
	}
	#settings::-webkit-scrollbar-track {
		background: transparent;
	}
	.file-label {
		display: inline-block;
		padding: 0.5rem 1rem;
		background: var(--bg2-color);
		color: var(--text-color);
		border-radius: 0.5rem;
		cursor: pointer;
		font-size: 1rem;
		margin-bottom: 0.5rem;
		position: relative;
	}
	.file-label input[type="file"] {
		display: none;
	}
	.remove-bg {
		background: none;
		border: none;
		color: var(--text-color);
		font-size: 1.2rem;
		cursor: pointer;
		padding: 0 0.3rem;
		border-radius: 0.3rem;
		transition: background 0.2s;
	}
	.remove-bg:hover {
		background: var(--bg2-color);
	}
	#corner {
		position: absolute;
		padding: 1rem;
		bottom: 0;
		right: 0;
		opacity: 0;
		transition: 0.2s ease;
	}
	#corner:hover {
		opacity: 1;
	}
	#version {
		margin: 0;
		display: inline-block;
    	vertical-align: middle;
	}
	#version img {
		height: 2.4em;
		width: auto;
		margin-left: 0.5rem;
		opacity: 0.6;
		transition: opacity 0.2s ease;
	}
	#version:hover img {
		opacity: 1;
	}
	#custom-bg {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		z-index: 0;
		background-size: cover;
		background-position: center;
		pointer-events: none;
	}
	#links-panel {
		width: 100%;
		height: 100%;
		max-height: 100%;
		overflow-y: auto;
		padding-bottom: 1rem;
	}
	#links-header {
		margin-bottom: 1.5rem;
		font-size: 2rem;
		letter-spacing: 0.04em;
	}
	.links-list {
		display: flex;
		flex-direction: column;
		gap: 0.7rem;
	}
	.link-edit-row {
		display: flex;
		gap: 0.7rem;
		align-items: center;
	}
	.link-edit-row input[type="text"]:first-child {
		flex: 0 0 9.5rem;
		max-width: 12rem;
	}
	.link-edit-row input[type="text"]:last-child {
		flex: 0 0 30rem;
		max-width: 33rem;
	}
	.link-edit-row input[type="text"] {
		flex: 1 1 0;
		padding: 0.4rem 0.7rem;
		border-radius: 0.4rem;
		border: none;
		background: var(--bg2-color);
		color: var(--text-color);
		font-size: 1.1rem;
		box-shadow: 0 1px 4px 0 rgba(0,0,0,0.04);
	}
	.add-link {
		margin-top: 1.2rem;
		background: var(--bg2-color);
		color: var(--text-color);
		border: none;
		border-radius: 0.4rem;
		padding: 0.5rem 1.2rem;
		cursor: pointer;
		font-size: 1.1rem;
		transition: background 0.2s;
		box-shadow: 0 1px 4px 0 rgba(0,0,0,0.04);
		align-self: flex-start;
	}
	.add-link:hover {
		background: var(--text-dark-color);
	}
	.links-mode {
		width: 48rem !important;
		min-height: 44rem;
		max-height: 44rem;
		padding: 2.5rem 2.5rem 2rem 2.5rem;
		display: flex;
		flex-direction: column;
		animation: appear 0.3s ease-out forwards;
	}
	.bg-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}
	.search-bar-container {
		position: absolute;
		bottom: calc(50% - 16rem - 3rem);
		left: 50%;
		transform: translateX(-50%);
		z-index: 2;
		width: calc(14rem + 2rem + 44rem);
		max-width: 100vw;
		display: flex;
		justify-content: center;
		align-items: center;
	}
	.search-bar {
		display: flex;
		justify-content: center;
		align-items: center;
		margin: 0 auto;
		width: 100%;
		padding: 0.5rem 2.5rem;
		box-sizing: border-box;
		opacity: 0;
		transition: opacity 0.4s ease;
		pointer-events: none;
	}
	.search-bar.visible,
	.search-bar-container:hover .search-bar {
		opacity: 1;
		pointer-events: auto;
	}
	.search-input {
		width: 100%;
		font-size: 1.1rem;
		background: transparent;
		border: none;
		outline: none;
		color: var(--text-color);
		font-family: inherit;
		padding: 0.4rem 1.2rem;
		border-radius: 0.7rem;
		text-align: center;
	}
</style>

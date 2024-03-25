<script lang="ts">
	import "../app.pcss";
	import { onMount, onDestroy } from "svelte";
	import Logo from "../components/LogoWithTextHorizontal.svelte";
	import { CodeBranchOutline, DiscordSolid, BarsSolid, CloseSolid } from "flowbite-svelte-icons";
	import { browser } from "$app/environment";
	import { writable } from "svelte/store";
	import { setContext } from "svelte";
	import type { TransitionConfig } from "svelte/transition";
	import type { PageData } from "./$types";
	import { bounceOut } from "svelte/easing";
	import { generateTransition, transition } from "$lib/util/animation";
	import { reducedMotion } from "$lib/accessibility";
	import BackgroundProvider from "$components/BackgroundProvider.svelte";
	import AccountButton from "$components/AccountButton.svelte";

	export let data: PageData;

	// TODO: refactor

	const navigator = browser ? window.navigator : { userAgent: "" };

	interface NavItem {
		name: string;
		href: string;
		title: string;
		target: string;
	}

	const token = writable(data.tokenCookie || "");

	function transitionIn(node: HTMLElement, { duration = 360 }: TransitionConfig) {
		if ($reducedMotion)
			return {
				duration: 0,
			};
		node = node.querySelector(".content") || node;
		const intensity = node.dataset.intensityIn || "160";
		const UA = navigator.userAgent;
		const ff = UA.indexOf("Firefox") > -1;
		if (!dropdownCloseFinished) {
			node.animate(
				[
					{
						top: `${intensity}px`,
						opacity: "0",
						filter: ff ? "none" : `blur(${parseInt(intensity) / 16}px)`,
					},
					{
						top: "0",
						opacity: "1",
						filter: ff ? "none" : "blur(0px)",
					},
				],
				{
					easing: transition,
					duration,
				},
			);

			return {
				duration: 0,
			};
		}
		// FUCK YOUR DEFAULT SYSTEM, SVELTEKIT!!!
		node.animate(
			[
				{
					top: `${-intensity}px`,
					opacity: "0",
					filter: ff ? "none" : `blur(${parseInt(intensity) / 16}px)`,
				},
				{
					top: "0",
					opacity: "1",
					filter: ff ? "none" : "blur(0px)",
				},
			],
			{
				easing: transition,
				duration,
			},
		);
		return {
			duration,
		};
	}

	function transitionOut(node: HTMLElement, { duration = 360 }: TransitionConfig) {
		if ($reducedMotion)
			return {
				duration: 0,
			};
		node = node.querySelector(".content") || node;
		const intensity = node.dataset.intensityOut || "240";
		if (!dropdownCloseFinished)
			return {
				duration: 0,
			};
		const UA = navigator.userAgent;
		const ff = UA.indexOf("Firefox") > -1;
		node.animate(
			[
				{
					top: "0",
					opacity: "1",
					filter: ff ? "none" : "blur(0px)",
				},
				{
					top: `${intensity}px`,
					opacity: "0",
					filter: ff ? "none" : `blur(${parseInt(intensity) / 16}px)`,
				},
			],
			{
				easing: transition,
				duration: duration,
			},
		);
		return {
			duration,
		};
	}

	let dropdownOpen = false;
	let dropdownCloseFinished = true;
	let dropdownOpenFinished = false;
	// let dropdownOpen = true;
	// let dropdownCloseFinished = false;
	// let dropdownOpenFinished = true;
	let scrolled = false;
	let cookies: {
		[key: string]: string;
	} = {};

	$: navItems = [
		{
			name: "Blog",
			href: "/coming-soon",
			title: "Coming Soon",
			target: "_self",
		},
		{
			name: "Docs",
			href: "/coming-soon",
			title: "Coming Soon",
			target: "_self",
		},
		{
			name: "FAQ",
			href: "/faq",
			title: "Coming Soon",
			target: "_self",
		},
		{
			name: "Compatibility",
			href: "https://docs.google.com/spreadsheets/u/0/d/1LrLak1DP4UP3bNZKOCAzwNEp5JMkVozYuMnUBDF8gQM/htmlview#",
			title: "Compatibility",
			target: "_blank",
		},
		{
			name: "Discord",
			href: "https://discord.gg/suyu",
			title: "Suyu Discord Server",
			target: "_blank",
		},
		{
			name: "Git",
			href: "https://git.suyu.dev/suyu/suyu",
			title: "Suyu Git Repo",
			target: "_blank",
		},
		// {
		// 	name: $token || data.tokenCookie ? "Account" : "Sign up",
		// 	href: $token || data.tokenCookie ? "/account" : "/signup",
		// },
		$token || data.tokenCookie
			? {
					name: "Account",
					href: "/account",
				}
			: {
					name: "Sign up",
					href: "/signup",
				},
		$token || data.tokenCookie
			? {
					name: "Log out",
					href: "/logout",
				}
			: {
					name: "Log in",
					href: "/login",
				},
	] as NavItem[];

	$: {
		if (browser) {
			const html = document.querySelector("html")!;
			if (!dropdownOpen) {
				dropdownCloseFinished = false;
				setTimeout(() => {
					html.style.overflowY = "auto";
					dropdownCloseFinished = true;
				}, 360);
			} else {
				html.style.overflowY = "hidden";
				dropdownOpenFinished = false;
				setTimeout(() => {
					dropdownOpenFinished = true;
				}, 360);
			}
		}
	}

	function getTransition(i: number) {
		return `${((i + 1) / 4) * 75}ms`;
	}

	if (browser) {
		cookies = Object.fromEntries(
			document.cookie.split("; ").map((c) => {
				const [key, value] = c.split("=");
				return [key, value];
			}),
		);
		if (cookies.token) {
			$token = cookies.token;
		}
	}

	function toggleDropdown() {
		dropdownOpen = !dropdownOpen;
	}

	setContext("token", token);
	onMount(() => {
		const handleScroll = () => {
			scrolled = window.scrollY > 0;
		};

		handleScroll(); // we can't guarantee that the page starts at the top

		cookies = Object.fromEntries(
			document.cookie.split("; ").map((c) => {
				const [key, value] = c.split("=");
				return [key, value];
			}),
		);

		window.addEventListener("scroll", handleScroll);

		return () => {
			window.removeEventListener("scroll", handleScroll);
		};
	});
</script>

<!-- unfortunately, firefox is horrendous at rendering transforms so we can't enable it there -->
{#if navigator.userAgent.indexOf("Firefox") === -1}
	<div
		class="opacity-5"
		style="position: fixed; width: 100vw; height: 100vh; --mask-image: linear-gradient(to bottom, transparent 50px, black 150px, transparent); mask-image: var(--mask-image); -webkit-mask-image: var(--mask-image);"
	>
		<BackgroundProvider size={90} gap={16} speed={0.25} />
	</div>
{/if}

<div class="bg">
	<div
		style="background: radial-gradient(50% 50%, rgba(255,0,0,0.05), transparent); z-index: -1; width: 800px ;height: 800px; position: fixed; top: -50%; left: calc(25% - 400px);"
	/>

	<div
		style="background: radial-gradient(50% 50%, rgba(0,128,255,0.05), transparent); z-index: -1; width: 800px ;height: 800px; position: fixed; top: -50%; right: calc(25% - 400px);"
	/>
</div>

<main
	class={`min-h-full w-full ${dropdownOpen || !dropdownCloseFinished ? "overflow-hidden" : ""}`}
>
	<header
		style="transition: 180ms ease border;"
		class={`${
			scrolled
				? "fixed top-0 z-[9999] w-full border-b-2 border-b-[#ffffff11] bg-[#131215d0]"
				: "fixed top-0 z-[9999] w-full border-b-0 border-b-[transparent]"
		} pl-[calc(100vw-100%)]`}
	>
		<nav
			style="transition: 180ms ease;"
			class={scrolled
				? "mx-auto flex h-[72px] w-full max-w-[1300px] flex-row items-center justify-between px-8 backdrop-blur-xl"
				: "mx-auto flex h-[120px] w-full max-w-[1300px] flex-row items-center justify-between px-8"}
		>
			<div class="flex w-full flex-row items-center justify-start gap-8">
				<a
					href="/"
					title="Suyu Home"
					on:click={() => {
						if (dropdownOpen && window.innerWidth < 800) toggleDropdown();
					}}
				>
					<Logo size={28} />
				</a>
			</div>
			<div
				class="flex w-full flex-row items-center justify-center gap-2 text-sm font-medium text-[#A6A5A7] max-[800px]:hidden"
			>
				<a href="/coming-soon" class="px-5 py-3 transition hover:text-white" title="Coming Soon">Blog</a>
				<a href="/coming-soon" class="px-5 py-3 transition hover:text-white" title="Coming Soon">Docs</a>
				<a href="/faq" class="px-5 py-3 transition hover:text-white" title="Coming Soon">FAQ</a>
				<a href="https://docs.google.com/spreadsheets/u/0/d/1LrLak1DP4UP3bNZKOCAzwNEp5JMkVozYuMnUBDF8gQM/htmlview#" class="px-5 py-3 transition hover:text-white" title="Compatibility" target="_blank">Compatibility</a>
			</div>
			<div class="flex w-full flex-row items-center justify-end text-[#A6A5A7]">
				<div class="flex flex-row gap-4 max-[800px]:hidden">
					<a
						class="p-2 transition hover:text-white"
						href="https://git.suyu.dev/suyu/suyu"
						rel="noreferrer noopener"
						target="_blank"
						title="Suyu Git Repo"
					>
						<CodeBranchOutline />
					</a>
					<a
						class="p-2 transition hover:text-white"
						href="https://discord.gg/suyu"
						rel="noreferrer noopener"
						target="_blank"
						title="Suyu Discord Server"
					>
						<DiscordSolid />
					</a>
					{#if $token}
						<!-- <a href={$token ? "/account" : "/signup"} class="button-sm"
						>{$token ? "Account" : "Sign up"}</a
					> -->
						<!-- <a href="/account" class="button-sm">Account</a> -->
						<AccountButton user={data.user} />
					{:else}
						<a href="/login" class="button-sm">Log in</a>
						<a href="/signup" class="button-sm">Sign up</a>
					{/if}
				</div>
				<div class="relative mr-4 hidden flex-row gap-4 max-[800px]:flex">
					<button
						aria-label={dropdownOpen ? "Close navigation" : "Open navigation"}
						aria-expanded={dropdownOpen}
						on:click={toggleDropdown}
						class="-mr-4 p-4"
					>
						<div
							style="transition: 180ms; transition-property: opacity transform;"
							class={`absolute ${dropdownOpen ? "rotate-45 opacity-0" : "opacity-1"}`}
						>
							<BarsSolid />
						</div>
						<div
							style="transition: 180ms; transition-property: opacity transform;"
							class={dropdownOpen
								? "opacity-1 rotate-0"
								: "rotate-[-45deg] opacity-0"}
						>
							<CloseSolid />
						</div>
					</button>
				</div>
			</div>
		</nav>
	</header>
	<div
		style="transition: 180ms ease;"
		aria-hidden={!dropdownOpenFinished && !dropdownOpen}
		class={`fixed left-0 z-[100] h-screen w-full bg-[#0e0d10] p-9 pt-[120px] ${dropdownOpen ? "pointer-events-auto visible opacity-100" : "pointer-events-none opacity-0"} ${!dropdownOpen && dropdownCloseFinished ? "invisible" : ""}`}
	>
		<div class={`flex flex-col gap-8`}>
			<!-- <a href="##"><h1 class="w-full text-5xl">Blog</h1></a>
			<a href="##"><h1 class="w-full text-5xl">Docs</h1></a>
			<a href="##"><h1 class="w-full text-5xl">FAQ</h1></a> -->
			{#each navItems as item, i}
				<a
					style={`transition: ${
						dropdownOpen
							? generateTransition([
									// {
									// 	duration: 600,
									// 	delay: (i + 1) / 4,
									// 	property: "transform",
									// 	timingFunction: transition,
									// },
									// {
									// 	duration: 500,
									// 	delay: i * 1.25,
									// 	property: "filter",
									// 	timingFunction: transition,
									// },
									// {
									// 	duration: 400,
									// 	delay: (i + 1) / 4,
									// 	property: "opacity",
									// 	timingFunction: transition,
									// },
									{
										duration: 450,
										delay: i * 0.6,
										property: ["transform", "opacity", "filter"],
										timingFunction: transition,
									},
								])
							: generateTransition([
									{
										duration: 450,
										delay: 0,
										property: ["transform", "opacity", "filter"],
										timingFunction: transition,
									},
								])
					}`}
					class="{dropdownOpen
						? 'translate-y-0 opacity-100 filter-none'
						: '-translate-y-24 opacity-0 blur-md'} "
					href={item.href}
					title={item.title}
					target={item.target}
					on:click={() => toggleDropdown()}
				>
					<h1 class="w-full text-5xl">{item.name}</h1>
				</a>
			{/each}
		</div>
	</div>
	<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
	{#key data.url}
		<div
			in:transitionIn={{ duration: 500 }}
			out:transitionOut={{ duration: 500 }}
			aria-hidden={dropdownOpenFinished && dropdownOpen}
			tabindex={dropdownOpen ? 0 : -1}
			class={`absolute left-[50%] z-50 mx-auto flex w-screen max-w-[1300px] translate-x-[-50%] flex-col px-8 pb-12 pt-[120px] ${dropdownOpen ? "pointer-events-none translate-y-[25vh] opacity-0" : ""} ${dropdownOpenFinished && dropdownOpen ? "invisible" : ""}`}
		>
			<slot />
		</div>
	{/key}
</main>

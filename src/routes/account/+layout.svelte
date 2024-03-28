<script lang="ts">
	import { browser } from "$app/environment";
	import { transition } from "$lib/util/animation";
	import { onMount, tick } from "svelte";
	import type { PageData } from "./$types";
	import { page } from "$app/stores";
	import { writable } from "svelte/store";
	import { afterNavigate, beforeNavigate } from "$app/navigation";
	import { v4 } from "uuid";
	import { reducedMotion } from "$lib/accessibility";

	interface NavItem {
		name: string;
		href: string;
	}

	let indicator: HTMLDivElement;
	let navBar: HTMLDivElement;
	let selected = 0;

	export let data: PageData;

	const navItems: NavItem[] = [
		{
			name: "Multiplayer",
			href: "/account",
		},
		{
			name: "Public Game Lobby",
			href: "/account/lobby",
		},
		// {
		// 	name: "Friends",
		// 	href: "/account/friends",
		// },
	];

	function navClick(e: MouseEvent | HTMLAnchorElement, ignoreAnimation = false) {
		const navBars = document.querySelectorAll<HTMLDivElement>(".navbar");
		if (navBars.length !== 1)
			navBars.forEach((bar) => {
				if (!bar.classList.contains($page.url.pathname)) {
					bar.style.opacity = "0";
				}
			});
		else {
			navBar.style.zIndex = "1";
		}
		const target = e.target as HTMLAnchorElement;
		const index = parseInt(target.dataset.index!);
		selected = index;
		const bounds = target.getBoundingClientRect();
		const navBounds = navBar.getBoundingClientRect();
		const pillBounds = indicator.getBoundingClientRect();
		if (ignoreAnimation) return;
		indicator.style.transform = `translateX(${bounds.left - navBounds.left}px)`;
		indicator.style.width = `${bounds.width}px`;
		if (
			// (selected !== 0 && selected !== navItems.length - 1) ||
			$reducedMotion
		)
			return;
		indicator.offsetHeight;
		const transformFactor = bounds.left - pillBounds.left;

		navBar.animate(
			[
				{
					transform: "translateX(0px)",
					easing: "ease-out",
				},
				{
					transform: `translateX(${transformFactor / 50}px)`,
					offset: 0.4,
					easing: "ease-out",
				},
				{
					transform: "translateX(0px)",
					easing: "ease-in",
				},
			],
			$reducedMotion
				? {
						duration: 0,
					}
				: {
						duration: 360,
					},
		);
	}

	afterNavigate(({ from }) => {
		if (from) {
			if (!from.url.pathname.startsWith("/account")) {
				navBar.style.opacity = "0";
				navBar.animate(
					[
						{
							opacity: "0",
							filter: "blur(20px)",
							marginTop: "-96px",
						},
						{
							opacity: "1",
							filter: "blur(0px)",
							marginTop: "0px",
						},
					],
					$reducedMotion
						? {
								duration: 0,
							}
						: {
								duration: 500,
								easing: transition,
								delay: 60,
							},
				).onfinish = () => {
					navBar.style.opacity = "1";
				};
				selected = 0;
				navClick({ target: document.querySelector(".navitem")! } as unknown as MouseEvent);
				return;
			}
		}
		const prevIndex = from ? navItems.findIndex((i) => from.url.pathname === i.href) : 0;
		const items = Array.from(document.querySelectorAll(".navitem")) as HTMLAnchorElement[];
		const oldItem = items.find((i) => i.dataset.index === prevIndex.toString());
		if (!oldItem) return;
		const oldItemBounds = oldItem.getBoundingClientRect();
		const navBounds = navBar.getBoundingClientRect();

		const oldTransition = indicator.style.transition;
		indicator.style.transition = "0s";
		indicator.style.transform = `translateX(${oldItemBounds.left - navBounds.left}px)`;
		indicator.style.width = `${oldItemBounds.width}px`;
		indicator.offsetHeight;
		indicator.style.transition = oldTransition;
		const item = items.find((i) => new URL(i.href).pathname === data.url);
		navClick({ target: item } as unknown as MouseEvent);
	});

	beforeNavigate(({ to }) => {
		if (!to) return;
		if (!to.url.pathname.startsWith("/account") && to.url.hostname === location.hostname) {
			if (navBar.style.opacity === "0") return;
			navBar.animate(
				[
					{
						opacity: "1",
						marginTop: "0px",
					},
					{
						opacity: "0",
						marginTop: "40px",
					},
				],
				$reducedMotion
					? {
							duration: 0,
						}
					: {
							duration: 360,
							easing: transition,
						},
			).onfinish = () => {
				navBar.style.opacity = "0";
			};
		}
	});

	onMount(async () => {
		await tick(); // if this doesn't work, do setTimeout on 10ms or so
		const items = Array.from(document.querySelectorAll(".navitem")) as HTMLAnchorElement[];
		const item = items.find((i) => new URL(i.href).pathname === data.url);
		navClick({ target: item } as unknown as MouseEvent);
	});
</script>

{#key data.url}
	<div
		class={`navbar ${data.url} relative z-50 mb-4 ml-auto mr-auto flex w-max gap-1 overflow-hidden rounded-full bg-[#110d10] p-1`}
		bind:this={navBar}
	>
		<div
			bind:this={indicator}
			style="transition: 360ms {transition}"
			class="pointer-events-none absolute left-0 top-[4px] z-10 h-[calc(100%-8px)] translate-x-0 transform rounded-full bg-gradient-to-b from-[#fafafa] to-[#d1d1d1] mix-blend-difference motion-reduce:!transition-none"
		></div>
		{#each navItems as item, i}
			<a
				href={item.href}
				data-index={i}
				on:click={(e) => navClick(e, true)}
				class={`navitem flex flex-grow basis-[0] items-center justify-center whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold ${
					selected === i ? " text-[#a9a9a9] opacity-100" : "opacity-50"
				}`}
			>
				{item.name}
			</a>
		{/each}
	</div>
{/key}

<div class="relative">
	<div data-intensity-in={80} data-intensity-out={140} class="content absolute w-full">
		<slot />
	</div>
</div>

<style>
	@media (max-width: 750px) {
		.navbar {
			margin-right: 0;
			margin-left: 0;
		}
	}
</style>

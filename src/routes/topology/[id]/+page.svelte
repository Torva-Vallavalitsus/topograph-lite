<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { onDestroy } from 'svelte';
	import { setContext } from 'svelte';
	import TopologyTree from '$lib/components/TopologyTree.svelte';
	import { connectToTopology, sendEditing, sendEditingStop } from '$lib/ws';
	import { clearAllLiveEdits } from '$lib/live-edits.svelte';

	let { data } = $props();

	setContext('ws', { sendEditing, sendEditingStop });

	let cleanup: (() => void) | null = null;
	$effect(() => {
		cleanup?.();
		cleanup = connectToTopology(data.topology.id, () => invalidateAll());
	});
	onDestroy(() => cleanup?.());

	let editing = $state(false);
	let editName = $state('');
	let expandGen = $state(0);
	let collapseGen = $state(0);
	let filter = $state('');

	function startRename() {
		editName = data.topology.name;
		editing = true;
	}

	async function saveName() {
		if (!editName.trim()) return;
		await fetch(`/api/topologies/${data.topology.id}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ name: editName.trim() })
		});
		editing = false;
		invalidateAll();
	}

	function handleNameKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') saveName();
		if (e.key === 'Escape') editing = false;
	}

	async function refresh() {
		await invalidateAll();
	}
</script>

<svelte:head>
	<title>{data.topology.name} — Topograph Lite</title>
</svelte:head>

<div class="max-w-full mx-auto px-4 py-6">
	<div class="flex items-center gap-4 mb-6">
		<a href="/" class="text-slate-400 hover:text-slate-200 transition-colors print:hidden" aria-label="Back">
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
			</svg>
		</a>
		{#if editing}
			<input
				type="text"
				bind:value={editName}
				onkeydown={handleNameKeydown}
				onblur={saveName}
				class="text-xl font-bold bg-slate-800 border border-slate-600 rounded px-2 py-1 text-slate-100 focus:outline-none focus:border-cyan-500"
			/>
		{:else}
			<button
				class="text-xl font-bold text-slate-100 hover:text-cyan-400 transition-colors"
				onclick={startRename}
				title="Click to rename"
			>
				{data.topology.name}
			</button>
		{/if}
	</div>

	<!-- Sticky toolbar -->
	<div class="fixed top-4 right-4 z-40 flex items-center gap-2 print:hidden">
		<div class="relative">
			<svg class="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
			</svg>
			<input
				type="text"
				bind:value={filter}
				placeholder="Filter devices..."
				class="pl-8 pr-8 py-1.5 text-xs bg-slate-800 border border-slate-600 hover:border-slate-500 focus:border-cyan-500 text-slate-200 rounded outline-none w-52 transition-colors placeholder:text-slate-500"
			/>
			{#if filter}
				<button
					onclick={() => (filter = '')}
					class="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
				>
					<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			{/if}
		</div>
		<button
			onclick={() => expandGen++}
			class="px-3 py-1.5 text-xs bg-slate-800 border border-slate-600 hover:border-slate-500 text-slate-300 rounded transition-colors"
			title="Expand all"
		>
			<svg class="w-4 h-4 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
			</svg>
			Expand All
		</button>
		<button
			onclick={() => collapseGen++}
			class="px-3 py-1.5 text-xs bg-slate-800 border border-slate-600 hover:border-slate-500 text-slate-300 rounded transition-colors"
			title="Collapse all"
		>
			<svg class="w-4 h-4 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
			</svg>
			Collapse All
		</button>
	</div>

	<div class="overflow-x-auto">
		<TopologyTree devices={data.tree} topologyId={data.topology.id} onrefresh={refresh} {expandGen} {collapseGen} {filter} />
	</div>
</div>

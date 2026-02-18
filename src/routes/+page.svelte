<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import TopologyListCard from '$lib/components/TopologyListCard.svelte';
	import CreateTopologyModal from '$lib/components/CreateTopologyModal.svelte';
	import DrawioImportModal from '$lib/components/DrawioImportModal.svelte';

	let { data } = $props();

	let showCreate = $state(false);
	let showImport = $state(false);

	async function createTopology(name: string) {
		const res = await fetch('/api/topologies', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ name })
		});
		const { id } = await res.json();
		showCreate = false;
		goto(`/topology/${id}`);
	}

	async function deleteTopology(id: string) {
		await fetch(`/api/topologies/${id}`, { method: 'DELETE' });
		invalidateAll();
	}

	async function importDrawio(xml: string, name: string) {
		const res = await fetch('/api/import/drawio', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ xml, name })
		});
		const { id } = await res.json();
		showImport = false;
		goto(`/topology/${id}`);
	}
</script>

<svelte:head>
	<title>Topograph Lite</title>
</svelte:head>

<div class="max-w-4xl mx-auto px-4 py-8">
	<div class="flex items-center justify-between mb-8">
		<div>
			<h1 class="text-2xl font-bold text-slate-100">Topograph Lite</h1>
			<p class="text-sm text-slate-500 mt-1">Manual network topology builder</p>
		</div>
		<div class="flex items-center gap-2">
			<button
				onclick={() => (showImport = true)}
				class="px-4 py-2 text-sm bg-slate-800 border border-slate-600 hover:border-slate-500 text-slate-300 rounded transition-colors"
			>
				Import draw.io
			</button>
			<button
				onclick={() => (showCreate = true)}
				class="px-4 py-2 text-sm bg-cyan-600 hover:bg-cyan-500 text-white rounded transition-colors"
			>
				New Topology
			</button>
		</div>
	</div>

	{#if data.topologies.length === 0}
		<div class="text-center py-16 text-slate-500">
			<p class="text-lg">No topologies yet</p>
			<p class="mt-1 text-sm">Create one or import from draw.io to get started</p>
		</div>
	{:else}
		<div class="grid gap-3">
			{#each data.topologies as topology (topology.id)}
				<TopologyListCard {topology} ondelete={deleteTopology} />
			{/each}
		</div>
	{/if}
</div>

<CreateTopologyModal
	open={showCreate}
	onclose={() => (showCreate = false)}
	oncreate={createTopology}
/>

<DrawioImportModal
	open={showImport}
	onclose={() => (showImport = false)}
	onimport={importDrawio}
/>

<script lang="ts">
	import type { TopologyDevice } from '$lib/types';
	import DeviceCard from './DeviceCard.svelte';
	import InterfaceBranch from './InterfaceBranch.svelte';
	import DeviceEditModal from './DeviceEditModal.svelte';
	import InterfaceEditModal from './InterfaceEditModal.svelte';

	interface Props {
		device: TopologyDevice;
		topologyId: string;
		onrefresh: () => void;
		expandGen: number;
		collapseGen: number;
		filter: string;
	}

	let { device, topologyId, onrefresh, expandGen, collapseGen, filter }: Props = $props();
	let showEdit = $state(false);
	let showAddInterface = $state(false);
	let collapsed = $state(collapseGen > expandGen);

	let lastExpandGen = $state(expandGen);
	let lastCollapseGen = $state(collapseGen);

	$effect(() => {
		if (expandGen > lastExpandGen) {
			collapsed = false;
			lastExpandGen = expandGen;
		}
	});

	$effect(() => {
		if (collapseGen > lastCollapseGen) {
			collapsed = true;
			lastCollapseGen = collapseGen;
		}
	});

	const hasChildren = $derived(device.interfaces.length > 0);
	const effectiveCollapsed = $derived(filter ? false : collapsed);

	async function deleteDevice() {
		if (!confirm('Delete this device and all children?')) return;
		const res = await fetch(`/api/devices/${device.id}`, { method: 'DELETE' });
		if (res.ok) onrefresh();
	}

	function toggleCollapse() {
		collapsed = !collapsed;
	}

	function handleDragStart(e: DragEvent) {
		e.dataTransfer!.setData('application/json', JSON.stringify({
			deviceId: device.id,
			deviceHostname: device.hostname || 'Unnamed'
		}));
		e.dataTransfer!.effectAllowed = 'move';
	}
</script>

<div class="flex flex-col">
	<div class="flex items-center gap-1">
		{#if hasChildren}
			<button
				onclick={toggleCollapse}
				class="p-0.5 text-slate-500 hover:text-slate-300 transition-colors flex-shrink-0 print:hidden"
				title={effectiveCollapsed ? 'Expand' : 'Collapse'}
			>
				<svg class="w-4 h-4 transition-transform {effectiveCollapsed ? '-rotate-90' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
				</svg>
			</button>
		{:else}
			<div class="w-5"></div>
		{/if}
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div draggable="true" ondragstart={handleDragStart} class="cursor-grab active:cursor-grabbing">
			<DeviceCard {device} onclick={() => (showEdit = true)} {filter} />
		</div>
		<div class="flex flex-col gap-0.5 print:hidden">
			<button
				onclick={() => (showAddInterface = true)}
				class="p-1 text-slate-500 hover:text-cyan-400 transition-colors"
				title="Add interface"
			>
				<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
				</svg>
			</button>
			{#if device.parentInterfaceId}
				<button
					onclick={deleteDevice}
					class="p-1 text-slate-500 hover:text-red-400 transition-colors"
					title="Delete device"
				>
					<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
					</svg>
				</button>
			{/if}
		</div>
		{#if effectiveCollapsed && hasChildren}
			<span class="text-[10px] text-slate-500 ml-1">({device.interfaces.length})</span>
		{/if}
	</div>

	{#if hasChildren && !effectiveCollapsed}
		<div class="relative flex flex-col gap-2 pl-[30px] ml-6">
			<!-- Vertical connector from card row down to first interface (2px extra for subpixel overlap) -->
			<div class="absolute left-[29px] -top-2 w-[2px] bg-slate-600 h-[calc(0.5rem+16px)]"></div>
			{#each device.interfaces as iface, i (iface.id)}
				{@const isFirst = i === 0}
				{@const isLast = i === device.interfaces.length - 1}
				<div class="relative">
					{#if !(isFirst && isLast)}
						<!-- Vertical connector between interfaces -->
						<div class="absolute left-[-1px] w-[2px] bg-slate-600 {isFirst ? 'top-[14px]' : '-top-2'} {isLast ? 'h-[calc(14px+0.5rem)]' : '-bottom-2'}"></div>
					{/if}
					<InterfaceBranch {iface} {topologyId} {onrefresh} {expandGen} {collapseGen} {filter} parentDeviceHostname={device.hostname || 'Unnamed'} />
				</div>
			{/each}
		</div>
	{/if}
</div>

<DeviceEditModal
	open={showEdit}
	{device}
	onclose={() => (showEdit = false)}
	onsave={onrefresh}
/>

<InterfaceEditModal
	open={showAddInterface}
	deviceId={device.id}
	onclose={() => (showAddInterface = false)}
	onsave={onrefresh}
/>

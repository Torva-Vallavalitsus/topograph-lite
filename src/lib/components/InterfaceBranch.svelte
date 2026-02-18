<script lang="ts">
	import type { TopologyInterface } from '$lib/types';
	import DeviceNode from './DeviceNode.svelte';

	interface Props {
		iface: TopologyInterface;
		topologyId: string;
		onrefresh: () => void;
		expandGen: number;
		collapseGen: number;
		filter: string;
		parentDeviceHostname: string;
	}

	let { iface, topologyId, onrefresh, expandGen, collapseGen, filter, parentDeviceHostname }: Props = $props();

	let editing = $state(false);
	let editName = $state('');
	let inputEl = $state<HTMLInputElement | null>(null);

	let editingUplink = $state(false);
	let editUplinkName = $state('');
	let uplinkInputEl = $state<HTMLInputElement | null>(null);

	function startEdit() {
		editName = iface.name;
		editing = true;
		queueMicrotask(() => inputEl?.select());
	}

	async function saveEdit() {
		editing = false;
		const trimmed = editName.trim();
		if (!trimmed || trimmed === iface.name) return;
		await fetch(`/api/interfaces/${iface.id}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ name: trimmed })
		});
		onrefresh();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') saveEdit();
		if (e.key === 'Escape') editing = false;
	}

	function startUplinkEdit() {
		editUplinkName = iface.childDevice?.uplinkInterfaceName || '';
		editingUplink = true;
		queueMicrotask(() => uplinkInputEl?.select());
	}

	async function saveUplinkEdit() {
		editingUplink = false;
		if (!iface.childDevice) return;
		const trimmed = editUplinkName.trim();
		if (trimmed === (iface.childDevice.uplinkInterfaceName || '')) return;
		await fetch(`/api/devices/${iface.childDevice.id}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ uplinkInterfaceName: trimmed || null })
		});
		onrefresh();
	}

	function handleUplinkKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') saveUplinkEdit();
		if (e.key === 'Escape') editingUplink = false;
	}

	async function connectDevice() {
		const res = await fetch(`/api/topologies/${topologyId}/devices`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ parentInterfaceId: iface.id, type: 'switch' })
		});
		if (res.ok) onrefresh();
	}

	async function deleteInterface() {
		if (!confirm(`Delete interface "${iface.name}"?`)) return;
		await fetch(`/api/interfaces/${iface.id}`, { method: 'DELETE' });
		onrefresh();
	}

	let dragOver = $state(false);

	function handleDragOver(e: DragEvent) {
		if (iface.childDevice) return;
		e.preventDefault();
		e.dataTransfer!.dropEffect = 'move';
		dragOver = true;
	}

	function handleDragLeave() {
		dragOver = false;
	}

	async function handleDrop(e: DragEvent) {
		dragOver = false;
		if (iface.childDevice) return;
		e.preventDefault();
		const data = e.dataTransfer?.getData('application/json');
		if (!data) return;
		const { deviceId, deviceHostname } = JSON.parse(data);
		if (!confirm(`Move "${deviceHostname}" to interface "${iface.name}" of "${parentDeviceHostname}"?`)) return;
		await fetch(`/api/devices/${deviceId}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ parentInterfaceId: iface.id, uplinkInterfaceName: null })
		});
		onrefresh();
	}
</script>

<div class="flex items-start">
	<!-- Interface labels with connector lines -->
	<div class="flex items-center h-[28px] flex-shrink-0 -ml-px">
		<div class="w-[33px] h-[2px] bg-slate-600"></div>
		{#if editing}
			<input
				bind:this={inputEl}
				bind:value={editName}
				onblur={saveEdit}
				onkeydown={handleKeydown}
				class="px-1.5 py-0.5 text-[11px] font-mono text-slate-200 bg-slate-900 border border-cyan-500 rounded w-20 outline-none"
			/>
		{:else}
			<button
				ondblclick={startEdit}
				class="px-1.5 py-0.5 text-[11px] font-mono text-slate-400 bg-slate-800 border border-slate-700 rounded whitespace-nowrap hover:border-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
			>
				{iface.name}
			</button>
		{/if}
		<div class="w-6 h-[2px] bg-slate-600"></div>
		{#if editingUplink}
			<input
				bind:this={uplinkInputEl}
				bind:value={editUplinkName}
				onblur={saveUplinkEdit}
				onkeydown={handleUplinkKeydown}
				class="px-1.5 py-0.5 text-[11px] font-mono text-slate-200 bg-slate-900 border border-cyan-500 rounded w-20 outline-none"
			/>
			<div class="w-3 h-[2px] bg-slate-600"></div>
		{:else if iface.childDevice?.uplinkInterfaceName}
			<button
				ondblclick={startUplinkEdit}
				class="px-1.5 py-0.5 text-[11px] font-mono text-slate-500 bg-slate-800/60 border border-slate-700/60 rounded whitespace-nowrap hover:border-slate-500 hover:text-slate-400 transition-colors cursor-pointer"
			>
				{iface.childDevice.uplinkInterfaceName}
			</button>
			<div class="w-3 h-[2px] bg-slate-600"></div>
		{:else if iface.childDevice}
			<button
				ondblclick={startUplinkEdit}
				class="px-1.5 py-0.5 text-[11px] font-mono text-slate-600 bg-slate-800/30 border border-dashed border-slate-700/40 rounded whitespace-nowrap hover:border-slate-500 hover:text-slate-400 transition-colors cursor-pointer"
			>
				···
			</button>
			<div class="w-3 h-[2px] bg-slate-600"></div>
		{/if}
		{#if !iface.childDevice}
			<button
				onclick={deleteInterface}
				class="p-0.5 text-slate-600 hover:text-red-400 transition-colors ml-1 print:hidden"
				title="Delete interface"
			>
				<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>
		{/if}
	</div>

	{#if iface.childDevice}
		<DeviceNode device={iface.childDevice} {topologyId} {onrefresh} {expandGen} {collapseGen} {filter} />
	{:else}
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="flex items-center h-[28px]"
			ondragover={handleDragOver}
			ondragleave={handleDragLeave}
			ondrop={handleDrop}
		>
			<button
				onclick={connectDevice}
				class="px-3 py-1.5 text-xs border border-dashed rounded transition-colors print:hidden {dragOver ? 'border-cyan-500 text-cyan-400 bg-cyan-500/10' : 'border-slate-600 text-slate-500 hover:border-cyan-500 hover:text-cyan-400'}"
			>
				{dragOver ? 'Drop here' : '+ Connect device'}
			</button>
		</div>
	{/if}
</div>

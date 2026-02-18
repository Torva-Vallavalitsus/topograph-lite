<script lang="ts">
	import Modal from './ui/Modal.svelte';
	import { getContext } from 'svelte';
	import type { TopologyDevice, DeviceType } from '$lib/types';
	import { getLiveEdit } from '$lib/live-edits.svelte';

	interface Props {
		open: boolean;
		device: TopologyDevice;
		onclose: () => void;
		onsave: () => void;
	}

	let { open, device, onclose, onsave }: Props = $props();

	const ws = getContext<{ sendEditing: (id: string, fields: Record<string, unknown>) => void; sendEditingStop: (id: string) => void }>('ws');

	let hostname = $state('');
	let ip = $state('');
	let vendor = $state('');
	let model = $state('');
	let serialNumber = $state('');
	let primaryMac = $state('');
	let firmwareVersion = $state('');
	let type = $state<DeviceType>('switch');
	let assetTag = $state('');
	let comment = $state('');
	let location = $state('');

	$effect(() => {
		if (open) {
			hostname = device.hostname || '';
			ip = device.ip || '';
			vendor = device.vendor || '';
			model = device.model || '';
			serialNumber = device.serialNumber || '';
			primaryMac = device.primaryMac || '';
			firmwareVersion = device.firmwareVersion || '';
			type = device.type || 'switch';
			assetTag = device.assetTag || '';
			comment = device.comment || '';
			location = device.location || '';
		}
	});

	// Apply remote live edits to form fields
	$effect(() => {
		const live = getLiveEdit(device.id);
		if (!open || !live) return;
		if ('hostname' in live && live.hostname !== hostname) hostname = live.hostname as string;
		if ('ip' in live && live.ip !== ip) ip = live.ip as string;
		if ('vendor' in live && live.vendor !== vendor) vendor = live.vendor as string;
		if ('model' in live && live.model !== model) model = live.model as string;
		if ('serialNumber' in live && live.serialNumber !== serialNumber) serialNumber = live.serialNumber as string;
		if ('primaryMac' in live && live.primaryMac !== primaryMac) primaryMac = live.primaryMac as string;
		if ('firmwareVersion' in live && live.firmwareVersion !== firmwareVersion) firmwareVersion = live.firmwareVersion as string;
		if ('type' in live && live.type !== type) type = live.type as DeviceType;
		if ('assetTag' in live && live.assetTag !== assetTag) assetTag = live.assetTag as string;
		if ('comment' in live && live.comment !== comment) comment = live.comment as string;
		if ('location' in live && live.location !== location) location = live.location as string;
	});

	let debounceTimer: ReturnType<typeof setTimeout> | undefined;
	$effect(() => {
		// Track all field values to trigger on any change
		const fields = { hostname, ip, vendor, model, serialNumber, primaryMac, firmwareVersion, type, assetTag, comment, location };
		if (!open) return;
		// Only send fields that differ from the saved device values AND from the current live edit
		// (comparing against live edit prevents bouncing remote edits back to the sender)
		const changed: Record<string, unknown> = {};
		const orig: Record<string, unknown> = {
			hostname: device.hostname || '', ip: device.ip || '', vendor: device.vendor || '',
			model: device.model || '', serialNumber: device.serialNumber || '', primaryMac: device.primaryMac || '',
			firmwareVersion: device.firmwareVersion || '', type: device.type || 'switch',
			assetTag: device.assetTag || '', comment: device.comment || '', location: device.location || ''
		};
		const live = getLiveEdit(device.id);
		for (const [k, v] of Object.entries(fields)) {
			if (v !== orig[k] && !(live && k in live && v === live[k])) changed[k] = v;
		}
		if (Object.keys(changed).length === 0) return;
		clearTimeout(debounceTimer);
		debounceTimer = setTimeout(() => {
			ws?.sendEditing(device.id, changed);
		}, 150);
	});

	function closeModal() {
		ws?.sendEditingStop(device.id);
		onclose();
	}

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		await fetch(`/api/devices/${device.id}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				hostname: hostname || null,
				ip: ip || null,
				vendor: vendor || null,
				model: model || null,
				serialNumber: serialNumber || null,
				primaryMac: primaryMac || null,
				firmwareVersion: firmwareVersion || null,
				type,
				assetTag: assetTag || null,
				comment: comment || null,
				location: location || null
			})
		});
		closeModal();
		onsave();
	}

	const deviceTypes: Array<{ value: DeviceType; label: string }> = [
		{ value: 'router', label: 'Router' },
		{ value: 'switch', label: 'Switch' },
		{ value: 'access-point', label: 'Access Point' },
		{ value: 'end-device', label: 'End Device' },
		{ value: 'server', label: 'Server' }
	];

	const inputClass = 'mt-1 block w-full rounded bg-slate-800 border border-slate-600 px-3 py-1.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500';
</script>

<Modal {open} title="Edit Device" onclose={closeModal}>
	<form onsubmit={handleSubmit} class="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
		<label class="block">
			<span class="text-xs text-slate-400">Hostname</span>
			<input type="text" bind:value={hostname} class={inputClass} />
		</label>
		<div class="grid grid-cols-2 gap-3">
			<label class="block">
				<span class="text-xs text-slate-400">Type</span>
				<select bind:value={type} class={inputClass}>
					{#each deviceTypes as dt}
						<option value={dt.value}>{dt.label}</option>
					{/each}
				</select>
			</label>
			<label class="block">
				<span class="text-xs text-slate-400">IP Address</span>
				<input type="text" bind:value={ip} class={inputClass} placeholder="192.168.1.1" />
			</label>
		</div>
		<div class="grid grid-cols-2 gap-3">
			<label class="block">
				<span class="text-xs text-slate-400">Vendor</span>
				<input type="text" bind:value={vendor} class={inputClass} />
			</label>
			<label class="block">
				<span class="text-xs text-slate-400">Model</span>
				<input type="text" bind:value={model} class={inputClass} />
			</label>
		</div>
		<div class="grid grid-cols-2 gap-3">
			<label class="block">
				<span class="text-xs text-slate-400">Serial Number</span>
				<input type="text" bind:value={serialNumber} class={inputClass} />
			</label>
			<label class="block">
				<span class="text-xs text-slate-400">MAC Address</span>
				<input type="text" bind:value={primaryMac} class={inputClass} />
			</label>
		</div>
		<div class="grid grid-cols-2 gap-3">
			<label class="block">
				<span class="text-xs text-slate-400">Firmware Version</span>
				<input type="text" bind:value={firmwareVersion} class={inputClass} />
			</label>
			<label class="block">
				<span class="text-xs text-slate-400">Asset Tag</span>
				<input type="text" bind:value={assetTag} class={inputClass} />
			</label>
		</div>
		<label class="block">
			<span class="text-xs text-slate-400">Location</span>
			<input type="text" bind:value={location} class={inputClass} />
		</label>
		<label class="block">
			<span class="text-xs text-slate-400">Comment</span>
			<textarea bind:value={comment} rows="2" class={inputClass}></textarea>
		</label>
		<div class="flex justify-end gap-2 pt-2">
			<button
				type="button"
				onclick={closeModal}
				class="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
			>
				Cancel
			</button>
			<button
				type="submit"
				class="px-4 py-2 text-sm bg-cyan-600 hover:bg-cyan-500 text-white rounded transition-colors"
			>
				Save
			</button>
		</div>
	</form>
</Modal>

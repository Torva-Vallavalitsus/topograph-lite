<script lang="ts">
	import Modal from './ui/Modal.svelte';
	import type { TopologyDevice, DeviceType } from '$lib/types';

	interface Props {
		open: boolean;
		device: TopologyDevice;
		onclose: () => void;
		onsave: () => void;
	}

	let { open, device, onclose, onsave }: Props = $props();

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
		onclose();
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

<Modal {open} title="Edit Device" onclose={onclose}>
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
				onclick={onclose}
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

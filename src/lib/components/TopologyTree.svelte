<script lang="ts">
	import type { TopologyDevice, TopologyInterface } from '$lib/types';
	import DeviceNode from './DeviceNode.svelte';

	interface Props {
		devices: TopologyDevice[];
		topologyId: string;
		onrefresh: () => void;
		expandGen: number;
		collapseGen: number;
		filter: string;
	}

	let { devices, topologyId, onrefresh, expandGen, collapseGen, filter }: Props = $props();

	function deviceMatches(device: TopologyDevice, f: string): boolean {
		return [
			device.hostname, device.ip, device.vendor, device.model,
			device.serialNumber, device.firmwareVersion, device.primaryMac,
			device.type, device.assetTag, device.comment, device.location,
			device.uplinkInterfaceName
		].some(v => v?.toLowerCase().includes(f));
	}

	function filterDevice(device: TopologyDevice, f: string): TopologyDevice | null {
		const selfMatches = deviceMatches(device, f);

		const filteredInterfaces: TopologyInterface[] = [];
		for (const iface of device.interfaces) {
			if (!iface.childDevice) continue;
			const filteredChild = filterDevice(iface.childDevice, f);
			if (filteredChild) {
				filteredInterfaces.push({ ...iface, childDevice: filteredChild });
			}
		}

		if (selfMatches || filteredInterfaces.length > 0) {
			return { ...device, interfaces: filteredInterfaces };
		}

		return null;
	}

	const filteredDevices = $derived.by(() => {
		const f = filter.trim().toLowerCase();
		if (!f) return devices;
		return devices
			.map(d => filterDevice(d, f))
			.filter((d): d is TopologyDevice => d !== null);
	});
</script>

<div class="flex flex-col gap-4 p-4">
	{#each filteredDevices as device (device.id)}
		<DeviceNode {device} {topologyId} {onrefresh} {expandGen} {collapseGen} {filter} />
	{/each}
	{#if filter && filteredDevices.length === 0}
		<p class="text-slate-500 text-sm px-4">No devices match "{filter}"</p>
	{/if}
</div>

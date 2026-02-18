<script lang="ts">
	import type { TopologyDevice } from '$lib/types';
	import { getLiveEdit } from '$lib/live-edits.svelte';

	interface Props {
		device: TopologyDevice;
		onclick: () => void;
		filter: string;
	}

	let { device, onclick, filter }: Props = $props();

	const live = $derived(getLiveEdit(device.id));
	const d = $derived({
		hostname: (live?.hostname as string | undefined) ?? device.hostname,
		ip: (live?.ip as string | undefined) ?? device.ip,
		vendor: (live?.vendor as string | undefined) ?? device.vendor,
		model: (live?.model as string | undefined) ?? device.model,
		serialNumber: (live?.serialNumber as string | undefined) ?? device.serialNumber,
		primaryMac: (live?.primaryMac as string | undefined) ?? device.primaryMac,
		firmwareVersion: (live?.firmwareVersion as string | undefined) ?? device.firmwareVersion,
		type: (live?.type as string | undefined) ?? device.type,
		assetTag: (live?.assetTag as string | undefined) ?? device.assetTag,
		comment: (live?.comment as string | undefined) ?? device.comment,
		location: (live?.location as string | undefined) ?? device.location
	});

	const typeConfig: Record<string, { label: string; classes: string }> = {
		router: { label: 'Router', classes: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
		switch: { label: 'Switch', classes: 'bg-violet-500/20 text-violet-400 border-violet-500/30' },
		'access-point': { label: 'AP', classes: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
		'end-device': { label: 'End Device', classes: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
		server: { label: 'Server', classes: 'bg-amber-500/20 text-amber-400 border-amber-500/30' }
	};

	const config = $derived(typeConfig[d.type || 'switch'] || typeConfig['switch']);

	// Check which fields have unsaved live edits
	function isLiveField(field: string): boolean {
		return live != null && field in live;
	}

	const lbl = 'text-slate-500';
	const val = 'text-slate-400';
	const mono = 'text-slate-400 font-mono';
	const sep = 'text-slate-600';
	const empty = 'text-red-500/60';
	const liveVal = 'text-yellow-400';
	const liveMono = 'text-yellow-400 font-mono';
	const liveBold = 'text-sm font-semibold text-yellow-300';

	function hl(text: string): { before: string; match: string; after: string } | null {
		if (!filter) return null;
		const f = filter.trim().toLowerCase();
		if (!f) return null;
		const idx = text.toLowerCase().indexOf(f);
		if (idx < 0) return null;
		return {
			before: text.slice(0, idx),
			match: text.slice(idx, idx + f.length),
			after: text.slice(idx + f.length)
		};
	}
</script>

{#snippet highlight(text: string)}
	{@const parts = hl(text)}
	{#if parts}
		{parts.before}<mark class="bg-amber-500/40 text-amber-200 rounded-sm px-px">{parts.match}</mark>{parts.after}
	{:else}
		{text}
	{/if}
{/snippet}

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	onclick={onclick}
	onkeydown={(e) => e.key === 'Enter' && onclick()}
	role="button"
	tabindex="0"
	class="bg-slate-900 border rounded-lg px-2.5 py-1.5 text-left hover:border-slate-500 transition-colors cursor-pointer {live ? 'border-cyan-500/50 shadow-[0_0_6px_rgba(6,182,212,0.15)]' : 'border-slate-700'}"
>
	<div class="flex items-center gap-1.5 flex-wrap text-[11px]">
		<span class="inline-flex items-center px-1.5 py-0.5 rounded border text-[10px] font-medium {config.classes}">
			{config.label}
		</span>
		{#if d.location}
			<span class="inline-flex items-center px-1.5 py-0.5 rounded border text-[10px] font-medium {isLiveField('location') ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'}">
				{@render highlight(d.location)}
			</span>
		{:else}
			<span class="inline-flex items-center px-1.5 py-0.5 rounded border text-[10px] font-medium bg-red-500/10 text-red-400/60 border-red-500/20">
				Loc?
			</span>
		{/if}
		<span class={isLiveField('hostname') ? liveBold : 'text-sm font-semibold text-slate-100'}>
			{@render highlight(d.hostname || 'Unnamed')}
		</span>
		<span class={sep}>|</span><span class={isLiveField('vendor') ? liveVal : (d.vendor ? lbl : empty)}>{@render highlight(d.vendor || 'Vendor?')}</span>
		<span class={sep}>|</span><span class={isLiveField('model') ? liveVal : (d.model ? val : empty)}>{@render highlight(d.model || 'Model?')}</span>
		<span class={sep}>|</span><span class={isLiveField('ip') ? liveMono : (d.ip ? mono : empty)}>{@render highlight(d.ip || 'IP?')}</span>
		<span class={sep}>|</span><span class={isLiveField('firmwareVersion') ? liveVal : (d.firmwareVersion ? val : empty)}>{@render highlight(d.firmwareVersion || 'FW?')}</span>
		<span class={sep}>|</span><span class="{lbl}">SN:</span><span class={isLiveField('serialNumber') ? liveMono : (d.serialNumber ? mono : empty)}>{@render highlight(d.serialNumber || '?')}</span>
		<span class={sep}>|</span><span class={isLiveField('primaryMac') ? liveMono : (d.primaryMac ? mono : empty)}>{@render highlight(d.primaryMac || 'MAC?')}</span>
		<span class={sep}>|</span><span class="{lbl}">AT:</span><span class={isLiveField('assetTag') ? liveVal : (d.assetTag ? val : empty)}>{@render highlight(d.assetTag || '?')}</span>
		{#if d.comment}<span class={sep}>|</span><span class={isLiveField('comment') ? 'text-yellow-400 italic' : 'text-slate-500 italic'}>{@render highlight(d.comment)}</span>{/if}
	</div>
</div>

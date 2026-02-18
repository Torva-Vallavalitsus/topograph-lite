<script lang="ts">
	import type { TopologyDevice } from '$lib/types';

	interface Props {
		device: TopologyDevice;
		onclick: () => void;
		filter: string;
	}

	let { device, onclick, filter }: Props = $props();

	const typeConfig: Record<string, { label: string; classes: string }> = {
		router: { label: 'Router', classes: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
		switch: { label: 'Switch', classes: 'bg-violet-500/20 text-violet-400 border-violet-500/30' },
		'access-point': { label: 'AP', classes: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
		'end-device': { label: 'End Device', classes: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
		server: { label: 'Server', classes: 'bg-amber-500/20 text-amber-400 border-amber-500/30' }
	};

	const config = $derived(typeConfig[device.type || 'switch'] || typeConfig['switch']);

	const lbl = 'text-slate-500';
	const val = 'text-slate-400';
	const mono = 'text-slate-400 font-mono';
	const sep = 'text-slate-600';
	const empty = 'text-red-500/60';

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
	class="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-left hover:border-slate-500 transition-colors cursor-pointer"
>
	<div class="flex items-center gap-1.5 flex-wrap text-[11px]">
		<span class="inline-flex items-center px-1.5 py-0.5 rounded border text-[10px] font-medium {config.classes}">
			{config.label}
		</span>
		{#if device.location}
			<span class="inline-flex items-center px-1.5 py-0.5 rounded border text-[10px] font-medium bg-amber-500/20 text-amber-400 border-amber-500/30">
				{@render highlight(device.location)}
			</span>
		{:else}
			<span class="inline-flex items-center px-1.5 py-0.5 rounded border text-[10px] font-medium bg-red-500/10 text-red-400/60 border-red-500/20">
				Loc?
			</span>
		{/if}
		<span class="text-sm font-semibold text-slate-100">
			{@render highlight(device.hostname || 'Unnamed')}
		</span>
		<span class={sep}>|</span><span class={device.vendor ? lbl : empty}>{@render highlight(device.vendor || 'Vendor?')}</span>
		<span class={sep}>|</span><span class={device.model ? val : empty}>{@render highlight(device.model || 'Model?')}</span>
		<span class={sep}>|</span><span class={device.ip ? mono : empty}>{@render highlight(device.ip || 'IP?')}</span>
		<span class={sep}>|</span><span class={device.firmwareVersion ? val : empty}>{@render highlight(device.firmwareVersion || 'FW?')}</span>
		<span class={sep}>|</span><span class="{lbl}">SN:</span><span class={device.serialNumber ? mono : empty}>{@render highlight(device.serialNumber || '?')}</span>
		<span class={sep}>|</span><span class={device.primaryMac ? mono : empty}>{@render highlight(device.primaryMac || 'MAC?')}</span>
		<span class={sep}>|</span><span class="{lbl}">AT:</span><span class={device.assetTag ? val : empty}>{@render highlight(device.assetTag || '?')}</span>
		{#if device.comment}<span class={sep}>|</span><span class="text-slate-500 italic">{@render highlight(device.comment)}</span>{/if}
	</div>
</div>

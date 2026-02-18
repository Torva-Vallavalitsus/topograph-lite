<script lang="ts">
	interface Props {
		variant?: 'default' | 'firmware' | 'serial' | 'ip' | 'mac';
		label?: string;
	}

	let { variant = 'default', label, children }: Props & { children: any } = $props();

	const variantClasses: Record<string, string> = {
		default: 'bg-slate-800 text-slate-400 border-slate-600',
		firmware: 'bg-cyan-900/30 text-cyan-400 border-cyan-600/50',
		serial: 'bg-slate-800 text-slate-400 border-slate-600',
		ip: 'bg-slate-800 text-slate-500 font-mono border-slate-700',
		mac: 'bg-slate-800 text-slate-500 font-mono border-slate-700'
	};
</script>

<span class="inline-flex items-center rounded border text-xs {variantClasses[variant]}">
	{#if label}
		<span class="px-1.5 py-0.5 border-r border-inherit text-slate-500">{label}</span>
	{/if}
	<span class="px-1.5 py-0.5">
		{@render children()}
	</span>
</span>

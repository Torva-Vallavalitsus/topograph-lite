<script lang="ts">
	import type { Topology } from '$lib/types';

	interface Props {
		topology: Topology;
		ondelete: (id: string) => void;
	}

	let { topology, ondelete }: Props = $props();
	let confirmDelete = $state(false);

	function formatDate(iso: string | null) {
		if (!iso) return '—';
		return new Date(iso).toLocaleDateString('et-EE', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<div class="bg-slate-900 border border-slate-700 rounded-lg p-4 hover:border-slate-600 transition-colors group">
	<div class="flex items-start justify-between">
		<a href="/topology/{topology.id}" class="flex-1 min-w-0">
			<h3 class="text-lg font-semibold text-slate-100 truncate group-hover:text-cyan-400 transition-colors">
				{topology.name}
			</h3>
			<div class="mt-1 flex items-center gap-3 text-sm text-slate-500">
				<span>{topology.deviceCount} device{topology.deviceCount !== 1 ? 's' : ''}</span>
				<span>Updated {formatDate(topology.updatedAt)}</span>
			</div>
		</a>
		<div class="ml-2">
			{#if confirmDelete}
				<div class="flex items-center gap-1">
					<button
						onclick={() => ondelete(topology.id)}
						class="px-2 py-1 text-xs bg-red-600 hover:bg-red-500 text-white rounded transition-colors"
					>
						Confirm
					</button>
					<button
						onclick={() => (confirmDelete = false)}
						class="px-2 py-1 text-xs text-slate-400 hover:text-slate-200 transition-colors"
					>
						Cancel
					</button>
				</div>
			{:else}
				<button
					onclick={() => (confirmDelete = true)}
					class="p-1 text-slate-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
					title="Delete topology"
				>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
					</svg>
				</button>
			{/if}
		</div>
	</div>
</div>

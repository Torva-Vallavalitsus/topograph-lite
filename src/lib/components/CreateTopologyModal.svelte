<script lang="ts">
	import Modal from './ui/Modal.svelte';

	interface Props {
		open: boolean;
		onclose: () => void;
		oncreate: (name: string) => void;
	}

	let { open, onclose, oncreate }: Props = $props();
	let name = $state('');

	function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (name.trim()) {
			oncreate(name.trim());
			name = '';
		}
	}
</script>

<Modal {open} title="New Topology" {onclose}>
	<form onsubmit={handleSubmit}>
		<label class="block mb-4">
			<span class="text-sm text-slate-400">Topology name</span>
			<input
				type="text"
				bind:value={name}
				class="mt-1 block w-full rounded bg-slate-800 border border-slate-600 px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
				placeholder="e.g., Tõrva Gümnaasium"
				autofocus
			/>
		</label>
		<div class="flex justify-end gap-2">
			<button
				type="button"
				onclick={onclose}
				class="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
			>
				Cancel
			</button>
			<button
				type="submit"
				disabled={!name.trim()}
				class="px-4 py-2 text-sm bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded transition-colors"
			>
				Create
			</button>
		</div>
	</form>
</Modal>

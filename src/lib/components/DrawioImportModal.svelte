<script lang="ts">
	import Modal from './ui/Modal.svelte';

	interface Props {
		open: boolean;
		onclose: () => void;
		onimport: (xml: string, name: string) => void;
	}

	let { open, onclose, onimport }: Props = $props();
	let name = $state('');
	let fileContent = $state('');
	let fileName = $state('');

	function handleFile(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		fileName = file.name;
		if (!name) {
			name = file.name.replace(/\.drawio\.xml$/i, '').replace(/\.drawio$/i, '').replace(/\.xml$/i, '');
		}

		const reader = new FileReader();
		reader.onload = () => {
			fileContent = reader.result as string;
		};
		reader.readAsText(file);
	}

	function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (fileContent && name.trim()) {
			onimport(fileContent, name.trim());
			name = '';
			fileContent = '';
			fileName = '';
		}
	}
</script>

<Modal {open} title="Import from draw.io" {onclose}>
	<form onsubmit={handleSubmit}>
		<label class="block mb-4">
			<span class="text-sm text-slate-400">Topology name</span>
			<input
				type="text"
				bind:value={name}
				class="mt-1 block w-full rounded bg-slate-800 border border-slate-600 px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
				placeholder="e.g., Tõrva Gümnaasium"
			/>
		</label>
		<label class="block mb-4">
			<span class="text-sm text-slate-400">draw.io XML file</span>
			<div class="mt-1 flex items-center gap-2">
				<label class="cursor-pointer px-4 py-2 text-sm bg-slate-800 border border-slate-600 rounded hover:border-slate-500 text-slate-300 transition-colors">
					Choose file
					<input type="file" accept=".xml,.drawio" onchange={handleFile} class="hidden" />
				</label>
				{#if fileName}
					<span class="text-sm text-slate-400">{fileName}</span>
				{/if}
			</div>
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
				disabled={!fileContent || !name.trim()}
				class="px-4 py-2 text-sm bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded transition-colors"
			>
				Import
			</button>
		</div>
	</form>
</Modal>

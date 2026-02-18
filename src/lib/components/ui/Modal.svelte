<script lang="ts">
	interface Props {
		open: boolean;
		title: string;
		onclose: () => void;
	}

	let { open, title, onclose, children }: Props & { children: any } = $props();

	let pointerDownTarget: EventTarget | null = null;

	function handlePointerDown(e: PointerEvent) {
		if (e.button !== 0) return;
		pointerDownTarget = e.target;
	}

	function handlePointerUp(e: PointerEvent) {
		if (e.button !== 0) return;
		if (e.target === e.currentTarget && pointerDownTarget === e.currentTarget) {
			onclose();
		}
		pointerDownTarget = null;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			onclose();
		}
	}
</script>

{#if open}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
		onpointerdown={handlePointerDown}
		onpointerup={handlePointerUp}
		onkeydown={handleKeydown}
	>
		<div class="bg-slate-900 border border-slate-700 rounded-lg shadow-xl w-full max-w-md mx-4">
			<div class="flex items-center justify-between p-4 border-b border-slate-700">
				<h2 class="text-lg font-semibold text-slate-100">{title}</h2>
				<button
					onclick={onclose}
					class="text-slate-400 hover:text-slate-200 transition-colors"
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>
			<div class="p-4">
				{@render children()}
			</div>
		</div>
	</div>
{/if}

import { setLiveEdit, clearLiveEdit, clearAllLiveEdits } from './live-edits.svelte';

const MAX_RECONNECT_DELAY = 30_000;

export interface TopologyWs {
	sendEditing(deviceId: string, fields: Record<string, unknown>): void;
	sendEditingStop(deviceId: string): void;
	destroy(): void;
}

export function connectToTopology(topologyId: string, onRefresh: () => void): TopologyWs {
	let ws: WebSocket | null = null;
	let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
	let reconnectDelay = 1000;
	let destroyed = false;

	function connect() {
		if (destroyed) return;
		try {
			const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
			const url = `${protocol}//${location.host}/ws?topologyId=${topologyId}`;
			const socket = new WebSocket(url);

			socket.onopen = () => {
				ws = socket;
				reconnectDelay = 1000;
			};

			socket.onmessage = (event) => {
				try {
					const data = JSON.parse(event.data);
					if (data.type === 'refresh') {
						clearAllLiveEdits();
						onRefresh();
					} else if (data.type === 'editing') {
						setLiveEdit(data.deviceId, data.fields);
					} else if (data.type === 'editing-stop') {
						clearLiveEdit(data.deviceId);
					}
				} catch {
					// ignore
				}
			};

			socket.onclose = () => {
				ws = null;
				scheduleReconnect();
			};

			socket.onerror = () => {
				socket.close();
			};
		} catch {
			scheduleReconnect();
		}
	}

	function scheduleReconnect() {
		if (destroyed || reconnectTimer) return;
		reconnectTimer = setTimeout(() => {
			reconnectTimer = null;
			reconnectDelay = Math.min(reconnectDelay * 2, MAX_RECONNECT_DELAY);
			connect();
		}, reconnectDelay);
	}

	connect();

	return {
		sendEditing(deviceId, fields) {
			ws?.send(JSON.stringify({ type: 'editing', deviceId, fields }));
		},
		sendEditingStop(deviceId) {
			ws?.send(JSON.stringify({ type: 'editing-stop', deviceId }));
		},
		destroy() {
			destroyed = true;
			if (reconnectTimer) clearTimeout(reconnectTimer);
			ws?.close();
			ws = null;
		}
	};
}

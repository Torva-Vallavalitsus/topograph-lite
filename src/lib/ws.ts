import { setLiveEdit, clearLiveEdit, clearAllLiveEdits } from './live-edits.svelte';

interface WsConnection {
	send(data: string): void;
	close(): void;
}

let ws: WsConnection | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let reconnectDelay = 1000;
const MAX_RECONNECT_DELAY = 30_000;

export function connectToTopology(topologyId: string, onRefresh: () => void): () => void {
	function connect() {
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
		if (reconnectTimer) return;
		reconnectTimer = setTimeout(() => {
			reconnectTimer = null;
			reconnectDelay = Math.min(reconnectDelay * 2, MAX_RECONNECT_DELAY);
			connect();
		}, reconnectDelay);
	}

	connect();

	return () => {
		if (reconnectTimer) {
			clearTimeout(reconnectTimer);
			reconnectTimer = null;
		}
		ws?.close();
		ws = null;
	};
}

export function sendEditing(deviceId: string, fields: Record<string, unknown>) {
	ws?.send(JSON.stringify({ type: 'editing', deviceId, fields }));
}

export function sendEditingStop(deviceId: string) {
	ws?.send(JSON.stringify({ type: 'editing-stop', deviceId }));
}

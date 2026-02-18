import type { Handle } from '@sveltejs/kit';
import { setServer } from '$lib/server/ws';

let serverCaptured = false;

export const handle: Handle = async ({ event, resolve }) => {
	if (!serverCaptured && event.platform?.server) {
		setServer(event.platform.server);
		serverCaptured = true;
	}

	const { request } = event;
	const url = new URL(request.url);

	if (
		request.headers.get('connection')?.toLowerCase().includes('upgrade') &&
		request.headers.get('upgrade')?.toLowerCase() === 'websocket' &&
		url.pathname === '/ws'
	) {
		const topologyId = url.searchParams.get('topologyId') || '';
		event.platform.server.upgrade(event.platform.request, {
			data: { topologyId }
		});
		return new Response(null, { status: 101 });
	}

	return resolve(event);
};

interface WsData {
	topologyId: string;
}

export const websocket = {
	open(ws: { subscribe(topic: string): void; data: WsData }) {
		const { topologyId } = ws.data;
		if (topologyId) {
			ws.subscribe(`topology:${topologyId}`);
		}
	},

	message(ws: { data: WsData; publish(topic: string, data: string): void }, message: string | ArrayBuffer) {
		const text = typeof message === 'string' ? message : new TextDecoder().decode(message);
		if (text.length > 10_000) return;
		try {
			const data = JSON.parse(text);
			if (typeof data.deviceId !== 'string') return;
			if (data.type === 'editing') {
				if (!data.fields || typeof data.fields !== 'object' || Array.isArray(data.fields)) return;
				if (Object.keys(data.fields).length > 20) return;
				const { topologyId } = ws.data;
				if (topologyId) ws.publish(`topology:${topologyId}`, text);
			} else if (data.type === 'editing-stop') {
				const { topologyId } = ws.data;
				if (topologyId) ws.publish(`topology:${topologyId}`, text);
			}
		} catch {
			// ignore malformed messages
		}
	},

	close() {
		// Bun auto-unsubscribes
	}
};

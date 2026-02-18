let server: { publish(topic: string, data: string): void } | null = null;

export function setServer(s: typeof server) {
	server = s;
}

export function notifyTopologyChanged(topologyId: string) {
	server?.publish(`topology:${topologyId}`, JSON.stringify({ type: 'refresh' }));
}

export type DeviceType = 'router' | 'switch' | 'access-point' | 'end-device' | 'server';

export interface TopologyInterface {
	id: string;
	deviceId: string;
	name: string;
	comment: string | null;
	sortOrder: number | null;
	createdAt: string | null;
	childDevice?: TopologyDevice;
}

export interface TopologyDevice {
	id: string;
	topologyId: string;
	parentInterfaceId: string | null;
	hostname: string | null;
	ip: string | null;
	vendor: string | null;
	model: string | null;
	serialNumber: string | null;
	firmwareVersion: string | null;
	primaryMac: string | null;
	type: DeviceType | null;
	uplinkInterfaceName: string | null;
	assetTag: string | null;
	comment: string | null;
	location: string | null;
	sortOrder: number | null;
	createdAt: string | null;
	updatedAt: string | null;
	interfaces: TopologyInterface[];
}

export interface Topology {
	id: string;
	name: string;
	deviceCount: number;
	createdAt: string | null;
	updatedAt: string | null;
}

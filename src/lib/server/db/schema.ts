import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const topologies = sqliteTable('topologies', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	createdAt: text('created_at'),
	updatedAt: text('updated_at')
});

export const devices = sqliteTable('devices', {
	id: text('id').primaryKey(),
	topologyId: text('topology_id')
		.notNull()
		.references(() => topologies.id, { onDelete: 'cascade' }),
	parentInterfaceId: text('parent_interface_id').references(() => interfaces.id, {
		onDelete: 'set null'
	}),
	hostname: text('hostname'),
	ip: text('ip'),
	vendor: text('vendor'),
	model: text('model'),
	serialNumber: text('serial_number'),
	firmwareVersion: text('firmware_version'),
	primaryMac: text('primary_mac'),
	type: text('type', {
		enum: ['router', 'switch', 'access-point', 'end-device', 'server']
	}).default('switch'),
	uplinkInterfaceName: text('uplink_interface_name'),
	assetTag: text('asset_tag'),
	comment: text('comment'),
	location: text('location'),
	sortOrder: integer('sort_order').default(0),
	createdAt: text('created_at'),
	updatedAt: text('updated_at')
});

export const interfaces = sqliteTable('interfaces', {
	id: text('id').primaryKey(),
	deviceId: text('device_id')
		.notNull()
		.references(() => devices.id, { onDelete: 'cascade' }),
	name: text('name').notNull(),
	comment: text('comment'),
	sortOrder: integer('sort_order').default(0),
	createdAt: text('created_at')
});

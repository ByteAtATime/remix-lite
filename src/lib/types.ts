export interface DevDoc {
	kind: 'dev';

	version: string | number;

	title?: string;

	author?: string;

	details?: string;

	methods: Record<string, DevMethodDoc>;

	stateVariables?: Record<string, DevStateVariableDoc>;

	events?: Record<string, DevEventDoc>;

	errors?: Record<string, DevErrorDoc[]>;

	[key: `custom:${string}`]: unknown;
}

export interface DevMethodDoc {
	details?: string;

	params?: Record<string, string>;

	returns?: Record<string, string>;

	[key: `custom:${string}`]: unknown;
}

export interface DevStateVariableDoc {
	details?: string;

	return?: string;

	[key: `custom:${string}`]: unknown;
}

export interface DevEventDoc {
	details?: string;

	params?: Record<string, string>;

	returns?: Record<string, string>;

	[key: `custom:${string}`]: unknown;
}

export interface DevErrorDoc {
	details?: string;

	params?: Record<string, string>;

	[key: `custom:${string}`]: unknown;
}

export interface UserDoc {
	kind: 'user';
	version: string | number;
	notice?: string;
	methods: Record<string, UserItemDoc>;
	events?: Record<string, UserItemDoc>;
	errors?: Record<string, UserItemDoc[]>;
}

export interface UserItemDoc {
	notice: string;
}

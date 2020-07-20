import { union } from 'lodash';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function serializable<T>(obj: any) {
	if (typeof obj !== 'object') {
		return obj as T;
	}
	let serializableObj = obj;
	const ownPropertyNames = Object.getOwnPropertyNames(obj);
	const prototypeOwnPropertyNames = Object.getOwnPropertyNames(Object.getPrototypeOf(obj));
	const keys = union(ownPropertyNames, prototypeOwnPropertyNames).sort();
	if (keys.length) {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		serializableObj = keys.reduce((o, key) => ({ ...o, [key]: (obj as any)[key] }), {}) as T;
	}
	return JSON.parse(JSON.stringify(serializableObj)) as T;
}

import produce from 'immer';
import { isEmpty } from 'lodash';
import { fromFetch } from 'rxjs/fetch';
import { switchMap } from 'rxjs/operators';
import { serializable } from './utils';

type HttpConfig = {
	body?: object | string;
	headers: { [key: string]: string };
	query?: string;
	url?: string;
};

export class Http {
	private configuration: HttpConfig = { headers: {} };

	constructor(config: HttpConfig) {
		this.configuration = config;
	}

	bearer(token?: string) {
		if (!token) {
			return this;
		}
		const config = produce(this.configuration, draft => {
			draft.headers['Authorization'] = `Bearer ${token}`;
		});
		return new Http(config);
	}

	body(content: object | string) {
		const config = { ...this.configuration, body: content };
		return new Http(config);
	}

	contentType(type: string) {
		const config = produce(this.configuration, draft => {
			draft.headers['Content-Type'] = type;
		});
		return new Http(config);
	}

	get<T>() {
		const headers = isEmpty(this.configuration.headers) ? undefined : this.configuration.headers;
		return httpRequest<T>(this.getFullUrl(), { headers, method: 'GET' });
	}

	header(name: string, value: string) {
		const config = produce(this.configuration, draft => {
			draft.headers[name] = value;
		});
		return new Http(config);
	}

	post<T>() {
		return this.putOrPost<T>('POST');
	}

	put<T>() {
		return this.putOrPost<T>('PUT');
	}

	query(query: URLSearchParams | { [key: string]: string | string[] | boolean | number } | string) {
		const config = produce(this.configuration, draft => {
			if (query instanceof URLSearchParams) {
				draft.query = (query as URLSearchParams).toString();
			} else if (typeof query === 'string') {
				draft.query = query;
			} else {
				const params = new URLSearchParams();
				Object.keys(query).forEach(key => {
					if (Array.isArray(query[key])) {
						(query[key] as string[]).forEach(param => {
							params.append(key, param);
						});
					} else {
						params.append(key, query[key] as string);
					}
				});
				draft.query = params.toString();
			}
		});
		return new Http(config);
	}

	url(url: string) {
		const config = { ...this.configuration, url };
		return new Http(config);
	}

	/**
	 * Private functions
	 */

	private getFullUrl() {
		let { url = '' } = this.configuration;
		if (this.configuration.query) {
			url += url.indexOf('?') < 0 ? '?' : '&';
			url += this.configuration.query;
		}
		return url;
	}

	private putOrPost<T>(method: 'PUT' | 'POST') {
		const headers = isEmpty(this.configuration.headers) ? {} : { ...this.configuration.headers };
		if (!headers['Content-Type']) {
			headers['Content-Type'] = 'application/json';
		}
		let body = '';
		if (this.configuration.body && typeof this.configuration.body === 'object') {
			if (headers['Content-Type'] === 'application/x-www-form-urlencoded') {
				const encoded = new URLSearchParams();
				Object.keys(this.configuration.body).forEach(key =>
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					encoded.append(key, (this.configuration.body as any)[key])
				);
				body = encoded.toString();
			} else {
				body = JSON.stringify(this.configuration.body);
			}
		} else if (this.configuration.body && typeof this.configuration.body === 'string') {
			body = this.configuration.body;
		}
		return httpRequest<T>(this.getFullUrl(), { body, headers, method });
	}
}

export function http(url: string) {
	return new Http({ headers: {}, url });
}

/**
 * HTTP functions using fromFetch
 */

function httpRequest<T>(url: string, options?: RequestInit) {
	return fromFetch(url, options).pipe(
		switchMap(async response => {
			if (!response.ok) {
				let error: Error | undefined;
				try {
					const body = await response.text();
					/* eslint-disable @typescript-eslint/no-explicit-any */
					const err = new Error(body) as any;
					const serialized = serializable<any>(response);
					/* eslint-enable */
					Object.keys(serialized).forEach(key => {
						err[key] = serialized[key];
					});
					err.body = body;
					error = err;
				} catch {
					// Error parsing response, so we'll just throw the whole thing
					throw response;
				}
				if (error) {
					// We were able to extract the error details, so we'll throw this
					// error object instead.
					throw error;
				}
			}

			const text = await response.text();
			try {
				const json = JSON.parse(text);
				return json as T;
			} catch {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				return (text as any) as T;
			}
		})
	);
}

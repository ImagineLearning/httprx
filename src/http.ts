import isEmpty from 'lodash-es/isEmpty';
import { fromFetch } from 'rxjs/fetch';
import { switchMap } from 'rxjs/operators';
import { serializable } from './utils';

export class Http {
	private _body?: object | string;
	private _headers: { [key: string]: string } = {};
	private _query?: string;
	private _url?: string;

	constructor(url?: string) {
		this._url = url;
	}

	bearer(token?: string) {
		if (!token) {
			return this;
		}
		this._headers['Authorization'] = `Bearer ${token}`;
		return this;
	}

	body(content: object | string) {
		this._body = content;
		return this;
	}

	contentType(type: string) {
		this._headers['Content-Type'] = type;
		return this;
	}

	get<T>() {
		const headers = isEmpty(this._headers) ? undefined : this._headers;
		return httpRequest<T>(this.getFullUrl(), { headers, method: 'GET' });
	}

	header(name: string, value: string) {
		this._headers[name] = value;
		return this;
	}

	post<T>() {
		return this.putOrPost<T>('POST');
	}

	put<T>() {
		return this.putOrPost<T>('PUT');
	}

	query(query: URLSearchParams | { [key: string]: string | string[] | boolean | number } | string) {
		if (query instanceof URLSearchParams) {
			this._query = (query as URLSearchParams).toString();
		} else if (typeof query === 'string') {
			this._query = query;
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
			this._query = params.toString();
		}
		return this;
	}

	url(url: string) {
		this._url = url;
		return this;
	}

	/**
	 * Private functions
	 */

	private getFullUrl() {
		let url = this._url || '';
		if (this._query) {
			url += url.indexOf('?') < 0 ? '?' : '&';
			url += this._query;
		}
		return url;
	}

	private putOrPost<T>(method: 'PUT' | 'POST') {
		const headers = isEmpty(this._headers) ? {} : this._headers;
		if (!headers['Content-Type']) {
			headers['Content-Type'] = 'application/json';
		}
		let body = '';
		if (this._body && typeof this._body === 'object') {
			if (this._headers['Content-Type'] === 'application/x-www-form-urlencoded') {
				const encoded = new URLSearchParams();
				Object.keys(this._body).forEach(key =>
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					encoded.append(key, (this._body as any)[key])
				);
				body = encoded.toString();
			} else {
				body = JSON.stringify(this._body);
			}
		}
		return httpRequest<T>(this.getFullUrl(), { body, headers, method });
	}
}

export function http(url: string) {
	return new Http(url);
}

/**
 * HTTP functions using fromFetch
 */

function httpRequest<T>(url: string, options?: RequestInit) {
	return fromFetch(url, options).pipe(
		switchMap(async response => {
			if (!response.ok) {
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
					throw err;
				} catch {
					throw response;
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

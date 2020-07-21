import { fromFetch } from 'rxjs/fetch';
import { switchMap } from 'rxjs/operators';

export enum ContentTypes {
	FormData = 'application/x-www-form-urlencoded',
	JSON = 'application/json',
	Text = 'text/plain'
}

type HttpConfig = {
	body?: object | string;
	headers: { [key: string]: string };
	query?: string;
	url?: string;
};

type HttpResponse<T> = {
	data: T;
	headers: { [key: string]: string };
	status: number;
	statusText: string;
	url: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type HttpError = Error & HttpResponse<any>;

export class Http {
	private configuration: HttpConfig = { headers: {} };

	constructor(config: HttpConfig) {
		this.configuration = config;
	}

	bearer(token?: string) {
		if (!token) {
			return this;
		}
		const config = {
			...this.configuration,
			headers: {
				...this.configuration.headers,
				Authorization: `Bearer ${token}`
			}
		};
		return new Http(config);
	}

	body(content: object | string) {
		const config = { ...this.configuration, body: content };
		return new Http(config);
	}

	contentType(type: ContentTypes) {
		const config = {
			...this.configuration,
			headers: {
				...this.configuration.headers,
				'Content-Type': type
			}
		};
		return new Http(config);
	}

	get<T>() {
		const headers = Object.keys(this.configuration.headers).length ? this.configuration.headers : undefined;
		return httpRequest<T>(this.getFullUrl(), { headers, method: 'GET' });
	}

	header(name: string, value: string) {
		const config = {
			...this.configuration,
			headers: {
				...this.configuration.headers,
				[name]: value
			}
		};
		return new Http(config);
	}

	post<T>() {
		return this.putOrPost<T>('POST');
	}

	put<T>() {
		return this.putOrPost<T>('PUT');
	}

	query(query: URLSearchParams | { [key: string]: string | string[] | boolean | number | number[] } | string) {
		let queryString: string;
		if (query instanceof URLSearchParams) {
			queryString = (query as URLSearchParams).toString();
		} else if (typeof query === 'string') {
			queryString = query;
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
			queryString = params.toString();
		}
		const config = {
			...this.configuration,
			query: queryString
		};
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
		const headers = { ...this.configuration.headers };
		if (!headers['Content-Type']) {
			headers['Content-Type'] = ContentTypes.JSON;
		}
		let body = '';
		if (this.configuration.body && typeof this.configuration.body === 'object') {
			if (headers['Content-Type'] === ContentTypes.FormData) {
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

function convertResponse<T>({ headers: respHeaders, status, statusText, url }: Response, data?: T) {
	const headers: { [key: string]: string | number | boolean } = {};
	respHeaders.forEach((value, key) => {
		headers[key] = value;
	});

	return {
		data,
		headers,
		status,
		statusText,
		url
	} as HttpResponse<T>;
}

function httpRequest<T>(url: string, options?: RequestInit) {
	return fromFetch(url, options).pipe(
		switchMap(async response => {
			if (!response.ok) {
				let error: HttpError | undefined;
				try {
					const body = await response.text();
					error = { ...new Error(body), ...convertResponse(response, body) } as HttpError;
				} catch {
					// Error parsing response, so we'll just use what we have
					error = { ...new Error(), ...convertResponse(response) };
				}
				throw error;
			}

			const text = await response.text();
			let data: T;
			try {
				data = JSON.parse(text) as T;
			} catch {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				data = (text as any) as T;
			}
			return convertResponse(response, data);
		})
	);
}

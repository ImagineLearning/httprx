import { throwError } from 'rxjs';
import { fromFetch } from 'rxjs/fetch';
import { catchError, switchMap } from 'rxjs/operators';

export enum ContentTypes {
	Anything = '*/*',
	Bmp = 'image/bmp',
	Css = 'text/css',
	Csv = 'text/csv',
	FormData = 'application/x-www-form-urlencoded',
	Gif = 'image/gif',
	Gzip = 'application/gzip',
	Html = 'text/html',
	Jpeg = 'image/jpeg',
	Json = 'application/json',
	MultipartFormData = 'multipart/form-data',
	OctetStream = 'application/octet-stream',
	Pdf = 'application/pdf',
	Png = 'image/png',
	Svg = 'image/svg+xml',
	Text = 'text/plain',
	Xml = 'application/xml',
	Zip = 'application/zip'
}

export type ErrorTransform<TIn, TOut> = (error: TIn) => TOut;

export type HttpConfig<TError, TTransform> = {
	body?: object | string;
	headers: { [key: string]: string };
	query?: string;
	url?: string;
	errorTransform?: ErrorTransform<TError, TTransform>;
};

export type HttpResponse<T> = {
	data: T;
	headers: { [key: string]: string };
	status: number;
	statusText: string;
	url: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type HttpError = Error & HttpResponse<any>;

export class Http<TError, TTransform> {
	private configuration: HttpConfig<TError, TTransform>;

	constructor(config: HttpConfig<TError, TTransform>) {
		const headers =
			!config.headers.Accept && !config.headers.accept
				? {
						...config.headers,
						Accept: ContentTypes.Json
				  }
				: config.headers;
		this.configuration = { ...config, headers };
	}

	accept(...types: ContentTypes[]) {
		const config = {
			...this.configuration,
			headers: {
				...this.configuration.headers,
				Accept: types.join(', ')
			}
		};
		return new Http(config);
	}

	bearer(token?: string) {
		if (!token) {
			return new Http(this.configuration);
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

	errorTransform<TIn, TOut>(method: ErrorTransform<TIn, TOut>) {
		const config = { ...this.configuration, errorTransform: method };
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

	delete<T>() {
		return this.requestWithBody<T>('DELETE');
	}

	get<T>() {
		return httpRequest<T, TError, TTransform>(
			this.getFullUrl(),
			{ headers: this.configuration.headers, method: 'GET' },
			this.configuration.errorTransform
		);
	}

	head() {
		return httpRequest<undefined, TError, TTransform>(
			this.getFullUrl(),
			{ headers: this.configuration.headers, method: 'HEAD' },
			this.configuration.errorTransform
		);
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

	options<T>() {
		return httpRequest<T, TError, TTransform>(
			this.getFullUrl(),
			{ headers: this.configuration.headers, method: 'OPTIONS' },
			this.configuration.errorTransform
		);
	}

	patch<T>() {
		return this.requestWithBody<T>('PATCH');
	}

	post<T>() {
		return this.requestWithBody<T>('POST');
	}

	put<T>() {
		return this.requestWithBody<T>('PUT');
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

	private requestWithBody<T>(method: 'DELETE' | 'PATCH' | 'POST' | 'PUT') {
		const headers = { ...this.configuration.headers };
		if (!headers['Content-Type']) {
			headers['Content-Type'] = ContentTypes.Json;
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
		return httpRequest<T, TError, TTransform>(this.getFullUrl(), { body, headers, method }, this.configuration.errorTransform);
	}
}

export function http(url?: string) {
	return new Http({ headers: {}, url });
}

/**
 * HTTP functions using fromFetch
 */

function convertResponse<T>({ headers: respHeaders, status, statusText, url }: Response, data?: T) {
	const headers: { [key: string]: string | number | boolean } = {};
	respHeaders?.forEach((value, key) => {
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

function httpRequest<TData, TError, TTransform>(url: string, options?: RequestInit, errorTransform?: ErrorTransform<TError, TTransform>) {
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

			let data: TData;
			const contentTypes = response.headers.get('content-type')?.split(',');
			if (
				contentTypes?.includes(ContentTypes.Bmp) ||
				contentTypes?.includes(ContentTypes.Gif) ||
				contentTypes?.includes(ContentTypes.Jpeg) ||
				contentTypes?.includes(ContentTypes.Pdf) ||
				contentTypes?.includes(ContentTypes.Png) ||
				contentTypes?.includes(ContentTypes.Gzip) ||
				contentTypes?.includes(ContentTypes.OctetStream) ||
				contentTypes?.includes(ContentTypes.Zip)
			) {
				data = ((await response.blob()) as unknown) as TData;
			} else {
				const text = await response.text();
				const isJson = !!text && (text[0] === '{' || text[0] === '[');
				try {
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					data = (isJson ? JSON.parse(text) : (text as any)) as TData;
				} catch {
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					data = (text as any) as TData;
				}
			}
			return convertResponse(response, data);
		}),
		catchError(error => {
			const transformed = errorTransform?.(error) ?? error;
			return throwError(transformed);
		})
	);
}

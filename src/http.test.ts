import fetchMock from 'jest-fetch-mock';
import { ContentTypes, http, Http } from './http';
import { of } from 'rxjs';
import * as Fetch from 'rxjs/fetch';

describe('Http', () => {
	const baseUrl = 'http://example.com';

	beforeEach(() => {
		jest.restoreAllMocks();
		fetchMock.resetMocks();
		fetchMock.once(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' }, status: 200 });
	});

	describe('Http constructor', () => {
		it("automatically sets the Accept header to 'application/json'", done => {
			const http = new Http({ headers: {} });
			http.get().subscribe(() => {
				const [, config] = fetchMock.mock.calls[0];
				expect(config?.headers).toEqual({ Accept: 'application/json' });
				done();
			}, done.fail);
		});

		it('keeps existing Accept header', done => {
			const http = new Http({ headers: { Accept: ContentTypes.Text } });
			http.get().subscribe(() => {
				const [, config] = fetchMock.mock.calls[0];
				expect(config?.headers).toEqual({ Accept: 'text/plain' });
				done();
			}, done.fail);
		});

		it('existing Accept header is case insensitive', done => {
			const http = new Http({ headers: { accept: ContentTypes.Text } });
			http.get().subscribe(() => {
				const [, config] = fetchMock.mock.calls[0];
				expect(config?.headers).toEqual({ accept: 'text/plain' });
				done();
			}, done.fail);
		});
	});

	describe('accept(..)', () => {
		it('sets the Accept header', done => {
			http(baseUrl)
				.accept(ContentTypes.Text)
				.get()
				.subscribe(() => {
					const [, config] = fetchMock.mock.calls[0];
					expect(config?.headers).toEqual({ Accept: 'text/plain' });
					done();
				}, done.fail);
		});

		it('allows multiple values for Accept header', done => {
			http(baseUrl)
				.accept(ContentTypes.Html, ContentTypes.Text, ContentTypes.Anything)
				.get()
				.subscribe(() => {
					const [, config] = fetchMock.mock.calls[0];
					expect(config?.headers).toEqual({ Accept: 'text/html, text/plain, */*' });
					done();
				}, done.fail);
		});

		it("doesn't mutate Http instance", done => {
			const original = http(baseUrl);
			original.accept(ContentTypes.Text);
			original.get().subscribe(() => {
				const [, config] = fetchMock.mock.calls[0];
				expect(config?.headers).toEqual({ Accept: 'application/json' });
				done();
			}, done.fail);
		});
	});

	describe('bearer(..)', () => {
		it('adds header', done => {
			http(baseUrl)
				.bearer('my-token')
				.get()
				.subscribe(() => {
					const [, config] = fetchMock.mock.calls[0];
					expect(config?.headers).toEqual({
						Accept: 'application/json',
						Authorization: 'Bearer my-token'
					});
					done();
				}, done.fail);
		});

		it("doesn't mutate Http instance", done => {
			const original = http(baseUrl);
			original.bearer('my-token');
			original.get().subscribe(() => {
				const [, config] = fetchMock.mock.calls[0];
				expect(config?.headers).toEqual({
					Accept: 'application/json'
				});
				done();
			}, done.fail);
		});

		it('returns new Http instance without additional header if no token specified', done => {
			const http1 = http(baseUrl);
			const http2 = http1.bearer();
			expect(http1).not.toBe(http2);
			http2.get().subscribe(() => {
				const [, config] = fetchMock.mock.calls[0];
				expect(config?.headers).toEqual({
					Accept: 'application/json'
				});
				done();
			}, done.fail);
		});
	});

	describe('body(..)', () => {
		it('sets request body', done => {
			http(baseUrl)
				.body({ hello: 'world' })
				.post()
				.subscribe(() => {
					const [, config] = fetchMock.mock.calls[0];
					expect(config?.body).toBe(JSON.stringify({ hello: 'world' }));
					done();
				}, done.fail);
		});

		it("doesn't mutate Http instance", done => {
			const original = http(baseUrl);
			original.body({ hello: 'world' });
			original.post().subscribe(() => {
				const [, config] = fetchMock.mock.calls[0];
				expect(config?.body).toBe('');
				done();
			}, done.fail);
		});
	});

	describe('contentType(..)', () => {
		it('sets header', done => {
			http(baseUrl)
				.contentType(ContentTypes.Text)
				.post()
				.subscribe(() => {
					const [, config] = fetchMock.mock.calls[0];
					expect(config?.headers).toEqual({ Accept: 'application/json', 'Content-Type': 'text/plain' });
					done();
				}, done.fail);
		});

		it("doesn't mutate Http instance", done => {
			const original = http(baseUrl);
			original.contentType(ContentTypes.Text);
			original.post().subscribe(() => {
				const [, config] = fetchMock.mock.calls[0];
				expect(config?.headers).toEqual({ Accept: 'application/json', 'Content-Type': 'application/json' });
				done();
			}, done.fail);
		});
	});

	describe('errorTransform(..)', () => {
		it('sets the member errorTransformMethod', () => {
			function testTransform(error: any) {
				return error;
			}

			const instance = http(baseUrl).errorTransform(testTransform);
			expect(instance.errorTransformMethod).toEqual(testTransform);
		});
	});

	describe('delete<T>()', () => {
		it('makes a DELETE request', done => {
			http(baseUrl)
				.delete()
				.subscribe(() => {
					const [url, config] = fetchMock.mock.calls[0];
					expect(url).toBe(baseUrl);
					expect(config?.method).toBe('DELETE');
					done();
				}, done.fail);
		});
	});

	describe('get<T>()', () => {
		it('makes a GET request', done => {
			http(baseUrl)
				.get()
				.subscribe(() => {
					const [url, config] = fetchMock.mock.calls[0];
					expect(url).toBe(baseUrl);
					expect(config?.method).toBe('GET');
					done();
				}, done.fail);
		});

		it('includes headers', done => {
			http(baseUrl)
				.header('x-hello', 'world')
				.get()
				.subscribe(() => {
					const [, config] = fetchMock.mock.calls[0];
					expect(config?.headers).toEqual({ Accept: 'application/json', 'x-hello': 'world' });
					done();
				}, done.fail);
		});
	});

	describe('head()', () => {
		it('makes a HEAD request', done => {
			http(baseUrl)
				.head()
				.subscribe(() => {
					const [url, config] = fetchMock.mock.calls[0];
					expect(url).toBe(baseUrl);
					expect(config?.method).toBe('HEAD');
					done();
				}, done.fail);
		});

		it('includes headers', done => {
			http(baseUrl)
				.header('x-hello', 'world')
				.head()
				.subscribe(() => {
					const [, config] = fetchMock.mock.calls[0];
					expect(config?.headers).toEqual({ Accept: 'application/json', 'x-hello': 'world' });
					done();
				}, done.fail);
		});
	});

	describe('header(..)', () => {
		it('adds headers to request', done => {
			http(baseUrl)
				.header('foo', 'bar')
				.header('baz', 'buzz')
				.get()
				.subscribe(() => {
					const [, config] = fetchMock.mock.calls[0];
					expect(config?.headers).toEqual({ Accept: 'application/json', foo: 'bar', baz: 'buzz' });
					done();
				}, done.fail);
		});

		it("doesn't mutate Http instance", done => {
			const original = http(baseUrl);
			original.header('foo', 'bar');
			original.get().subscribe(() => {
				const [, config] = fetchMock.mock.calls[0];
				expect(config?.headers).toEqual({ Accept: 'application/json' });
				done();
			}, done.fail);
		});
	});

	describe('options<T>(..)', () => {
		it('makes an OPTIONS request', done => {
			http(baseUrl)
				.options()
				.subscribe(() => {
					const [url, config] = fetchMock.mock.calls[0];
					expect(url).toBe(baseUrl);
					expect(config?.method).toBe('OPTIONS');
					done();
				}, done.fail);
		});
	});

	describe('patch<T>()', () => {
		it('makes a PATCH request', done => {
			http(baseUrl)
				.patch()
				.subscribe(() => {
					const [url, config] = fetchMock.mock.calls[0];
					expect(url).toBe(baseUrl);
					expect(config?.method).toBe('PATCH');
					done();
				}, done.fail);
		});
	});

	describe('post<T>()', () => {
		it('makes a POST request', done => {
			http(baseUrl)
				.post()
				.subscribe(() => {
					const [url, config] = fetchMock.mock.calls[0];
					expect(url).toBe(baseUrl);
					expect(config?.method).toBe('POST');
					done();
				}, done.fail);
		});

		it('includes headers', done => {
			http(baseUrl)
				.header('x-foo', 'bar')
				.post()
				.subscribe(() => {
					const [, config] = fetchMock.mock.calls[0];
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					expect((config?.headers as any)?.['x-foo']).toEqual('bar');
					done();
				}, done.fail);
		});

		it("automatically sets 'Content-Type' header if not specified", done => {
			http(baseUrl)
				.post()
				.subscribe(() => {
					const [, config] = fetchMock.mock.calls[0];
					expect(config?.headers).toEqual({ Accept: 'application/json', 'Content-Type': 'application/json' });
					done();
				}, done.fail);
		});

		it("honors 'Content-Type' header if specified", done => {
			http(baseUrl)
				.contentType(ContentTypes.Text)
				.post()
				.subscribe(() => {
					const [, config] = fetchMock.mock.calls[0];
					expect(config?.headers).toEqual({ Accept: 'application/json', 'Content-Type': 'text/plain' });
					done();
				}, done.fail);
		});

		it('stringifies body if specified as object', done => {
			http(baseUrl)
				.body({ foo: 'bar' })
				.post()
				.subscribe(() => {
					const [, config] = fetchMock.mock.calls[0];
					expect(config?.body).toBe(JSON.stringify({ foo: 'bar' }));
					done();
				}, done.fail);
		});

		it("URL encodes body if 'Content-Type' specified as 'application/x-www.form-urlencoded'", done => {
			http(baseUrl)
				.contentType(ContentTypes.FormData)
				.body({ foo: 'bar', baz: 'buzz' })
				.post()
				.subscribe(() => {
					const [, config] = fetchMock.mock.calls[0];
					expect(config?.body).toBe('foo=bar&baz=buzz');
					done();
				}, done.fail);
		});

		it('sends body as-is if not an object', done => {
			http(baseUrl)
				.contentType(ContentTypes.Text)
				.body('hello world')
				.post()
				.subscribe(() => {
					const [, config] = fetchMock.mock.calls[0];
					expect(config?.body).toBe('hello world');
					done();
				}, done.fail);
		});
	});

	describe('put<T>()', () => {
		it('sends PUT request', done => {
			http(baseUrl)
				.put()
				.subscribe(() => {
					const [url, config] = fetchMock.mock.calls[0];
					expect(url).toBe(baseUrl);
					expect(config?.method).toBe('PUT');
					done();
				}, done.fail);
		});
	});

	describe('query(..)', () => {
		it('converts URLSearchParams paramter to string', done => {
			const query = new URLSearchParams();
			query.append('foo', 'bar');
			query.append('baz', 'buzz');
			http(baseUrl)
				.query(query)
				.get()
				.subscribe(() => {
					const [url] = fetchMock.mock.calls[0];
					expect(url).toBe(`${baseUrl}?foo=bar&baz=buzz`);
					done();
				}, done.fail);
		});

		it('converts object parameter to string', done => {
			http(baseUrl)
				.query({ foo: 'bar', baz: true, buzz: 10 })
				.get()
				.subscribe(() => {
					const [url] = fetchMock.mock.calls[0];
					expect(url).toEqual(`${baseUrl}?foo=bar&baz=true&buzz=10`);
					done();
				}, done.fail);
		});

		it('adds individual parameters when specified as array inside object', done => {
			http(baseUrl)
				.query({ foo: 'bar', baz: [10, 20] })
				.get()
				.subscribe(() => {
					const [url] = fetchMock.mock.calls[0];
					expect(url).toEqual(`${baseUrl}?foo=bar&baz=10&baz=20`);
					done();
				}, done.fail);
		});

		it('keeps string parameter as-is', done => {
			http(baseUrl)
				.query('foo=bar&baz=buzz')
				.get()
				.subscribe(() => {
					const [url] = fetchMock.mock.calls[0];
					expect(url).toBe(`${baseUrl}?foo=bar&baz=buzz`);
					done();
				}, done.fail);
		});

		it('adds params onto existing query in URL', done => {
			http(`${baseUrl}?foo=bar`)
				.query({ baz: 'buzz' })
				.get()
				.subscribe(() => {
					const [url] = fetchMock.mock.calls[0];
					expect(url).toBe(`${baseUrl}?foo=bar&baz=buzz`);
					done();
				}, done.fail);
		});

		it('appends to empty string if no URL specified', done => {
			http()
				.query({ foo: 'bar' })
				.get()
				.subscribe(() => {
					const [url] = fetchMock.mock.calls[0];
					expect(url).toBe('?foo=bar');
					done();
				}, done.fail);
		});

		it("doesn't mutate Http instance", done => {
			const original = http(baseUrl);
			original.query({ foo: 'bar' });
			original.get().subscribe(() => {
				const [url] = fetchMock.mock.calls[0];
				expect(url).toBe(baseUrl);
				done();
			}, done.fail);
		});
	});

	describe('url(..)', () => {
		it('sets current URL', done => {
			http(baseUrl)
				.url('http://i13g.com')
				.get()
				.subscribe(() => {
					const [url] = fetchMock.mock.calls[0];
					expect(url).toBe('http://i13g.com');
					done();
				}, done.fail);
		});

		it("doesn't mutate Http instance", done => {
			const original = http(baseUrl);
			original.url('http://i13g.com');
			original.get().subscribe(() => {
				const [url] = fetchMock.mock.calls[0];
				expect(url).toBe(baseUrl);
				done();
			}, done.fail);
		});
	});

	describe('httpRequest<T>(..)', () => {
		beforeEach(() => {
			fetchMock.resetMocks();
		});

		it('returns properly parsed JSON for object', done => {
			fetchMock.once('{"hello":"world"}');
			http(baseUrl)
				.get<{ hello: string }>()
				.subscribe(({ data: { hello } }) => {
					expect(hello).toEqual('world');
					done();
				}, done.fail);
		});

		it('returns properly parsed JSON for array', done => {
			fetchMock.once('["hello", "world"]');
			http(baseUrl)
				.get<{ hello: string }>()
				.subscribe(({ data }) => {
					expect(data).toEqual(['hello', 'world']);
					done();
				}, done.fail);
		});

		it('returns string if body is not JSON', done => {
			fetchMock.once('hello world');
			http(baseUrl)
				.get<string>()
				.subscribe(({ data }) => {
					expect(data).toBe('hello world');
					done();
				}, done.fail);
		});

		it('handles error parsing JSON', done => {
			fetchMock.once('{"hello":"world"');
			http(baseUrl)
				.get<string>()
				.subscribe(({ data }) => {
					expect(data).toBe('{"hello":"world"');
					done();
				}, done.fail);
		});

		it('throws error with serialized response included in error', done => {
			fetchMock.once(JSON.stringify({ message: 'Server error' }), { status: 500 });
			http(baseUrl)
				.get()
				.subscribe(
					() => {
						// Shouldn't reach this
						done.fail();
					},
					error => {
						const { data, status } = error;
						expect(data).toBe(JSON.stringify({ message: 'Server error' }));
						expect(status).toBe(500);
						done();
					}
				);
		});

		it('handles errors while parsing error response', done => {
			jest.spyOn(Fetch, 'fromFetch').mockImplementation((input: string | Request) =>
				of(({
					ok: false,
					status: 500,
					statusText: 'Server error',
					text: jest.fn().mockRejectedValue('Error parsing response'),
					url: input instanceof Request ? input.url : input
				} as Partial<Response>) as Response)
			);
			http(baseUrl)
				.get()
				.subscribe(
					() => {
						// Shouldn't reach this
						done.fail();
					},
					error => {
						const { data, status, statusText, url } = error;
						expect(data).toBeUndefined();
						expect(status).toBe(500);
						expect(statusText).toBe('Server error');
						expect(url).toBe(baseUrl);
						done();
					}
				);
		});
	});
});

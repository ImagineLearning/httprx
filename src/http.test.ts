import fetchMock from 'jest-fetch-mock';
import { http } from './http';

describe('Http', () => {
	const baseUrl = 'http://example.com';

	beforeEach(() => {
		fetchMock.resetMocks();
		fetchMock.once(JSON.stringify({ status: 200 }));
	});

	describe('bearer(..)', () => {
		it('adds header', done => {
			http(baseUrl)
				.bearer('my-token')
				.get()
				.subscribe(() => {
					const [, config] = fetchMock.mock.calls[0];
					expect(config?.headers).toEqual({
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
				expect(config?.headers).toBeUndefined();
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
				.contentType('text/plain')
				.post()
				.subscribe(() => {
					const [, config] = fetchMock.mock.calls[0];
					expect(config?.headers).toEqual({ 'Content-Type': 'text/plain' });
					done();
				}, done.fail);
		});

		it("doesn't mutate Http instance", done => {
			const original = http(baseUrl);
			original.contentType('text/plain');
			original.post().subscribe(() => {
				const [, config] = fetchMock.mock.calls[0];
				expect(config?.headers).toEqual({ 'Content-Type': 'application/json' });
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
					expect(config?.headers).toEqual({ 'x-hello': 'world' });
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
					expect(config?.headers).toEqual({ foo: 'bar', baz: 'buzz' });
					done();
				}, done.fail);
		});

		it("doesn't mutate Http instance", done => {
			const original = http(baseUrl);
			original.header('foo', 'bar');
			original.get().subscribe(() => {
				const [, config] = fetchMock.mock.calls[0];
				expect(config?.headers).toBeUndefined();
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
					expect(config?.headers).toEqual({ 'Content-Type': 'application/json' });
					done();
				}, done.fail);
		});

		it("honors 'Content-Type' header if specified", done => {
			http(baseUrl)
				.contentType('text/plain')
				.post()
				.subscribe(() => {
					const [, config] = fetchMock.mock.calls[0];
					expect(config?.headers).toEqual({ 'Content-Type': 'text/plain' });
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
				.contentType('application/x-www-form-urlencoded')
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
				.contentType('text/plain')
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

		it('returns properly parsed JSON', done => {
			fetchMock.once('{"hello":"world"}');
			http(baseUrl)
				.get<{ hello: string }>()
				.subscribe(({ hello }) => {
					expect(hello).toEqual('world');
					done();
				}, done.fail);
		});

		it('returns string if body is not JSON', done => {
			fetchMock.once('hello world');
			http(baseUrl)
				.get<string>()
				.subscribe(value => {
					expect(value).toBe('hello world');
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
						const { body, ok, status } = error;
						expect(body).toBe(JSON.stringify({ message: 'Server error' }));
						expect(ok).toBe(false);
						expect(status).toBe(500);
						done();
					}
				);
		});
	});
});

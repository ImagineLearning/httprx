# httprx

A simple wrapper around [RxJS's `fromFetch`](https://rxjs.dev/api/fetch/fromFetch) function.

## Installation

The **httprx** package is available on [GitHub Package Registry](https://github.com/ImagineLearning/httprx/packages).
To install it, you will need to configure your project by adding a `.npmrc` file to the project root with the following content:

```
@imaginelearning:registry=https://npm.pkg.github.com
```

You can then install it using npm or yarn.
[RxJS](https://github.com/ReactiveX/RxJS) is a peer dependency, so you will need to install that as well if you haven't already done so.

```sh
npm install @imaginelearning/httprx rxjs
```

Or

```sh
yarn add @imaginelearning/httprx rxjs
```

## Usage

```ts
import http from '@imaginelearning/httprx';

http('https://example.com')
	.get<string>()
	.subscribe(response => {
		console.log(response);
		/* =>
		{
			data: 'hello world',
			headers: { ... },
			status: 200,
			statusText: 'OK',
			url: 'https://example.com'
		}
		*/
	});
```

## API

### `http(url: string)`

Returns a new instance of the `Http` class, configured to make requests to the specified URL.

### `Http` class

This is the class that manages the configuration for your HTTP request.
Instances of the `Http` class are immutable.
Configuration functions--such as those for setting headers, body content, etc.--return a new instance of the `Http` class, and can be chained together.

#### `Http.accept(...types: ContentTypes[])`

Replaces the `Accept` header in the headers collection with the specified content type(s).
Returns a new `Http` instance.

_Note: If not set, the `Accept` header defaults to `application/json`._

```ts
http('https://example.com')
	.accept(ContentTypes.Text, ContentTypes.Anything)
	.get();

// GET headers will include `Accept: text/plain, */*`
```

#### `Http.bearer(token?: string)`

Adds the `Authorization` header to the headers collection with the specified bearer token.
Returns a new `Http` instance.

```ts
http('https://example.com')
	.bearer('my-bearer-token')
	.post();

// POST headers will include `Authorization: Bearer my-bearer-token`
```

#### `Http.body(content: object | string)`

Sets the body content to be sent with a POST or PUT request and returns a new `Http` instance.
If the `content` parameter is an object, it will formatted automatically based on the content type (JSON or URL encoded form data).
If the `content` parameter is a string, you will need to ensure that it is properly formatted.

```ts
http('https://example.com')
	.body({ foo: 'bar', count: 1 })
	.post();

// POST headers will include `Content-Type: application/json`
// POST payload will be `{"foo":"bar","count":1}`

http('https://example.com')
	.contentType(ContentTypes.FormData)
	.body({ foo: 'bar', count: 1 })
	.post();

// POST headers will include `Content-Type: application/x-www-form-urlencoded`
// POST payload will be `foo=bar&count=1`
```

#### `Http.contentType(type: ContentTypes)`

Adds the appropriate `Content-Type` header to the headers collection and returns a new `Http` instance.

```ts
http('https://example.com')
	.contentType(ContentTypes.Json)
	.post();

// POST headers will include `Content-Type: application/json`
```

#### `Http.delete<T>()`

Makes a DELETE request to the configured URL with the configured headers.
Returns `Observable<HttpResponse<T>>`, where the `data` field of the `HttpResponse` object matches the type parameter `T`.

```ts
http('https://example.com')
	.delete<{ success: boolean }>()
	.subscribe(({ data }) => {
		console.log(data);
		// => { success: true }
	});
```

#### `Http.get<T>()`

Makes a GET request to the configured URL with the configured headers.
Returns `Observable<HttpResponse<T>>`, where the `data` field of the `HttpResponse` object matches the type parameter `T`.

```ts
http('https://example.com')
	.get<{ foo: string }>()
	.subscribe(({ data }) => {
		console.log(data);
		// => { foo: 'bar' }
	});
```

#### `Http.head()`

Makes a HEAD request to the configured URL with the configured headers.
Returns `Observable<HttpResponse<undefined>>` since a HEAD request should not return any body content,
so the `data` field of the `HttpResponse` object will never be defined.

```ts
http('https://example.com')
	.head()
	.subscribe(({ headers }) => {
		console.log(headers['content-length']);
		// => 648
	});

// HEAD request will not return any body content,
// but `headers`, `status`, `statusText`, and `url`
// will be populated in the `HttpResponse` object.
```

#### `Http.header(name: string, value: string)`

Add a header to the headers collection with the specified name and value.
Returns a new `Http` instance.

```ts
http('https://example.com')
	.header('x-foo', 'bar')
	.header('x-hello', 'world')
	.get();

// GET headers will include `x-foo: bar` and `x-hello: world`
```

#### `Http.patch<T>()`

Makes a PATCH request to the configured URL with the configured headers and body.
If not specified, the `Content-Type` header will default to `application/json`.
Returns `Observable<HttpResponse<T>>`, where the `data` field of the `HttpResponse` object matches the type parameter `T`.

```ts
http('https://example.com')
	.body({ foo: 'bar' })
	.patch<{ success: boolean }>()
	.subscribe(({ data }) => {
		console.log(data);
		// => { success: true }
	});

// PATCH headers include `Content-Type: application/json`
// PATCH payload is `{"foo":"bar"}`
// `data` field in `HttpResponse` object is an object: { success: boolean }
```

#### `Http.post<T>()`

Makes a POST request to the configured URL with the configured headers and body.
If not specified, the `Content-Type` header will default to `application/json`.
Returns `Observable<HttpResponse<T>>`, where the `data` field of the `HttpResponse` object matches the type parameter `T`.

```ts
http('https://example.com')
	.body({ foo: 'bar' })
	.post<string>()
	.subscribe(({ data }) => {
		console.log(data);
		// => 'hello world'
	});

// POST headers include `Content-Type: application/json`
// POST payload is `{"foo":"bar"}`
// `data` field in `HttpResponse` object is a string
```

#### `Http.put<T>()`

Makes a PUT request to the configured URL with the configured headers and body.
If not specified, the `Content-Type` header will default to `application/json`.
Returns `Observable<HttpResponse<T>>`, where the `data` field of the `HttpResponse` object matches the type parameter `T`.

```ts
http('https://example.com')
	.body({ foo: 'bar' })
	.put<string>()
	.subscribe(({ data }) => {
		console.log(data);
		// => 'hello world'
	});

// PUT headers include `Content-Type: application/json`
// PUT payload is `{"foo":"bar"}`
// `data` field in `HttpResponse` object is a string
```

#### `Http.query(query: URLSearchParams | { [key: string]: string | string[] | boolean | number | number[] } | string)`

Sets the query string for the request and returns a new `Http` instance.
If the `query` parameter is a `URLSearchParams` object, or a plain object of key-value pairs, it will be converted to a URL encoded string.
If the `query` parameter is a string, you will need to ensure that it is properly encoded.

```ts
http('https://example.com')
	.query({ foo: 'bar', count: 1 })
	.get();

// GET request made to `https://example.com?foo=bar&count=1`
```

#### `Http.url(url: string)`

Sets the URL to which the HTTP request will be made. Returns a new `Http` instance.

```ts
const http1 = http('https://example.com');
const http2 = http1.url('https://example.org');

http1.get();
// Makes GET request to `https://example.com`

http2.get();
// Makes GET request to `https://example.org`
```

## Local Development

This project was bootstrapped with [TSDX](https://github.com/jaredpalmer/tsdx).

Below is a list of commands you will probably find useful.

### `yarn start`

Runs the project in development/watch mode. The project will be rebuilt upon changes. TSDX has a special logger for your convenience. Error messages are pretty printed and formatted for compatibility with VS Code's Problems tab.

<img src="https://user-images.githubusercontent.com/4060187/52168303-574d3a00-26f6-11e9-9f3b-71dbec9ebfcb.gif" width="600" />

The library will be rebuilt if you make edits.

### `yarn build`

Bundles the package to the `dist` folder.
The package is optimized and bundled with Rollup into multiple formats (CommonJS, UMD, and ES Module).

<img src="https://user-images.githubusercontent.com/4060187/52168322-a98e5b00-26f6-11e9-8cf6-222d716b75ef.gif" width="600" />

### `yarn test`

Runs the test watcher (Jest) in an interactive mode.
By default, runs tests related to files changed since the last commit.

### `yarn test:ci`

Runs tests a single time and produces a code coverage report.

### `yarn format`

Runs the configured code formatter (Prettier) on all files in the project.

### `yarn lint`

Runs linting checks (ESLint) against all code files in the project.

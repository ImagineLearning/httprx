describe('index.ts', () => {
	it('exports `http` function as default', () => {
		const http = require('./index').default;
		expect(http).toBeDefined();
		expect(typeof http).toBe('function');
	});

	it('exports `ContentTypes` enum', () => {
		const { ContentTypes } = require('./index');
		expect(ContentTypes).toBeDefined();
		expect(Object.keys(ContentTypes)).toEqual(['FormData', 'JSON', 'Text']);
	});
});

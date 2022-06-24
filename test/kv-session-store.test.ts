import { kvSessionStore } from 'kv-session-store'

describe('KV Session Store', () => {
	const mockKV = (): jest.Mocked<KVNamespace> => ({
		put: jest.fn(),
		get: jest.fn(),
		delete: jest.fn(),
		list: jest.fn(),
		getWithMetadata: jest.fn(),
	})

	const sessionData = {
		sid: 'session_sid',
		user: { id: 11, name: 'zigi' },
		expires: new Date(),
	}

	it('Saves stringified session data to store under sid key', async () => {
		const kvMock = mockKV()
		const sessionStore = kvSessionStore('TEST')({
			TEST: kvMock,
		})

		const sessionData = {
			sid: 'session_sid',
			user: { id: 11, name: 'zigi' },
		}
		await sessionStore.save('session_sid', sessionData)

		expect(kvMock.put.mock.calls[0][0]).toEqual('session_sid')
		expect(kvMock.put.mock.calls[0][1]).toEqual(JSON.stringify(sessionData))
	})

	it('Fetches session from store by sid', async () => {
		const kvMock = mockKV()
		kvMock.get.mockResolvedValue(JSON.stringify(sessionData) as never)
		const sessionStore = kvSessionStore('TEST')({
			TEST: kvMock,
		})

		const session = await sessionStore.fetch('session_sid')
		if (!session) throw new Error('Session can not be null!')

		expect(kvMock.get.mock.calls[0][0]).toEqual('session_sid')
		expect(session.sid).toEqual('session_sid')
		expect(session.expires?.getTime()).toEqual(sessionData.expires.getTime())
	})

	it('Removes session from store when invalidated', async () => {
		const kvMock = mockKV()
		kvMock.get.mockResolvedValue(JSON.stringify(sessionData) as never)
		const sessionStore = kvSessionStore('TEST')({
			TEST: kvMock,
		})

		await sessionStore.invalidate('session_sid')

		expect(kvMock.delete.mock.calls[0][0]).toEqual('session_sid')
	})

	it(`Failes miserably when there's no KV store with given name in Env`, () => {
		expect(() => {
			const kvMock = mockKV()
			kvSessionStore('TEST_NON_EXISTING')({
				TEST: kvMock,
			})
		}).toThrow(`There's no KV store with name: TEST_NON_EXISTING`)
	})
})

import { MaybeSecureRequest, SessionData, SessionStore } from 'models'
import { session } from 'sessions'
import { generateToken } from 'crypto-utils'

jest.mock('crypto-utils', () => ({
	generateToken: (): string => 'test_token',
}))

type StoreFactoryWithMock<User> = {
	(): SessionStore<User>
	last?: jest.Mocked<SessionStore<User>>
}

describe('Sessions Middleware', () => {
	const mockStore = <User>(
		data?: SessionData<User>
	): StoreFactoryWithMock<User> => {
		const factory: StoreFactoryWithMock<User> = () => {
			const mock = {
				save: jest
					.fn()
					.mockImplementation((_sid, data) => Promise.resolve(data)),
				fetch: jest.fn().mockResolvedValue(data),
				invalidate: jest.fn(),
			}
			factory.last = mock
			return mock
		}
		return factory
	}

	const mockRequest = ({
		expired,
	}: {
		expired?: boolean
	} = {}): {
		store: StoreFactoryWithMock<Record<string, never>>
		data: SessionData<unknown>
		request: Request
	} => {
		const request = new Request('http://localhost:8787', {
			headers: { Cookie: 'FSID=test_token' },
		})

		const data = {
			sid: 'test_token',
			expires: new Date(expired ? Date.now() - 100000 : Date.now() + 100000),
			user: {},
		}
		const store = mockStore(data)
		return { request, store, data: data }
	}

	test('Returns valid headers and token after login', async () => {
		const request = new Request('http://localhost:8787')
		const store = mockStore()
		const middleware = session(store, {
			cookieName: 'MY_SESSION_COOKIE',
			expires: { days: 1 },
			domain: 'testdomain.com',
			httpOnly: true,
			sameSite: 'Strict',
			secure: true,
			path: '/thepath',
		})
		await middleware(request, {})
		const secureRequest = request as MaybeSecureRequest<{ id: string }>
		const { token, headers } = await secureRequest.login({
			id: 'test_id',
		})
		const expiration = secureRequest.session?.expires
		const cookie = headers['Set-Cookie']

		expect(token).toEqual('test_token')
		expect(cookie).toContain(`Expires=${expiration?.toUTCString()};`)
		expect(cookie).toContain(`MY_SESSION_COOKIE=test_token;`)
		expect(cookie).toContain(`Secure;`)
		expect(cookie).toContain(`SameSite=Strict;`)
		expect(cookie).toContain(`HttpOnly;`)
		expect(cookie).toContain(`Path=/thepath;`)
		expect(cookie).toContain(`Domain=testdomain.com`)
	})

	test('Persists new session in store after login', async () => {
		const request = new Request('http://localhost:8787')
		const store = mockStore()
		const middleware = session(store, { cookieName: 'FSID' })
		await middleware(request, {})
		const secureRequest = request as MaybeSecureRequest<{ id: string }>
		await secureRequest.login({
			id: 'test_id',
		})
		expect(store.last?.save.mock.calls[0][0]).toEqual('test_token')
		expect(store.last?.save.mock.calls[0][1].user).toEqual({ id: 'test_id' })
	})

	test('Creates new session on request after login', async () => {
		const request = new Request('http://localhost:8787')
		const store = mockStore()
		const middleware = session(store, { cookieName: 'FSID' })
		await middleware(request, {})
		const secureRequest = request as MaybeSecureRequest<{ id: string }>
		await secureRequest.login({
			id: 'test_id',
		})
		expect(secureRequest.session?.user.id).toEqual('test_id')
	})

	test('Newly created session has expected expiration time', async () => {
		const request = new Request('http://localhost:8787')
		const store = mockStore()
		const middleware = session(store, {
			cookieName: 'FSID',
			expires: { hours: 1 },
		})
		await middleware(request, {})
		const secureRequest = request as MaybeSecureRequest<{ id: string }>
		await secureRequest.login({
			id: 'test_id',
		})
		const expiration = secureRequest.session?.expires?.getTime()
		expect(expiration).toBeGreaterThan(Date.now() + 59 * 60 * 1000)
		expect(expiration).toBeLessThan(Date.now() + 61 * 60 * 1000)
	})

	test('Invalidates session after logout', async () => {
		const { data, store, request } = mockRequest()
		const middleware = session(store, { cookieName: 'FSID' })
		await middleware(request, {})
		expect((request as MaybeSecureRequest<unknown>).session).toEqual(data)

		await (request as MaybeSecureRequest<unknown>).logout()
		expect(store.last?.invalidate).toHaveBeenCalledWith(data.sid)
	})

	test('Removes session from request after logout', async () => {
		const { data, store, request } = mockRequest()
		const middleware = session(store, { cookieName: 'FSID' })
		await middleware(request, {})
		expect((request as MaybeSecureRequest<unknown>).session).toEqual(data)

		await (request as MaybeSecureRequest<unknown>).logout()
		expect((request as MaybeSecureRequest<unknown>).session).toBeFalsy()
	})

	test('Does not set session on request if expired', async () => {
		const { request, store } = mockRequest({ expired: true })
		const middleware = session(store, { cookieName: 'FSID' })
		await middleware(request, {})

		expect((request as MaybeSecureRequest<unknown>).session).toBeFalsy()
	})

	test('Sets fetched session on request if not expired', async () => {
		const { data, request, store } = mockRequest()
		const middleware = session(store, { cookieName: 'FSID' })
		await middleware(request, {})

		expect((request as MaybeSecureRequest<unknown>).session).toEqual(data)
	})

	test('Does not remove non expired sessions from store', async () => {
		const { data, store, request } = mockRequest()
		const middleware = session(store, { cookieName: 'FSID' })
		await middleware(request, {})

		expect(store.last?.invalidate).not.toHaveBeenCalledWith(data.sid)
	})

	test('Removes expired session from store', async () => {
		const { data, store, request } = mockRequest({ expired: true })
		const middleware = session(store, { cookieName: 'FSID' })
		await middleware(request, {})

		expect(store.last?.invalidate).toHaveBeenCalledWith(data.sid)
	})
})

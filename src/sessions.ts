import { CookieConfig, generateCookie, parseCookies } from './cookies'
import { generateToken } from './crypto-utils'
import {
	Cookie,
	MaybeSecureRequest,
	SessionData,
	SessionStore,
	TimePeriod,
	timeToMs,
} from './models'

export const requireLogin = (
	req: MaybeSecureRequest<unknown>
): void | Response => {
	if (!req.session) {
		return new Response('Unauthorized', { status: 401 })
	}
}

type Config = CookieConfig & {
	expires?: TimePeriod
}
const DEFAULT_CONFIG = {
	cookieName: 'FSID',
	secure: false,
	httpOnly: true,
	path: '/',
	expires: { days: 1 },
}

export const session = <User, Env extends Record<string, unknown>>(
	createStore: (env: Env) => SessionStore<User>,
	config?: Config
): ((req: Request, env: Env) => Promise<void>) => {
	const c = {
		...DEFAULT_CONFIG,
		...config,
	}

	const expiresInMs = timeToMs(c?.expires)

	return async (basicRequest, env): Promise<void> => {
		const store = createStore(env)
		const request = basicRequest as MaybeSecureRequest<User>
		const sid = parseCookies(request)[c.cookieName]
		const session = sid && (await store.fetch(sid))

		if (session && isNotExpired(session)) {
			request.session = session
		} else if (session) {
			await store.invalidate(sid)
		}

		request.login = async (user: User): Promise<Cookie> => {
			const sid = await generateToken()
			const expires = new Date(Date.now() + expiresInMs)
			const sessionData = await store.save(sid, { sid, user, expires })
			request.session = sessionData

			return {
				headers: {
					'Set-Cookie': generateCookie(c, sid, sessionData),
				},
				token: sid,
			}
		}

		request.logout = async (): Promise<void> => {
			if (request.session) {
				await store.invalidate(request.session.sid)
				delete request.session
			}
		}
	}
}

const isNotExpired = (session: SessionData<unknown>): boolean =>
	!session.expires || session.expires.getTime() > Date.now()

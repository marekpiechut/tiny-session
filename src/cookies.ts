import { SessionData } from './models'

export type CookieConfig = {
	cookieName?: string
	domain?: string
	path?: string
	secure?: boolean
	httpOnly?: boolean
	sameSite?: 'Lax' | 'Strict' | 'None'
}

export const generateCookie = (
	c: CookieConfig,
	token: string,
	sessionData: SessionData<unknown>
): string => {
	let cookie = `${c.cookieName}=${token}; Path=${c.path || '/'}`
	if (c.httpOnly) {
		cookie += '; HttpOnly'
	}
	if (c.secure) {
		cookie += '; Secure'
	}
	if (c.sameSite) {
		cookie += `; SameSite=${c.sameSite}`
	}
	if (sessionData.expires) {
		cookie += `; Expires=${sessionData.expires.toUTCString()}`
	}
	if (c.domain) {
		cookie += `; Domain=${c.domain}`
	}

	return cookie
}

export const parseCookies = (request: Request): Record<string, string> => {
	const cookiesHeader = request.headers.get('Cookie')
	return (
		cookiesHeader
			?.split(/;\s*/)
			.map(pair => pair.split('='))
			.reduce((acc, [key, value]) => {
				acc[key.trim()] = value.trim()

				return acc
			}, {} as Record<string, string>) || {}
	)
}

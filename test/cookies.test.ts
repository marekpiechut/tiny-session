import { generateCookie, parseCookies } from 'cookies'

describe('Cookie parser', () => {
	const mockRequest = (cookie: string): Request =>
		new Request('http://localhost:8787', { headers: { cookie } })

	test('Parses single value cookie header', () => {
		const cookie = 'yummy_cookie=choco'
		const parsed = parseCookies(mockRequest(cookie))

		expect(parsed['yummy_cookie']).toEqual('choco')
	})
	test('Parses multi value cookie header', () => {
		const cookie = 'yummy_cookie=choco; tasty_cookie=strawberry'
		const parsed = parseCookies(mockRequest(cookie))

		expect(parsed['yummy_cookie']).toEqual('choco')
		expect(parsed['tasty_cookie']).toEqual('strawberry')
	})
})

describe('Cookie generator', () => {
	test('Generates basic cookie with empty options', () => {
		const cookie = generateCookie({ cookieName: 'HEY' }, 'the_token', {
			sid: 'the_token',
			user: {},
		})

		expect(cookie.split(/;\s*/).sort()).toEqual(['HEY=the_token', 'Path=/'])
	})

	test('Generates cookie according to options', () => {
		const cookie = generateCookie(
			{
				cookieName: 'HEY',
				httpOnly: true,
				path: '/path',
				sameSite: 'Lax',
				secure: true,
				domain: 'thedomain.com',
			},
			'the_token',
			{
				sid: 'the_token',
				user: {},
			}
		)

		expect(cookie.split(/;\s*/).sort()).toEqual([
			'Domain=thedomain.com',
			'HEY=the_token',
			'HttpOnly',
			'Path=/path',
			'SameSite=Lax',
			'Secure',
		])
	})
})

import { generateToken } from 'crypto-utils'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const originalCrypto = (globalThis as any).crypto

describe('Crypto Utils', () => {
	const mockCrypto = (
		randomValues: string
	): jest.MockContext<Uint8Array, [Uint8Array]> => {
		const cryptoMock = {
			getRandomValues: jest.fn(),
		}

		cryptoMock.getRandomValues.mockResolvedValue(
			Uint8Array.from(randomValues.split('').map(x => x.charCodeAt(0)))
		)

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		;(globalThis as any).crypto = cryptoMock
		return cryptoMock.getRandomValues.mock
	}
	it('Uses global crypto to generate random value', async () => {
		mockCrypto('HOPSA')
		const token = await generateToken(64)
		expect(token).toEqual('SE9QU0E')
	})

	it('Passes Uint8Array of proper size to crypto', async () => {
		const mock = mockCrypto('')
		await generateToken(128)
		expect(mock.calls[0][0]).toEqual(new Uint8Array(128))
	})

	test('Generates long tokens by default', async () => {
		const mock = mockCrypto('')
		await generateToken()
		expect(mock.calls[0][0].length).toBeGreaterThanOrEqual(64)
	})

	test('Does not allow to generate too short tokens', async () => {
		await expect(async () => {
			mockCrypto('')
			await generateToken(31)
		}).rejects.toThrow(`Don't use tokens smaller than 32! It's not secure!`)
	})

	afterEach(() => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		;(globalThis as any).crypto = originalCrypto
	})
})

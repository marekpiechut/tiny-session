const DEFAULT_TOKEN_BYTES = 64
const MIN_SECURE_BYTES = 32

export const generateToken = async (
	tokenBytes: number = DEFAULT_TOKEN_BYTES
): Promise<string> => {
	if (tokenBytes < MIN_SECURE_BYTES) {
		throw new Error(
			`Don't use tokens smaller than ${MIN_SECURE_BYTES}! It's not secure!`
		)
	}
	const random = await crypto.getRandomValues(new Uint8Array(tokenBytes))
	const randomString = String.fromCharCode(...Array.from(random))
	const encoded = btoa(randomString)
		.replace(/\=/g, '')
		.replace(/\+/g, '_')
		.replace(/\//g, '-')

	return encoded
}

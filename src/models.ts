export type SessionData<User> = {
	sid: string
	expires?: Date
	user: User
}

export type SessionStore<User> = {
	save: (sid: string, session: SessionData<User>) => Promise<SessionData<User>>
	fetch: (sid: string) => Promise<SessionData<User> | null | undefined>
	invalidate: (sid: string) => Promise<unknown>
}

export type MaybeSecureRequest<User> = Request & {
	login: (user: User) => Promise<Cookie>
	logout: () => Promise<void>
	session?: SessionData<User>
}

export type SecureRequest<User> = Request & {
	session: SessionData<User>
	logout: () => Promise<void>
}

export type Cookie = {
	headers: { 'Set-Cookie': string }
	token: string
}

export type TimePeriod = {
	seconds?: number
	minutes?: number
	hours?: number
	days?: number
}

export const timeToMs = (time: TimePeriod): number =>
	[
		(time.seconds || 0) * 1000,
		(time.minutes || 0) * 60 * 1000,
		(time.hours || 0) * 60 * 60 * 1000,
		(time.days || 0) * 24 * 60 * 60 * 1000,
	].reduce((acc, value) => acc + value, 0)

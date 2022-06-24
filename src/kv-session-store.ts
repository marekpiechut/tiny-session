import { SessionStore } from './models'

export const kvSessionStore =
	<User, Env extends Record<string, unknown>>(kvName: keyof Env) =>
	(env: Env): SessionStore<User> => {
		const kvStore = env[kvName] as KVNamespace
		if (typeof kvStore?.get !== 'function') {
			throw new Error(`There's no KV store with name: ${kvName.toString()}`)
		}
		const store: SessionStore<User> = {
			save: async (sid, data) => {
				await kvStore.put(sid, JSON.stringify(data))
				return data
			},
			fetch: async sid => {
				const value = await kvStore.get(sid)
				if (value) {
					const parsed = JSON.parse(value)
					parsed.expires = parsed.expires && new Date(parsed.expires)
					return parsed
				}
			},
			invalidate: async sid => {
				await kvStore.delete(sid)
			},
		}

		return store
	}

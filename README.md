<img src="./assets/logo.png" width="500px">

Tiny-Session is a zero-dependency, easy to use library for managing sessions in Cloudflare Workers. Just when you need to log-in and users and check current user in your request handlers. Works well with [itty-router](https://github.com/kwhitley/itty-router).

## Beta

**This project is in early development stage. I will try to keep it all working and try to make API compatible with previous versions. But please don't rely on it before version 1.0**

## Features

- ✅ Secure token generation without Node.js compatibility required
- ✅ No dependencies, just Cloudflare Workers API used
- ✅ Cookie 🍪 generation code, just add it to response
- ✅ Pluggable session store - easy to implement custom storage
- ✅ Cloudflare KV session store included
- ✅ Configurable cookie lifetime and scope settings with sensible defaults
- ✅ Easy to use `login` and `logout` functions on `request` object
- ✅ Fully typed - implemented in TypeScript
- ✅ Tiny - just few kilobytes

## How to use

### Somewhere you keep your application models

```typescript
/**
 * This is an object you want to associate with session
 */
type User = {
  id: string
  //rest of object you want to associate with session
}

/**
 * You probably already have something like this
 * to type checking for Cloudflare environment.
 * My session KV store is named 'KV_SESSION'.
 * Remember to configure yours in wrangler.toml.
 */
type Env = {
  KV_SESSIONS: KVNamespace
}
```

### At the top of your base router file

```typescript
//Make sure we pass session data to all routes in the app
const router = Router().all(
  '*',
  session<User, Env>(kvSessionStore('KV_SESSIONS'))
)
```

### Login example

```typescript
Router().post('/login', async (req: Request, env: Env) => {
  //Use your authentication method and fetch user
  const user = await authenticate(req)
  if (user) {
    const { headers } = await req.login(await profile.get('id', 'username'))
    return new Response('Redirect', {
      headers: { ...headers, Location: '/' },
      status: 303,
    })
  } else {
    return new Response('Invalid credentials', { status: 403 })
  }
})
```

### Logout example

```typescript
Router().post('/logout', async (req: MaybeSecureRequest<User>) => {
  await req.logout()
  return new Response('Redirect', {
    headers: { Location: '/' },
    status: 303,
  })
})
```

### Access session example

```typescript
/**
 * requireLogin will make sure user is logged in and short-circuit
 * this request returning 404 status. Your route handler is sure to
 * have session
 */
Router().get('/me', requireLogin, (req: SecureRequest<User>) => {
  const { session } = req
  const user = await userRepository.fetchUser(session.id)
  return new Respnose(JSON.stringify(user))
})
```

## Configuration

You can configure few options when creating the session middleware.
Most of these are related to cookie attributes.
Check on [MDN - Cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies) to know more.

```typescript
type Config = {
  cookieName?: string //Name of the cookie that will be sent to browser
  domain?: string //Domain attribute of the cookie
  path?: string //Path attribute of the cookie
  secure?: boolean //Secure attribute of the cookie
  httpOnly?: boolean //HttpOnly attribute of the cookie
  sameSite?: 'Lax' | 'Strict' | 'None' //SameSite attribute of the cookie
  expires?: TimePeriod //After this time cookie will be invalidated
}

//Default settings
const DEFAULT_CONFIG = {
  cookieName: 'FSID',
  secure: false,
  httpOnly: true,
  path: '/',
  expires: { days: 1 },
}
```

## Crypto

This package uses built-in [Crypto](https://developer.mozilla.org/en-US/docs/Web/API/Crypto)
api from Cloudflare. By default cookie is secured with 64 bytes secure random token.
To make sure you don't do any crazy stuff, you are not allowed to pass your custom token generation logic.

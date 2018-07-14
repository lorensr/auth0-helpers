`npm i auth0-helpers`

Helper functions for [`auth0-js`](https://www.npmjs.com/package/auth0-js).

Keeps your `accessToken` up to date by calling `checkSession()` for you.

## Usage

On startup:

```js
import auth0 from 'auth0-js'
import { initAuthHelpers } from 'auth0-helpers'

const client = new auth0.WebAuth({
  domain: 'foo.auth0.com',
  clientID: 'bar',
  responseType: 'token',
  audience: 'https://app.com',
  scope: 'openid profile myscope'
})

initAuthHelpers({
  client,
  usePopup: true,
  authOptions: {
    connection: 'github',
    owp: true,
    popupOptions: { height: 623 }
  },
  onError: console.error,
  checkSessionOptions: {
    redirect_uri: window.location.origin,
    timeout: 5 * 1000
  },
  returnToAfterLogout: 'https://app.com/login' // defaults to window.location.origin
})
```

Later:

```js
import { login, logout, getAuthToken } from 'auth0-js'

login({
  onCompleted: (error, accessToken) => ...
})

logout()

// when making API requests:
const token = await getAuthToken({
  doLoginIfTokenExpired: true
})
if (token) {
  headers.authorization = `Bearer ${token}`
}
```

`getAuthToken` returns a Promise. It resolves immediately if the latest token isn't expired. If it is expired, it tries `checkSession()` to get a new token. If it can't and `doLoginIfTokenExpired` is `true`, then it does an auth call (`client.authorize`, or `client.popup.authorize` if you set `usePopup` to `true`). If there is no token (because `logout()` has been called, or `login()` has never been called in this browser, or localStorage has been cleared), it returns `null`.

A `logout()` function that doesn't cause a page reload has [not yet been implemented](https://github.com/auth0/auth0.js/issues/618).

If you have questions or would like something to change, [check out the code](https://github.com/lorensr/auth0-helpers/blob/master/index.js)—it's short!

### Cookies

By default, on login, the token and expiration are stored in localStorage under `'auth.accessToken'` and `'auth.expiration'`. If you would like to store the token in a cookie instead, add this to your `initAuthHelpers()` call:

```
initAuthHelpers({
  ...
  cookieOptions: {
    name: 'my-auth-cookie',
    attributes: inDevelopment
      ? {
          domain: 'myapp.test'
        }
      : {
          domain: 'myapp.com',
          secure: true
        }
  }
}
```

Here we're using the root `'myapp.com'` to share the cookie among the root and all subdomains (versus localStorage, which is per-host). To test, add these to your `/etc/hosts` file:

```
127.0.0.1 myapp.test
127.0.0.1 foo.myapp.test
127.0.0.1 bar.myapp.test
```

## Auth0 setup

- Create an application (https://manage.auth0.com/#/applications)
  - Under Connections, enable one. (If eg Google, then you'll use `'google-oauth2'` for `authOptions.connection`.)
  - Under Settings:
    - Fill in "Allowed Logout URLs" and "Allowed Origins (CORS)" (eg with `http://localhost:3000`)
    - Copy Domain and Client ID for use with `new auth0.WebAuth`
- Create an API (https://manage.auth0.com/#/apis)
  - Copy identifier (eg `api.myapp.com`) to use as `audience` with `new auth0.WebAuth`
  - Under Settings, we recommend setting the "Token Expiration For Browser Flows" to `86400` seconds (24 hours, the max) so that `checkSession()` has to be called less frequently. We also recommend setting `SSO Cookie Timeout` (https://manage.auth0.com/#/tenant/advanced) to `43200` minutes (30 days, the max). Then `checkSession()` will work for `min(3 days since the last login or checkSession, 30 days)`.

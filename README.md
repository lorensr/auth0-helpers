Helper functions for [`auth0-js`](https://www.npmjs.com/package/auth0-js).

Keeps your `accessToken` up-to-date by calling `checkSession()` for you.

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
  onError: e => console.error(e),
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
  onCompleted: (error, accessToken) => foo
})

logout()

// when making API requests:
const token = await getAuthToken({
  doLoginIfNeeded: true
})
if (token) {
  headers.authorization = `Bearer ${token}`
}
```

`getAuthToken` returns a Promise. It resolves immediately if the latest token isn't expired. If it is expired, it tries `checkSession()` to get a new token. If it can't and `doLoginIfNeeded` is `true`, then it does an auth call (`client.authorize`, or `client.popup.authorize` if you set `usePopup` to `true`). If there is no token (because `logout()` has been called, or `login()` has never been called in this browser, or localStorage has been cleared), it returns `null`.

The token and expiration are stored in localStorage under `'auth.accessToken'` and `'auth.expiration'`.

We recommend setting the "Token Expiration For Browser Flows" to `86400` seconds (24 hours, the max) so that `checkSession()` has to be called less frequently. We also recommend setting `SSO Cookie Timeout` to `43200` minutes (30 days, the max). Then `checkSession()` will work for `min(3 days since the last login or checkSession, 30 days)`.

If you have questions or would like something to change, [check out the code](https://github.com/lorensr/auth0-helpers/blob/master/index.js)—it's short!
import cookies from 'js-cookie'

let intervalId,
  auth,
  usePopup,
  authOptions,
  onError,
  checkSessionOptions,
  returnToAfterLogout,
  cookieOptions,
  useCookie

export const initAuthHelpers = config => {
  auth = config.client
  usePopup = config.usePopup
  authOptions = config.authOptions
  checkSessionOptions = config.checkSessionOptions
  onError = config.onError || Function.prototype
  returnToAfterLogout = config.returnToAfterLogout || window.location.origin
  cookieOptions = config.cookieOptions
  useCookie = !!cookieOptions

  if (!intervalId) {
    intervalId = setInterval(() => getAuthToken(), 50 * MINUTE)
  }
}

function handleAuthResult({ expiresIn: expiresInSeconds, accessToken }) {
  if (useCookie) {
    cookies.set(cookieOptions.name, accessToken, cookieOptions.attributes)
  } else {
    localStorage.setItem('auth.accessToken', accessToken)
  }

  const expiration = expiresInSeconds * 1000 + Date.now()
  localStorage.setItem('auth.expiration', expiration)
}

export const login = ({ onCompleted, withUserInfo }) => {
  function cb(error, authResult) {
    if (error) {
      onError(error)
      return
    } else {
      handleAuthResult(authResult)
    }
    console.log({ authResult })

    onCompleted && onCompleted(error, authResult && authResult.accessToken)

    if (withUserInfo) {
      auth.client.userInfo(authResult.accessToken, withUserInfo)
    }
  }

  if (usePopup) {
    auth.popup.authorize(authOptions, cb)
  } else {
    auth.authorize(authOptions, cb)
  }
}

export const logout = () => {
  if (useCookie) {
    cookies.remove(cookieOptions.name)
  } else {
    localStorage.removeItem('auth.accessToken')
  }

  auth.logout({ returnTo: returnToAfterLogout })
}

const refreshToken = doLoginIfTokenExpired =>
  new Promise((resolve, reject) => {
    auth.checkSession(checkSessionOptions, (error, authResult) => {
      if (error) {
        if (doLoginIfTokenExpired) {
          login({
            onCompleted: (error, token) => {
              if (error) {
                reject(error)
              } else {
                resolve(token)
              }
            }
          })
        } else {
          reject(error)
        }
      } else {
        handleAuthResult(authResult)
        resolve(authResult.accessToken)
      }
    })
  })

const MINUTE = 1000 * 60,
  HOUR = MINUTE * 60

export const getAuthToken = ({ doLoginIfTokenExpired = false } = {}) => {
  const token = useCookie
    ? cookies.get(cookieOptions.name)
    : localStorage.getItem('auth.accessToken')
  const authTokenExists = !!token

  if (authTokenExists) {
    const expiration = parseInt(localStorage.getItem('auth.expiration'), 10),
      now = Date.now(),
      isExpired = expiration < now - MINUTE, // leeway
      willExpireSoon = expiration < now + HOUR

    if (isExpired) {
      return refreshToken(doLoginIfTokenExpired)
    } else {
      if (willExpireSoon) {
        refreshToken(doLoginIfTokenExpired)
      }

      return token
    }
  } else {
    // either user has never logged in, or has logged out,
    // in which case we don't want to auto log them back in
    return null
  }
}

import { Router } from 'itty-router'
import { customAlphabet } from 'nanoid'

const nanoid = customAlphabet(
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  4,
);

// Create a new router
const router = Router()

// Redirect on index to our home page :)
router.get("/", () => {
  return Response.redirect('https://stapp.studio', 301)
})

router.get("/:path", async ({ params }) => {
  let path = decodeURIComponent(params.path)

  const route = await LINKS.get(path)

  if (route === null) {
    return new Response("Route not found", { status: 404 })
  }

  return Response.redirect(route, 302)
})

router.post("/create", async request => {
  console.log(request)

  // The "Authorization" header is sent when authenticated.
  if (request.headers.has('Authorization')) {
    // Throws exception when authorization fails.
    const { user, pass } = basicAuthentication(request)
    verifyCredentials(user, pass)

    try {
      // Get body
      const body = await request.json()

      if ('url' in body) {
        // Generate unique identifier
        const id = nanoid()

        // Save to workers
        await LINKS.put(id, body.url)

        // Respond with the id
        return new Response(`Created short link at ${id}`, { status: 201 })
      }
      else {
        return new Response('Bad Request', { status: 400 })
      }
    }
    catch (e) {
      return new Response('Bad Request', { status: 400 })
    }
  }

  // Not authenticated.
  return new Response('Missing credentials!', {
    status: 401,
    headers: {
      // Prompts the user for credentials.
      'WWW-Authenticate': 'Basic realm="my scope", charset="UTF-8"'
    }
  })
})

/* 404 catch-all */
router.all("*", () => new Response("Not found!", { status: 404 }))

// Error handler
const errorHandler = error =>
  new Response(error.reason || 'Server Error', { status: error.status || 500 })

/*
This snippet ties our worker to the router we deifned above, all incoming requests
are passed to the router where your routes are called and the response is sent.
*/
addEventListener('fetch', (e) => {
  e.respondWith(router.handle(e.request).catch(errorHandler))
})

/*
Basic auth code is from Cloudflare example
https://developers.cloudflare.com/workers/examples/basic-auth
*/

/**
 * Throws exception on verification failure.
 * @param {string} user
 * @param {string} pass
 * @throws {UnauthorizedException}
 */
function verifyCredentials(user, pass) {
  if (BASIC_USER !== user) {
    throw new UnauthorizedException('Invalid username.')
  }

  if (BASIC_PASS !== pass) {
    throw new UnauthorizedException('Invalid password.')
  }
}
/**
 * Parse HTTP Basic Authorization value.
 * @param {Request} request
 * @throws {BadRequestException}
 * @returns {{ user: string, pass: string }}
 */
function basicAuthentication(request) {
  const Authorization = request.headers.get('Authorization')

  const [scheme, encoded] = Authorization.split(' ')

  // The Authorization header must start with "Basic", followed by a space.
  if (!encoded || scheme !== 'Basic') {
    throw new BadRequestException('Malformed authorization header.')
  }

  // Decodes the base64 value and performs unicode normalization.
  // @see https://datatracker.ietf.org/doc/html/rfc7613#section-3.3.2 (and #section-4.2.2)
  // @see https://dev.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String/normalize
  const decoded = atob(encoded).normalize()

  // The username & password are split by the first colon.
  //=> example: "username:password"
  const index = decoded.indexOf(':')

  // The user & password are split by the first colon and MUST NOT contain control characters.
  // @see https://tools.ietf.org/html/rfc5234#appendix-B.1 (=> "CTL = %x00-1F / %x7F")
  if (index === -1 || /[\0-\x1F\x7F]/.test(decoded)) {
    throw new BadRequestException('Invalid authorization value.')
  }

  return {
    user: decoded.substring(0, index),
    pass: decoded.substring(index + 1),
  }
}

function UnauthorizedException(reason) {
  this.status = 401
  this.statusText = 'Unauthorized'
  this.reason = reason
}

function BadRequestException(reason) {
  this.status = 400
  this.statusText = 'Bad Request'
  this.reason = reason
}
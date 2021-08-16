import { Router } from 'itty-router'

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

router.post("/create", async ({ params }) => {
  return new Response("Not yet implemented", { status:  501} )
})

/*
This shows a different HTTP method, a POST.

Try send a POST request using curl or another tool.

Try the below curl command to send JSON:

$ curl -X POST <worker> -H "Content-Type: application/json" -d '{"abc": "def"}'
*/
router.post("/post", async request => {
  // Create a base object with some fields.
  let fields = {
    "asn": request.cf.asn,
    "colo": request.cf.colo
  }

  // If the POST data is JSON then attach it to our response.
  if (request.headers.get("Content-Type") === "application/json") {
    fields["json"] = await request.json()
  }

  // Serialise the JSON to a string.
  const returnData = JSON.stringify(fields, null, 2);

  return new Response(returnData, {
    headers: {
      "Content-Type": "application/json"
    }
  })
})

/*
This is the last route we define, it will match anything that hasn't hit a route we've defined
above, therefore it's useful as a 404 (and avoids us hitting worker exceptions, so make sure to include it!).

Visit any page that doesn't exist (e.g. /foobar) to see it in action.
*/
router.all("*", () => new Response("Not found!", { status: 404 }))

/*
This snippet ties our worker to the router we deifned above, all incoming requests
are passed to the router where your routes are called and the response is sent.
*/
addEventListener('fetch', (e) => {
  e.respondWith(router.handle(e.request))
})

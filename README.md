### URL Shortener

A simple URL Shortener using only Cloudflare Workers :)

#### Setup

1) Rename `wrangler.toml.example` to `wrangler.toml`

2) Refer to Cloudflare Get Started Guide to learn how to setup a worker on your account and/or how to get the right credentials https://developers.cloudflare.com/workers/get-started/guide

3) Create a KV with `wrangler kv:namespace create "LINKS" --preview` and update it's data on wrangler.toml

* If the route redirection is not working, try setting up from CloudFlare dashboard at your zone -> Workers -> "Add route"
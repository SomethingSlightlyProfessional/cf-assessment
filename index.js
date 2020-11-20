addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

class Link {
  constructor(name, url) {
    this.name = name
    this.url = url
  }
}

class SocialLink{
  constructor(name, url, svg){
    this.name = name
    this.url = url
    this.svg = svg
  }
}

const baseURL = "https://jh-cf-assessment.justcshuynh.workers.dev"
const linksRequest = baseURL + "/links"

const data = {
  "links": [
    new Link("Google", "https://www.google.com/"),
    new Link("Bing", "https://www.bing.com/"),
    new Link("DuckDuckGo", "https://duckduckgo.com/"),
    new Link("CloudFlare", "https://www.cloudflare.com/")
  ]
}

const linkedInSVG = '<path xmlns="http://www.w3.org/2000/svg" d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>'
const socialData = {
  "links" : [
    new SocialLink("LinkedIn", "https://www.linkedin.com/in/justincshuynh/", linkedInSVG)
  ]
}

/**
 * gatherResponse awaits and returns a response body as a string.
 * Use await gatherResponse(..) in an async function to get the response body
 * @param {Response} response
 */
async function gatherResponse(response) {
  const { headers } = response
  const contentType = headers.get("content-type") || ""
  if (contentType.includes("application/json")) {
    return JSON.stringify(await response.json())
  }
  else if (contentType.includes("application/text")) {
    return await response.text()
  }
  else if (contentType.includes("text/html")) {
    return await response.text()
  }
  else {
    return await response.text()
  }
}

// Returns a JSON Response with array of links.
async function getLinks(data) {
  const json = JSON.stringify(data, null, 2)

  return new Response(json, {
    headers: { "content-type": "application/json;charset=UTF-8" },
  })
}

// Returns a Response with the base static page.
async function getStaticPage() {
  const staticPageUrl = "https://static-links-page.signalnerve.workers.dev"
  const init = {
    headers: {
      "content-type": "text/html;charset=UTF-8",
    },
  }
  const response = await fetch(staticPageUrl, init)
  const results = await gatherResponse(response)

  return new Response(results, init)
}

// HTMLRewriters
class LinksTransformer {
  constructor(links) {
    this.links = links
  }

  async element(element) {
    this.links.forEach(link => {
      element.append(`<a href=${link.url}>${link.name}</a>`, { html: true })
    })

  }
}

const profileRewriter = {
  element: (element) => {
    element.removeAttribute('style')
  }
}

const headerRewriter = {
  element: (element) => {
    element.setInnerContent("justcshuynh")
  }
}

const avatarRewriter = {
  element: (element) => {
    element.setAttribute('src',
      "https://www.cloudflare.com/img/logo-cloudflare-dark.svg")
  }
}

class SocialsRewriter {
  constructor(socials){
    this.socials = socials
  }
  
  async element(element) {
    element.removeAttribute('style')
    this.socials.forEach(social =>{
      element.append(`<a href=${social.url}>
      <svg>${social.svg}</svg>
      </a>`, { html: true })
    })
  }
}

const titleRewriter = {
  element: (element) => {
    element.setInnerContent("Justin Huynh")
  }
}

const bodyRewriter = {
  element: (element) => {
    element.setAttribute("class", "bg-indigo-400")
  }
}


/**
 * Returns json tree at url/links, otherwise displays modified html page
 * @param {Request} request
 */
async function handleRequest(request) {

  if (request.url === linksRequest) {
    return getLinks(data)

  } else {
    const rewriter = new HTMLRewriter()
      .on("div#links", new LinksTransformer(data["links"])) // Adds links
      .on("div#profile", profileRewriter) // Opens up profile to add name and avatar
      .on("h1#name", headerRewriter)
      .on("img#avatar", avatarRewriter)
      .on("div#social", new SocialsRewriter(socialData["links"])) // Add socials icons
      .on("title", titleRewriter) // Modify Title to name
      .on("body", bodyRewriter) // Modify background color

    return rewriter.transform(await getStaticPage())
  }
}
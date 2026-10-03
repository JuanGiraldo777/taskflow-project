/**
 * @file worker/index.js
 * @description Worker de Cloudflare delante del sitio estático (ejercicio_web/).
 *
 * Casi todo lo sirve Cloudflare directamente como archivo estático, sin
 * pasar por aquí. Este código SOLO corre para las rutas listadas en
 * wrangler.jsonc → assets.run_worker_first:
 *
 *   /              → sirve index.html. Con html_handling "none" (necesario
 *                    para que /producto.html no se redirija a /producto),
 *                    Cloudflare no resuelve "/" solo.
 *   /producto.html → mete en el HTML, ANTES de que llegue al navegador, el
 *                    título, la descripción, la foto y los datos
 *                    estructurados (JSON-LD) del perfume. WhatsApp,
 *                    Instagram y Facebook no ejecutan JavaScript: sin esto
 *                    un enlace compartido mostraría siempre lo mismo. Si
 *                    el perfume no existe → página 404 con estado 404 real.
 *   /sitemap.xml   → lista de páginas para Google, armada con los productos
 *                    reales de la API (se actualiza sola al agregar productos).
 *   /robots.txt    → permite indexar el dominio principal y bloquea las
 *                    copias de prueba (*.workers.dev) para no duplicar.
 *
 * Si la API (Render) tarda o falla, NUNCA se rompe la página: se entrega el
 * HTML estático tal cual y el JavaScript del navegador hace lo de siempre.
 */
const API = "https://maison-backend-7pq8.onrender.com/api/v1";
const SITE_NAME = "Maison Eternelle";
const API_TIMEOUT_MS = 2500;
const SITEMAP_TIMEOUT_MS = 8000;
const PRODUCT_CACHE_SECONDS = 300; // 5 min: un cambio de precio se ve rápido
const SITEMAP_CACHE_SECONDS = 43200; // 12 h

// Mismas cabeceras que ejercicio_web/_headers: ese archivo NO se aplica a
// las respuestas que arma este Worker, así que se repiten aquí.
const SECURITY_HEADERS = {
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Frame-Options": "DENY",
  "Content-Security-Policy": "frame-ancestors 'none'",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
};

// Páginas fijas del sitemap (además de una por producto).
const STATIC_PATHS = [
  "/",
  "/catalogo.html",
  "/catalogo.html?type=original",
  "/catalogo.html?type=preparado",
  "/catalogo.html?gender=dama",
  "/catalogo.html?gender=caballero",
  "/catalogo.html?gender=unisex",
  "/catalogo.html?category=arabe",
  "/catalogo.html?category=nicho",
  "/catalogo.html?category=disenador",
  "/aviso-legal.html",
  "/privacidad.html",
  "/cookies.html",
];

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const site = (env.SITE_URL || url.origin).replace(/\/$/, "");
    try {
      switch (url.pathname) {
        case "/":
          return await serveHome(request, env, url);
        case "/producto.html":
          return await serveProduct(request, env, ctx, url, site);
        case "/sitemap.xml":
          return await serveSitemap(env, ctx, url, site);
        case "/robots.txt":
          return serveRobots(url, env);
        default:
          return env.ASSETS.fetch(request);
      }
    } catch (err) {
      // Cualquier error inesperado: la página estática de siempre.
      console.error("worker error", url.pathname, err && err.stack);
      return env.ASSETS.fetch(request);
    }
  },
};

// ── helpers ─────────────────────────────────────────────────────────────────

function withHeaders(response, extra = {}, status) {
  const headers = new Headers(response.headers);
  for (const [k, v] of Object.entries({ ...SECURITY_HEADERS, ...extra })) headers.set(k, v);
  return new Response(response.body, { status: status ?? response.status, headers });
}

/** Pide un archivo estático por su ruta, sin cabeceras condicionales. */
function asset(env, url, path) {
  return env.ASSETS.fetch(new Request(new URL(path, url)));
}

async function notFoundPage(env, url) {
  const page = await asset(env, url, "/404.html");
  return withHeaders(page, { "Cache-Control": "public, max-age=0, must-revalidate" }, 404);
}

function escapeAttr(text) {
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function truncate(text, max = 155) {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(" ")).replace(/[\s,.;:—-]+$/, "")}…`;
}

/** Foto para compartir: 1200×630 con fondo blanco y en JPG (lo que mejor leen WhatsApp/Facebook). */
function shareImage(url) {
  if (typeof url !== "string" || !url.includes("/image/upload/")) return null;
  return url.replace("/image/upload/", "/image/upload/c_pad,b_white,w_1200,h_630,f_jpg,q_auto/");
}

async function fetchJson(path, timeoutMs, ctx, cacheSeconds) {
  const cache = caches.default; // en *.workers.dev no guarda nada (no pasa nada)
  const cacheKey = new Request(`https://maison-cache.internal${path}`);
  const cached = await cache.match(cacheKey);
  if (cached) return { status: 200, data: await cached.json(), fromCache: true };

  const res = await fetch(API + path, { signal: AbortSignal.timeout(timeoutMs), headers: { Accept: "application/json" } });
  if (!res.ok) return { status: res.status, data: null };
  const data = await res.json();
  const toCache = new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json", "Cache-Control": `public, max-age=${cacheSeconds}` },
  });
  ctx.waitUntil(cache.put(cacheKey, toCache));
  return { status: 200, data };
}

// ── "/" ─────────────────────────────────────────────────────────────────────

async function serveHome(request, env, url) {
  // Se reenvían las cabeceras del navegador (If-None-Match...) para que
  // pueda recibir un 304 "no cambió": el contenido de index.html no se toca.
  const res = await env.ASSETS.fetch(new Request(new URL("/index.html", url), request));
  return withHeaders(res);
}

// ── "/producto.html?id=N" ───────────────────────────────────────────────────

async function serveProduct(request, env, ctx, url, site) {
  const id = url.searchParams.get("id") || "";
  if (!/^\d+$/.test(id)) return notFoundPage(env, url);

  let result;
  try {
    // Clave de caché = solo el id: ?utm_source=... o ?fbclid=... no
    // obligan a volver a pedirle el producto a Render.
    result = await fetchJson(`/products/${id}`, API_TIMEOUT_MS, ctx, PRODUCT_CACHE_SECONDS);
  } catch {
    result = { status: 0, data: null }; // Render lento o caído
  }
  if (result.status === 404) return notFoundPage(env, url);

  const page = await asset(env, url, "/producto.html");
  const htmlHeaders = { "Cache-Control": "public, max-age=0, must-revalidate" };
  if (!result.data) return withHeaders(page, htmlHeaders); // API falló: página normal

  const product = result.data.data || result.data;
  const meta = productMeta(product, site, id);
  const rewritten = new HTMLRewriter()
    .on("title", { element: (el) => el.setInnerContent(meta.title) })
    .on('meta[name="description"]', { element: (el) => el.setAttribute("content", meta.description) })
    .on('link[rel="canonical"]', { element: (el) => el.setAttribute("href", meta.url) })
    .on('meta[property="og:title"]', { element: (el) => el.setAttribute("content", meta.title) })
    .on('meta[property="og:description"]', { element: (el) => el.setAttribute("content", meta.description) })
    .on('meta[property="og:url"]', { element: (el) => el.setAttribute("content", meta.url) })
    .on('meta[property="og:image"]', { element: (el) => meta.image && el.setAttribute("content", meta.image) })
    .on('meta[property="og:type"]', { element: (el) => el.setAttribute("content", "product") })
    .on('meta[name="twitter:title"]', { element: (el) => el.setAttribute("content", meta.title) })
    .on('meta[name="twitter:description"]', { element: (el) => el.setAttribute("content", meta.description) })
    .on('meta[name="twitter:image"]', { element: (el) => meta.image && el.setAttribute("content", meta.image) })
    .on("head", {
      element: (el) =>
        el.append(`<script type="application/ld+json">${meta.jsonLd}</script>`, { html: true }),
    })
    .transform(page);

  // El HTML cambia según el producto: sin ETag del archivo original (si no,
  // el navegador podría quedarse con la versión de otro perfume).
  const out = withHeaders(rewritten, htmlHeaders);
  out.headers.delete("ETag");
  return out;
}

function productMeta(product, site, id) {
  const url = `${site}/producto.html?id=${id}`;
  const title = `${product.name} | ${SITE_NAME}`;
  const kind = product.type === "preparado" ? "Preparado disponible en 1 oz, 3 oz y combos" : "Perfume original";
  const description = truncate(
    product.description ||
      `${product.name}${product.brand ? ` de ${product.brand}` : ""}. ${kind} en ${SITE_NAME}, con envío a toda Colombia y pedidos por WhatsApp.`,
  );
  const images = (product.images || []).map((img) => img.url).filter(Boolean);
  const image = shareImage(images[0]);

  // Precio y disponibilidad: originales = un precio (con descuento si lo
  // tiene); preparados = rango entre su presentación más barata y la más cara.
  const variants = product.variants || [];
  let offers;
  if (product.type === "preparado" && variants.length > 0) {
    const prices = variants.map((v) => Number(v.price)).filter((n) => n > 0);
    offers = {
      "@type": "AggregateOffer",
      priceCurrency: "COP",
      lowPrice: Math.min(...prices),
      highPrice: Math.max(...prices),
      offerCount: variants.length,
      availability: variants.some((v) => Number(v.stock) > 0) ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url,
    };
  } else {
    const price = Number(product.discounted_price ?? product.price ?? product.original_price);
    if (price > 0) {
      offers = {
        "@type": "Offer",
        priceCurrency: "COP",
        price,
        availability: Number(product.stock) > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        itemCondition: "https://schema.org/NewCondition",
        url,
        seller: { "@type": "Organization", name: SITE_NAME },
      };
    }
  }

  const graph = [
    {
      "@type": "Product",
      "@id": `${url}#producto`,
      name: product.name,
      description,
      sku: String(product.id ?? id),
      ...(images.length && { image: images.slice(0, 3).map((u) => u.replace("/image/upload/", "/image/upload/f_jpg,q_auto,w_1200/")) }),
      ...(product.brand && { brand: { "@type": "Brand", name: product.brand } }),
      ...(product.category && { category: product.category }),
      ...(offers && { offers }),
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Inicio", item: `${site}/` },
        { "@type": "ListItem", position: 2, name: "Catálogo", item: `${site}/catalogo.html` },
        { "@type": "ListItem", position: 3, name: product.name, item: url },
      ],
    },
  ];
  // "<" escapado: un nombre con "</script>" no puede cerrar la etiqueta.
  const jsonLd = JSON.stringify({ "@context": "https://schema.org", "@graph": graph }).replace(/</g, "\\u003c");

  return {
    url,
    title,
    description,
    image,
    jsonLd,
  };
}

// ── "/sitemap.xml" ──────────────────────────────────────────────────────────

async function serveSitemap(env, ctx, url, site) {
  const cache = caches.default;
  const cacheKey = new Request(`${site}/sitemap.xml#cache`);
  const lastGood = new Request(`${site}/sitemap.xml#last-good`);
  const cached = await cache.match(cacheKey);
  if (cached) return withHeaders(cached);

  let productIds = null;
  try {
    const res = await fetch(`${API}/products?limit=1000&sortBy=newest`, { signal: AbortSignal.timeout(SITEMAP_TIMEOUT_MS) });
    if (res.ok) productIds = ((await res.json()).data || []).map((p) => p.id);
  } catch {
    productIds = null;
  }

  if (!productIds) {
    // API caída: la última versión buena (si hay) o, como mínimo, las páginas fijas.
    const previous = await cache.match(lastGood);
    if (previous) return withHeaders(previous);
  }

  const paths = [...STATIC_PATHS, ...(productIds || []).map((id) => `/producto.html?id=${id}`)];
  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    paths.map((p) => `  <url><loc>${escapeAttr(site + p)}</loc></url>`).join("\n") +
    `\n</urlset>\n`;
  const seconds = productIds ? SITEMAP_CACHE_SECONDS : 300;
  const response = new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": `public, max-age=${seconds}` },
  });
  if (productIds) {
    ctx.waitUntil(cache.put(cacheKey, response.clone()));
    const keep = new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=2592000" } });
    ctx.waitUntil(cache.put(lastGood, keep));
  }
  return withHeaders(response);
}

// ── "/robots.txt" ───────────────────────────────────────────────────────────

function serveRobots(url, env) {
  // Solo el dominio configurado en SITE_URL se deja indexar. Sin SITE_URL
  // (todavía sin dominio) o desde otra dirección: bloqueado.
  const site = env.SITE_URL ? env.SITE_URL.replace(/\/$/, "") : null;
  const isMainSite = site !== null && url.host === new URL(site).host;
  const body = isMainSite
    ? `User-agent: *\nAllow: /\n\nSitemap: ${site}/sitemap.xml\n`
    : // Copia de prueba (workers.dev u otra): que Google no la indexe.
      "User-agent: *\nDisallow: /\n";
  return withHeaders(
    new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" } }),
  );
}

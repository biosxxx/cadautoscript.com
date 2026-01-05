const fs = require('fs');
const path = require('path');

const BUILD_DIR = path.join(__dirname, '..', 'build');
const SOURCE_SITEMAP = path.join(BUILD_DIR, 'sitemap.xml');

const SECTION_RULES = [
  {name: 'utilities', prefix: '/utilities/'},
  {name: 'mini-games', prefix: '/mini-games/'},
  {name: 'docs', prefix: '/docs/'},
  {name: 'blog', prefix: '/blog'},
];

function readSourceSitemap() {
  if (!fs.existsSync(SOURCE_SITEMAP)) {
    throw new Error('Missing build/sitemap.xml. Run `npm run build` first.');
  }
  return fs.readFileSync(SOURCE_SITEMAP, 'utf8');
}

function extractUrls(xml) {
  const matches = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)];
  return matches.map((match) => match[1]);
}

function getOrigin(urls) {
  const first = urls[0];
  if (!first) {
    throw new Error('No URLs found in sitemap.xml.');
  }
  return new URL(first).origin;
}

function groupUrls(urls) {
  const groups = new Map();
  SECTION_RULES.forEach((rule) => groups.set(rule.name, []));
  groups.set('main', []);

  urls.forEach((url) => {
    const pathname = new URL(url).pathname;
    const rule = SECTION_RULES.find((item) => pathname.startsWith(item.prefix));
    if (rule) {
      groups.get(rule.name).push(url);
    } else {
      groups.get('main').push(url);
    }
  });

  return groups;
}

function buildUrlset(urls) {
  const entries = urls
    .map((url) => `  <url><loc>${url}</loc></url>`)
    .join('\n');
  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    `${entries}\n` +
    '</urlset>\n'
  );
}

function buildSitemapIndex(origin, sitemapNames, lastmod) {
  const entries = sitemapNames
    .map((name) => {
      const loc = `${origin}/sitemap-${name}.xml`;
      return `  <sitemap><loc>${loc}</loc><lastmod>${lastmod}</lastmod></sitemap>`;
    })
    .join('\n');
  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    `${entries}\n` +
    '</sitemapindex>\n'
  );
}

function buildRobotsTxt(origin) {
  return (
    'User-agent: *\n' +
    'Allow: /\n' +
    'Disallow: /admin/\n' +
    `Sitemap: ${origin}/sitemap.xml\n` +
    `Sitemap: ${origin}/sitemap-index.xml\n`
  );
}

function writeSitemaps(groups, origin) {
  const sitemapNames = [];

  for (const [name, urls] of groups.entries()) {
    if (urls.length === 0) {
      continue;
    }
    const filename = `sitemap-${name}.xml`;
    const target = path.join(BUILD_DIR, filename);
    fs.writeFileSync(target, buildUrlset(urls));
    sitemapNames.push(name);
  }

  const indexPath = path.join(BUILD_DIR, 'sitemap-index.xml');
  const lastmod = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(indexPath, buildSitemapIndex(origin, sitemapNames, lastmod));
}

function main() {
  const xml = readSourceSitemap();
  const urls = extractUrls(xml);
  const origin = getOrigin(urls);
  const groups = groupUrls(urls);
  writeSitemaps(groups, origin);
  fs.writeFileSync(path.join(BUILD_DIR, 'robots.txt'), buildRobotsTxt(origin));
  console.log('Section sitemaps generated in build/.');
}

main();

import axios from 'axios';
import * as cheerio from 'cheerio';
import { prisma } from '../../../../packages/database/src/index';

const EDUCARRIERE_BASE_URL = 'https://emploi.educarriere.ci';
const EDUCARRIERE_LIST_URLS = [
  `${EDUCARRIERE_BASE_URL}/index.php/`,
  `${EDUCARRIERE_BASE_URL}/emploi/page/emploi/0`,
  `${EDUCARRIERE_BASE_URL}/emploi/page/emploi/1`,
];

const http = axios.create({
  timeout: 15000,
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
    'Cache-Control': 'no-cache',
    Pragma: 'no-cache',
  },
});

const MAX_JOBS_PER_SYNC = 25;

interface EducarriereListItem {
  title: string;
  url: string;
  platformId: string;
  company: string | null;
  location: string | null;
  contractType: string | null;
  postedAt: Date | null;
}

interface EducarriereJobDetails {
  title: string;
  company: string;
  location: string | null;
  description: string | null;
  contractType: string | null;
  contactEmail: string | null;
  url: string;
  platformId: string;
  postedAt: Date | null;
}

export interface SyncEducarriereJobsResult {
  scanned: number;
  createdOrUpdated: number;
  skipped: number;
  /** IDs des offres créées pour la première fois (pas les mises à jour). */
  createdJobIds: string[];
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomDelay(): number {
  return 500 + Math.floor(Math.random() * 700);
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function absoluteUrl(href: string): string {
  if (href.startsWith('http://') || href.startsWith('https://')) {
    return href;
  }

  return new URL(href, EDUCARRIERE_BASE_URL).toString();
}

function extractPlatformIdFromUrl(url: string): string {
  const match = url.match(/offre-(\d+)(?:-|\/|\.|$)/i);
  return match?.[1] ?? url;
}

function parseFrenchDate(value: string): Date | null {
  const normalized = normalizeWhitespace(value)
    .replace('Publié le', '')
    .replace('Publiée le', '')
    .trim();

  const match = normalized.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (match) {
    const [, day, month, year] = match;
    return new Date(`${year}-${month}-${day}T00:00:00.000Z`);
  }

  return null;
}

function cleanEmail(raw: string): string {
  return raw.replace(/[.,;:)\]}>"'`]+$/, '').trim();
}

export function extractContactEmail(text: string): string | null {
  if (!text) return null;
  const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6})\b/gi;
  const matches = text.match(emailRegex) || [];

  for (const m of matches) {
    const cleaned = cleanEmail(m);
    const lower = cleaned.toLowerCase();
    if (
      !lower.includes('educarriere') &&
      !lower.includes('example.com') &&
      !lower.includes('domain.com') &&
      !lower.includes('votresite.com') &&
      !lower.startsWith('plainte@') &&
      !lower.startsWith('support@') &&
      !lower.startsWith('noreply@') &&
      !lower.startsWith('contact@educarriere')
    ) {
      return cleaned;
    }
  }

  return null;
}

const GENERIC_COMPANIES = new Set([
  'entreprise non spécifiée',
  'une entreprise',
  'une importante entreprise',
  'entreprise',
  'confidentiel',
  'société',
  'recruteur',
  'recrutement',
  'anonyme',
  'un particulier',
  'particulier',
]);

export function isGenericCompany(name: string): boolean {
  if (!name || name.trim().length < 2) return true;
  const lower = name.toLowerCase().trim();
  return (
    GENERIC_COMPANIES.has(lower) ||
    /^une?\s+(?:grande\s+|importante\s+|nouvelle\s+)?(?:entreprise|société|structure|ong|multinationale)/i.test(
      lower
    )
  );
}

export function extractCompanyName(
  $: cheerio.CheerioAPI,
  rawText: string,
  title: string,
  contactEmail: string | null
): string {
  // 1. Specific selector in Educarriere job header
  const johCompany = normalizeWhitespace($('.joh-company-name').text().replace(/[\n\r\t]/g, ' '));
  if (johCompany && !isGenericCompany(johCompany)) {
    return johCompany;
  }

  // 2. Look in meta tags (og:site_name if not Educarriere)
  const ogSite = $('meta[property="og:site_name"]').attr('content');
  if (ogSite && !ogSite.toLowerCase().includes('educarriere') && !isGenericCompany(ogSite)) {
    return normalizeWhitespace(ogSite);
  }

  // 3. Normalized text patterns in description / page
  const clean = rawText
    .replace(/[\u2018\u2019\u201A\u201B']/g, "'")
    .replace(/\s+/g, ' ');

  // Pattern A: "POURQUOI REJOINDRE [COMPANY] ?"
  const rejoindreMatch = clean.match(/POURQUOI REJOINDRE\s+([A-Za-z0-9&.'\s-]{2,35})\s*\?/i);
  if (rejoindreMatch && rejoindreMatch[1] && !isGenericCompany(rejoindreMatch[1])) {
    return rejoindreMatch[1].trim();
  }

  // Pattern B: "[Company], entreprise/société/cabinet/startup spécialisée/recherche..."
  const descAfterPrefix = clean.replace(/^.*?détails de l['’]offre\s+/i, '');
  const introMatch = descAfterPrefix.match(
    /^([A-Za-z0-9&.'\s-]{2,35}),?\s+(?:entreprise|société|cabinet|startup|groupe|agence)\s+(?:spécialisée|leader|basée|évoluant|active|recherche|recrute)/i
  );
  if (introMatch && introMatch[1] && !isGenericCompany(introMatch[1])) {
    return introMatch[1].trim();
  }

  // Pattern C: "[Company] recrute" or "[Company] recherche"
  const recruteMatch = clean.match(
    /(?:[)\]•–\-\n|]|\b(?:emploi|poste)\s*:?)\s*([A-Z0-9][A-Za-z0-9&.'\s-]{2,30})\s+(?:recrute|recherche|embauche)\b/i
  );
  if (recruteMatch && recruteMatch[1]) {
    const candidate = recruteMatch[1].trim();
    if (
      !isGenericCompany(candidate) &&
      !/^(?:offre|détails|le cabinet|la société|notre|nous|important|un|une)\b/i.test(candidate)
    ) {
      return candidate;
    }
  }

  // Pattern D: "Entreprise : [Company]" or "Société : [Company]"
  const companyMatch = clean.match(
    /(?:Entreprise|Recruteur|Société)\s*:?\s+([A-Za-z0-9&.'\s-]{2,35})(?:\s*[-–|\n]|\s+Lieu|\s+Niveau|\s+Date limite|\s+Publi[ée]e? le|\s+Profil|\s+Description|$)/i
  );
  if (companyMatch && companyMatch[1] && !isGenericCompany(companyMatch[1])) {
    return companyMatch[1].trim();
  }

  // Pattern E: If the title ends with "chez [Company]" or "pour [Company]"
  const chezMatch = title.match(/\b(?:chez|pour)\s+([A-Za-z0-9&.'\s-]{2,30})$/i);
  if (chezMatch && chezMatch[1] && !isGenericCompany(chezMatch[1])) {
    return chezMatch[1].trim();
  }

  // 4. Fallback from professional contact email domain
  if (contactEmail) {
    const domainMatch = contactEmail.match(/@([a-zA-Z0-9-]+)\.([a-zA-Z]{2,})/);
    if (domainMatch) {
      const domainName = domainMatch[1].toLowerCase();
      const publicProviders = [
        'gmail',
        'yahoo',
        'hotmail',
        'outlook',
        'live',
        'icloud',
        'proton',
        'mail',
        'yopmail',
      ];
      if (!publicProviders.includes(domainName)) {
        return domainName.charAt(0).toUpperCase() + domainName.slice(1);
      }
    }
  }

  if (johCompany) return johCompany;
  return 'Entreprise non spécifiée';
}

async function scrapeRecentJobLinks(): Promise<EducarriereListItem[]> {
  const seen = new Set<string>();
  const jobs: EducarriereListItem[] = [];

  for (const listUrl of EDUCARRIERE_LIST_URLS) {
    const response = await http.get(listUrl);
    const html = String(response.data ?? '');
    const $ = cheerio.load(html);

    $('a[href*="/offre-"]').each((_, element) => {
      const href = $(element).attr('href');
      const rawTitle = normalizeWhitespace($(element).text());

      if (!href) {
        return;
      }

      const url = absoluteUrl(href);
      if (seen.has(url)) {
        return;
      }

      seen.add(url);
      jobs.push({
        title: rawTitle || `Offre ${extractPlatformIdFromUrl(url)}`,
        url,
        platformId: extractPlatformIdFromUrl(url),
        company: null,
        location: null,
        contractType: null,
        postedAt: null,
      });
    });

    const offerUrlMatches = html.match(/https?:\/\/emploi\.educarriere\.ci\/offre-[^"'\s<>]+/gi) ?? [];

    for (const matchedUrl of offerUrlMatches) {
      const url = absoluteUrl(matchedUrl);
      if (seen.has(url)) {
        continue;
      }

      seen.add(url);
      jobs.push({
        title: `Offre ${extractPlatformIdFromUrl(url)}`,
        url,
        platformId: extractPlatformIdFromUrl(url),
        company: null,
        location: null,
        contractType: null,
        postedAt: null,
      });
    }

    const relativeOfferMatches = html.match(/\/offre-[^"'\s<>]+/gi) ?? [];

    for (const matchedPath of relativeOfferMatches) {
      const url = absoluteUrl(matchedPath);
      if (seen.has(url)) {
        continue;
      }

      seen.add(url);
      jobs.push({
        title: `Offre ${extractPlatformIdFromUrl(url)}`,
        url,
        platformId: extractPlatformIdFromUrl(url),
        company: null,
        location: null,
        contractType: null,
        postedAt: null,
      });
    }
  }

  return jobs.slice(0, MAX_JOBS_PER_SYNC);
}

async function scrapeJobDetails(item: EducarriereListItem): Promise<EducarriereJobDetails | null> {
  const response = await http.get(item.url);
  const html = String(response.data ?? '');
  const $ = cheerio.load(html);

  const title = normalizeWhitespace(
    $('h1').first().text() ||
      $('meta[property="og:title"]').attr('content') ||
      $('title').first().text() ||
      item.title
  );
  if (!title) {
    return null;
  }

  const pageText = normalizeWhitespace($('body').clone().find('script, style').remove().end().text());
  const htmlText = normalizeWhitespace(html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' '));

  const descriptionHeader = $('h2, h3, h4, h5, strong').filter((_, el) => {
    const text = normalizeWhitespace($(el).text()).toLowerCase();
    return text.includes("détails de l'offre") || text.includes('description du poste');
  }).first();

  let description = descriptionHeader.length
    ? normalizeWhitespace(descriptionHeader.parent().text())
    : null;

  if (!description || description.length < 40) {
    const descriptionLabel = $('*:contains("Description du poste"), *:contains("Détails de l\'offre")').first();
    description = descriptionLabel.length
      ? normalizeWhitespace(descriptionLabel.parent().text())
      : description;
  }

  if (!description || description.length < 40) {
    const articleText = normalizeWhitespace($('main, article, .content, .entry-content, .post-content, body').first().text());
    description = articleText.length > 40 ? articleText : description;
  }

  const detailText = normalizeWhitespace(
    $('h1').first().parent().text() ||
      $('main, article, .content, .entry-content, .post-content').first().text() ||
      pageText
  );

  const locationMatch = detailText.match(/Lieu\s+([\w\s,\-’'()]+?)\s+Niveau/i)
    ?? detailText.match(/Lieu\s+([\w\s,\-’'()]+?)\s+Date limite/i);

  const contractMatch = detailText.match(/\b(Stage|CDD|CDI|Interim|Intérim|Freelance|Consultance|Temps plein|Temps partiel|Emploi)\b/i);

  const contactEmail = extractContactEmail(detailText || pageText || html);
  const company = extractCompanyName($, detailText || pageText, title, contactEmail);

  const postedAtMatch = detailText.match(/(?:Date d[’']édition|Publi[ée]e? le)\s*:?\s+(\d{2}\/\d{2}\/\d{4})/i)
    ?? htmlText.match(/(?:Date d[’']édition|Publi[ée]e? le)\s*:?\s+(\d{2}\/\d{2}\/\d{4})/i);

  return {
    title,
    company: company || 'Entreprise non spécifiée',
    location: item.location || (locationMatch ? normalizeWhitespace(locationMatch[1]) : null),
    description: description ? description.slice(0, 20000) : null,
    contractType: item.contractType || (contractMatch ? contractMatch[1] : null),
    contactEmail,
    url: item.url,
    platformId: item.platformId,
    postedAt: item.postedAt || (postedAtMatch ? parseFrenchDate(postedAtMatch[0]) : null),
  };
}

export async function syncEducarriereJobs(): Promise<SyncEducarriereJobsResult> {
  const listings = await scrapeRecentJobLinks();

  // Pré-charger les URLs déjà en base pour distinguer création vs mise à jour
  const listingUrls = listings.map((l) => l.url);
  const existingUrls = new Set(
    (await prisma.job.findMany({ where: { url: { in: listingUrls } }, select: { url: true } })).map(
      (j) => j.url
    )
  );

  let createdOrUpdated = 0;
  let skipped = 0;
  const createdJobIds: string[] = [];

  for (const listing of listings) {
    const isNew = !existingUrls.has(listing.url);

    try {
      await sleep(randomDelay());
      const details = await scrapeJobDetails(listing);

      if (!details) {
        skipped += 1;
        continue;
      }

      const description = details.description
        ? [
            details.contractType ? `Type de contrat: ${details.contractType}` : null,
            details.description,
          ]
            .filter(Boolean)
            .join('\n\n')
        : details.contractType
          ? `Type de contrat: ${details.contractType}`
          : null;

      const job = await prisma.job.upsert({
        where: { url: details.url },
        update: {
          platform: 'educarriere',
          platformId: details.platformId,
          title: details.title,
          company: details.company,
          location: details.location,
          description,
          contactEmail: details.contactEmail,
          postedAt: details.postedAt,
          retrievedAt: new Date(),
        },
        create: {
          platform: 'educarriere',
          platformId: details.platformId,
          title: details.title,
          company: details.company,
          location: details.location,
          description,
          contactEmail: details.contactEmail,
          url: details.url,
          postedAt: details.postedAt,
          retrievedAt: new Date(),
        },
        select: { id: true },
      });

      if (isNew) {
        createdJobIds.push(job.id);
      }

      createdOrUpdated += 1;
    } catch (error) {
      skipped += 1;
      console.error(`[Educarriere] Failed to sync job ${listing.url}`, error);
    }
  }

  return {
    scanned: listings.length,
    createdOrUpdated,
    skipped,
    createdJobIds,
  };
}

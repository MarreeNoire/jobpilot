// Background service worker for the Chrome extension
console.log('JobPilot extension background service worker started');

// Listen for messages from content script or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received message:', message);

  // Handle different message types
  switch (message.type) {
    case 'GET_JOB_INFO':
      // Extract job information from the current tab
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            func: extractJobInfoFromPage
          }, (results) => {
            if (results && results[0]) {
              sendResponse({ success: true, data: results[0].result });
            } else {
              sendResponse({ success: false, error: 'Failed to extract job info' });
            }
          });
        } else {
          sendResponse({ success: false, error: 'No active tab found' });
        }
      });
      return true; // Indicates we want to send a response asynchronously

    case 'APPLY_TO_JOB':
      // Handle job application logic
      console.log('Received apply to job request:', message.payload);
      // This would typically communicate with the backend
      sendResponse({ success: true, message: 'Application process initiated' });
      return true;

    default:
      sendResponse({ success: false, error: 'Unknown message type' });
      return true;
  }
});

// Function to extract job information from a page
function extractJobInfoFromPage(): any {
  const jobInfo: any = {
    title: '',
    company: '',
    description: '',
    location: '',
    salary: '',
    contactEmail: null,
    url: window.location.href,
    platform: detectPlatform(window.location.hostname)
  };

  // Try to extract job title
  const titleSelectors = [
    'h1',
    '[data-job-title]',
    '.job-title',
    '.jobsearch-JobInfoHeader-title',
    '.top-card-layout__title',
    '.jobs-unified-top-card__job-title',
    'title'
  ];

  for (const selector of titleSelectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent?.trim()) {
      jobInfo.title = element.textContent.trim();
      break;
    }
  }

  // Try to extract company name
  const companySelectors = [
    '.joh-company-name',
    '[data-company-name]',
    '.company-name',
    '.employer-name',
    '[aria-label*="company" i]',
    '.topcard__org-name-link',
    '.job-details-jobs-unified-top-card__company-name',
    '.jobs-unified-top-card__company-name',
    '[data-testid="inlineHeader-companyName"]',
    '.jobsearch-JobInfoHeader-companyName',
    '[data-testid="job-company-name"]',
    'a[href*="/company/"]'
  ];

  for (const selector of companySelectors) {
    const element = document.querySelector(selector);
    const text = element?.textContent?.trim();
    if (text && !/^(?:entreprise|une entreprise|confidentiel|anonyme)$/i.test(text)) {
      jobInfo.company = text;
      break;
    }
  }

  // Fallback: meta tag og:site_name
  if (!jobInfo.company) {
    const ogSite = document.querySelector('meta[property="og:site_name"]')?.getAttribute('content');
    if (ogSite && !ogSite.toLowerCase().includes('educarriere')) {
      jobInfo.company = ogSite.trim();
    }
  }

  // Try to extract job description
  const descSelectors = [
    '[data-job-description]',
    '.job-description',
    '.description',
    '#job-description',
    '#jobDescriptionText',
    '.show-more-less-html__markup',
    '.jobs-description__content',
    'main',
    'article'
  ];

  for (const selector of descSelectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent?.trim()) {
      jobInfo.description = element.textContent.trim();
      break;
    }
  }

  // Extract contact email from page body / description
  const pageText = document.body ? document.body.innerText || document.body.textContent || '' : '';
  const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6})\b/gi;
  const emails = pageText.match(emailRegex) || [];
  const ignoredDomains = ['linkedin.com', 'indeed.com', 'glassdoor.com', 'monster.com', 'educarriere.ci', 'educarriere.net', 'example.com', 'domain.com'];

  for (const email of emails) {
    const cleaned = email.replace(/[.,;:)\]}>"'`]+$/, '').trim();
    const lower = cleaned.toLowerCase();
    const isIgnored = ignoredDomains.some(d => lower.includes(d)) || lower.startsWith('support@') || lower.startsWith('noreply@') || lower.startsWith('plainte@');
    if (!isIgnored) {
      jobInfo.contactEmail = cleaned;
      break;
    }
  }

  // If company is still generic or empty, try detecting from description or title
  if (!jobInfo.company || /^(?:entreprise non spécifiée|entreprise|une entreprise)$/i.test(jobInfo.company)) {
    const cleanDesc = (jobInfo.description || '').replace(/\s+/g, ' ');
    const recruteMatch = cleanDesc.match(/(?:^|[.!?\n•–-])\s*([A-Z0-9][A-Za-z0-9’'&.\s-]{2,30})\s+(?:recrute|recherche|embauche)\b/i);
    if (recruteMatch && recruteMatch[1] && !/^(?:offre|détails|le cabinet|la société|notre|nous|un|une)\b/i.test(recruteMatch[1])) {
      jobInfo.company = recruteMatch[1].trim();
    } else if (jobInfo.contactEmail) {
      const domainMatch = jobInfo.contactEmail.match(/@([a-zA-Z0-9-]+)\./);
      if (domainMatch && !['gmail', 'yahoo', 'hotmail', 'outlook', 'live', 'icloud'].includes(domainMatch[1].toLowerCase())) {
        jobInfo.company = domainMatch[1].charAt(0).toUpperCase() + domainMatch[1].slice(1);
      }
    }
  }

  if (!jobInfo.company) {
    jobInfo.company = 'Entreprise non spécifiée';
  }

  return jobInfo;
}

// Simple platform detection based on hostname
function detectPlatform(hostname: string): string {
  const lowerHost = hostname.toLowerCase();

  if (lowerHost.includes('linkedin.com')) return 'linkedin';
  if (lowerHost.includes('indeed.com')) return 'indeed';
  if (lowerHost.includes('glassdoor.com')) return 'glassdoor';
  if (lowerHost.includes('monster.com')) return 'monster';
  if (lowerHost.includes('ziprecruiter.com')) return 'ziprecruiter';

  // Check if it looks like a company career page
  const careerIndicators = ['careers', 'jobs', 'employment', 'work-with-us'];
  if (careerIndicators.some(indicator => lowerHost.includes(indicator))) {
    return 'company_career';
  }

  return 'generic';
}
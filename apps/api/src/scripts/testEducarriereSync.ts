import axios from 'axios';
import { prisma } from '../../../../packages/database/src/index';
import { syncEducarriereJobs } from '../services/educarriereScraper';

async function inspectListing() {
  const response = await axios.get('https://emploi.educarriere.ci/index.php/', {
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

  const html = String(response.data ?? '');
  console.log('[Test] Listing status:', response.status);
  console.log('[Test] Listing length:', html.length);
  console.log('[Test] Contains /offre-:', html.includes('/offre-'));
}

async function main() {
  await inspectListing();

  console.log('[Test] Starting Educarriere sync...');
  const result = await syncEducarriereJobs();
  console.log('[Test] Sync result:', result);

  const latestJobs = await prisma.job.findMany({
    where: { platform: 'educarriere' },
    orderBy: { retrievedAt: 'desc' },
    take: 5,
    select: {
      id: true,
      title: true,
      company: true,
      location: true,
      url: true,
      postedAt: true,
      retrievedAt: true,
    },
  });

  console.log('[Test] Latest Educarriere jobs:');
  for (const job of latestJobs) {
    console.log(job);
  }
}

main()
  .catch((error) => {
    console.error('[Test] Educarriere sync failed', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

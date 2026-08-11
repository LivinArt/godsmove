/**
 * PHASE 3 — Performance Gate
 * Measures actual HTTP response times and detects key patterns
 */
import http from 'http';
import https from 'https';

const PAGES = [
  { name: 'Homepage', url: 'http://localhost:3000/' },
  { name: 'Drops', url: 'http://localhost:3000/drops' },
  { name: 'Exclusive Rack', url: 'http://localhost:3000/exclusive-rack' },
  { name: 'Membership', url: 'http://localhost:3000/membership' },
  { name: 'Profile', url: 'http://localhost:3000/profile' },
  { name: 'Profile?tab=prebookings', url: 'http://localhost:3000/profile?tab=prebookings' },
  { name: 'Admin Pre-Bookings', url: 'http://localhost:3000/admin/pre-bookings' },
  { name: 'Admin Orders', url: 'http://localhost:3000/admin/orders' },
  { name: 'Checkout', url: 'http://localhost:3000/checkout' },
];

const P = '\x1b[32m[PASS]\x1b[0m';
const F = '\x1b[31m[FAIL]\x1b[0m';
const W = '\x1b[33m[WARN]\x1b[0m';
const I = '\x1b[36m  -->\x1b[0m';

let pass = 0, fail = 0;
function assert(cond: boolean, msg: string) {
  if (cond) { console.log(`  ${P} ${msg}`); pass++; }
  else { console.log(`  ${F} ${msg}`); fail++; }
}

function fetchPage(url: string): Promise<{ status: number; bytes: number; ttfb: number; total: number }> {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    let ttfb = 0;
    let bytes = 0;
    const req = http.get(url, (res) => {
      ttfb = Date.now() - start;
      res.on('data', (chunk) => { bytes += chunk.length; });
      res.on('end', () => resolve({ status: res.statusCode || 0, bytes, ttfb, total: Date.now() - start }));
    });
    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

async function main() {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  GODSMOVE FINAL PRODUCTION GATE — PHASE 3: PERFORMANCE');
  console.log('═══════════════════════════════════════════════════════════\n');

  const results: { name: string; status: number; ttfb: number; total: number; bytes: number }[] = [];

  // Warm up first
  console.log('  Warming up server...');
  try { await fetchPage('http://localhost:3000/'); } catch {}
  await new Promise(r => setTimeout(r, 500));

  console.log('  Measuring response times (3 runs each, median):\n');

  for (const page of PAGES) {
    const times: number[] = [];
    const ttfbs: number[] = [];
    let lastStatus = 0;
    let lastBytes = 0;

    for (let i = 0; i < 3; i++) {
      try {
        const r = await fetchPage(page.url);
        times.push(r.total);
        ttfbs.push(r.ttfb);
        lastStatus = r.status;
        lastBytes = r.bytes;
      } catch (e) {
        times.push(9999);
        ttfbs.push(9999);
      }
      await new Promise(r => setTimeout(r, 200));
    }

    times.sort((a, b) => a - b);
    ttfbs.sort((a, b) => a - b);
    const median = times[1];
    const medianTtfb = ttfbs[1];

    results.push({ name: page.name, status: lastStatus, ttfb: medianTtfb, total: median, bytes: lastBytes });

    const speedLabel = median < 500 ? '🟢 FAST' : median < 1500 ? '🟡 OK' : median < 3000 ? '🟠 SLOW' : '🔴 VERY SLOW';
    console.log(`  ${page.name.padEnd(28)} HTTP ${lastStatus} | TTFB: ${medianTtfb}ms | Total: ${median}ms | ${(lastBytes/1024).toFixed(0)}KB | ${speedLabel}`);
  }

  console.log('\n  ── Bottleneck Analysis ──');
  const sorted = [...results].sort((a, b) => b.total - a.total);
  const top3 = sorted.slice(0, 3);
  console.log('  Top 3 slowest pages:');
  for (const r of top3) {
    console.log(`  ${r.name.padEnd(28)} ${r.total}ms total, ${r.ttfb}ms TTFB, ${(r.bytes/1024).toFixed(0)}KB`);
  }

  console.log('\n  ── Thresholds ──');
  for (const r of results) {
    assert(r.status === 200, `${r.name}: HTTP 200 OK`);
    assert(r.total < 5000, `${r.name}: total response < 5s (was ${r.total}ms)`);
    if (r.total > 3000) console.log(`  ${W} ${r.name}: ${r.total}ms is slow — investigate DB queries or heavy SSR data fetch`);
  }

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log(`  PHASE 3 RESULTS: ${pass} PASS | ${fail} FAIL`);
  console.log('═══════════════════════════════════════════════════════════\n');

  process.exit(fail > 0 ? 1 : 0);
}

main().catch(e => { console.error(e); process.exit(1); });

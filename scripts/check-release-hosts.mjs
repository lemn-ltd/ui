#!/usr/bin/env node
import { resolve4, resolve6 } from 'node:dns/promises';

const releaseHosts = [
  'ui.le-mn.com',
  'portal.ui.le-mn.com',
  'schemas.ui.le-mn.com',
];

async function resolveHost(host) {
  const results = await Promise.allSettled([resolve4(host), resolve6(host)]);
  const addresses = results.flatMap((result) => (result.status === 'fulfilled' ? result.value : []));

  if (addresses.length === 0) {
    const errors = results
      .filter((result) => result.status === 'rejected')
      .map((result) => result.reason?.code ?? result.reason?.message ?? 'unknown DNS error');
    throw new Error(`${host} has no A or AAAA records (${errors.join(', ')})`);
  }

  const families = [
    results[0].status === 'fulfilled' ? 'A' : null,
    results[1].status === 'fulfilled' ? 'AAAA' : null,
  ].filter(Boolean);
  return `${host} (${families.join('/')})`;
}

const resolvedHosts = await Promise.all(releaseHosts.map(resolveHost));
console.log(`Release host DNS passed: ${resolvedHosts.join(', ')}`);

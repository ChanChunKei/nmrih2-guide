import { writeFile } from 'node:fs/promises';
import { currentEvidenceStatus, readLedger, statusLabel, validateLedger } from './evidence-ledger-lib.mjs';

const ledger = await readLedger();
const errors = validateLedger(ledger);
if (errors.length > 0) {
	console.error('Refusing to render an invalid evidence ledger.');
	for (const error of errors) console.error(`- ${error}`);
	process.exit(1);
}

const asOfArgument = process.argv.find((value) => value.startsWith('--as-of='));
const asOf = asOfArgument ? new Date(asOfArgument.slice('--as-of='.length)) : new Date();
if (Number.isNaN(asOf.valueOf())) throw new Error('Use --as-of=YYYY-MM-DD for a valid report date.');

/** @type {any[]} */
const sources = ledger.sources;
/** @type {any[]} */
const pages = ledger.pages;
/** @type {any[]} */
const claims = ledger.claims;
/** @type {any[]} */
const observations = ledger.search_observations;
const sourceById = new Map(sources.map((source) => [source.id, source]));
const pageBySlug = new Map(pages.map((page) => [page.slug, page]));
const claimsByStatus = new Map();
for (const claim of claims) {
	const status = currentEvidenceStatus(claim, asOf);
	claimsByStatus.set(status, [...(claimsByStatus.get(status) || []), claim]);
}

/** @param {string[]} cells */
const row = (cells) => `| ${cells.join(' | ')} |`;
/** @param {any} claim */
const sourceLinks = (claim) => {
	/** @type {string[]} */
	const sourceIds = claim.source_ids;
	return sourceIds.map((id) => `[${sourceById.get(id).title}](${sourceById.get(id).url})`).join('<br>');
};
/** @param {any} claim */
const pageLinks = (claim) => {
	/** @type {any[]} */
	const usages = claim.used_by;
	return usages.map((usage) => {
		const page = pageBySlug.get(usage.slug);
		return `[${page.title}](${page.url}) — ${usage.location}`;
	}).join('<br>') || 'Internal only';
};
const sections = [
	'# NMRiH2 Evidence Ledger',
	'',
	`Generated from \`evidence-ledger.json\` on ${asOf.toISOString().slice(0, 10)}. This report is an audit view; the JSON ledger is the canonical record.`,
	'',
	`- Sources: ${sources.length}`,
	`- Claims: ${claims.length}`,
	`- Published pages: ${pages.filter((page) => page.publication_status === 'published').length}`,
	'',
];

for (const status of ['officially_confirmed', 'community_tested', 'pending_recheck', 'conflicted', 'community_reported', 'hold_for_evidence']) {
	const claims = claimsByStatus.get(status) || [];
	sections.push(`## ${statusLabel(status)} (${claims.length})`, '');
	if (claims.length === 0) {
		sections.push('No records.', '');
		continue;
	}
	sections.push(row(['Claim', 'Version / review', 'Sources', 'Used by']), row(['---', '---', '---', '---']));
	for (const claim of claims) {
		sections.push(row([
			claim.statement,
			`${claim.version_scope || 'Stable'}<br>Checked ${claim.last_checked.slice(0, 10)}<br>Review ${claim.next_review_at.slice(0, 10)}`,
			sourceLinks(claim),
			pageLinks(claim),
		]));
	}
	sections.push('');
}

sections.push('## Candidate pages and search-demand observations', '');
sections.push(row(['Candidate', 'Decision', 'Search observation', 'Reason']), row(['---', '---', '---', '---']));
for (const page of pages.filter((page) => page.page_type === 'candidate')) {
	/** @type {string[]} */
	const observationIds = page.search_observation_ids;
	const observationStates = observationIds.map((id) => observations.find((item) => item.id === id)?.status || id).join(', ');
	sections.push(row([page.title, page.publication_decision, observationStates, page.reason]));
}
sections.push('');

await writeFile(new URL('../research/nmrih2/evidence-ledger.md', import.meta.url), `${sections.join('\n')}\n`);
console.log('Rendered research/nmrih2/evidence-ledger.md');

import { readFile } from 'node:fs/promises';

export const evidenceStatuses = new Set([
	'officially_confirmed',
	'community_tested',
	'community_reported',
	'conflicted',
	'hold_for_evidence',
]);

const sourceTypes = new Set([
	'official_site',
	'platform',
	'official_update',
	'official_video',
	'guide',
	'wiki',
	'community',
	'video',
]);

const freshnessClasses = new Set(['stable', 'version_30d', 'volatile_7d']);
const publicationStatuses = new Set(['published', 'published_watchlist', 'internal_only', 'hold']);

export const ledgerPath = new URL('../research/nmrih2/evidence-ledger.json', import.meta.url);

export async function readLedger() {
	return JSON.parse(await readFile(ledgerPath, 'utf8'));
}

/** @param {string} value */
export function normaliseUrl(value) {
	const url = new URL(value);
	url.hash = '';
	url.hostname = url.hostname.toLowerCase();
	if (url.pathname !== '/') url.pathname = url.pathname.replace(/\/$/, '');
	return url.toString();
}

/** @param {string} value @param {string} label */
export function asDate(value, label) {
	const date = new Date(value);
	if (Number.isNaN(date.valueOf())) throw new Error(`${label} must be an ISO date: ${value}`);
	return date;
}

/** @param {{ id: string, status: string, next_review_at?: string }} claim @param {Date} asOf */
export function currentEvidenceStatus(claim, asOf) {
	if (claim.status === 'conflicted') return 'conflicted';
	if (claim.status === 'community_reported') return 'community_reported';
	if (claim.next_review_at && asDate(claim.next_review_at, `${claim.id}.next_review_at`) < asOf) {
		return 'pending_recheck';
	}
	return claim.status;
}

/** @param {string} status */
export function statusLabel(status) {
	return {
		officially_confirmed: 'Officially confirmed',
		community_tested: 'Community-tested',
		community_reported: 'Community-reported',
		conflicted: 'Conflicted',
		hold_for_evidence: 'Hold for evidence',
		pending_recheck: 'Pending recheck',
	}[status];
}

/** @param {unknown} value @param {string} label @param {string[]} errors */
function ensureArray(value, label, errors) {
	if (!Array.isArray(value)) errors.push(`${label} must be an array.`);
	return Array.isArray(value) ? value : [];
}

/** @param {string} value @param {string} label @param {string[]} errors */
function ensureDate(value, label, errors) {
	try {
		asDate(value, label);
	} catch (error) {
		errors.push(error instanceof Error ? error.message : `${label} is invalid.`);
	}
}

/** @param {any} ledger */
export function validateLedger(ledger) {
	/** @type {string[]} */
	const errors = [];
	const sources = ensureArray(ledger.sources, 'sources', errors);
	const claims = ensureArray(ledger.claims, 'claims', errors);
	const pages = ensureArray(ledger.pages, 'pages', errors);
	const observations = ensureArray(ledger.search_observations, 'search_observations', errors);
	const sourceById = new Map();
	const claimById = new Map();
	const pageBySlug = new Map();
	const observationById = new Map();
	const sourceUrls = new Map();

	for (const source of sources) {
		for (const key of ['id', 'url', 'title', 'publisher', 'source_type', 'official', 'access_status', 'checked_at', 'independence_key']) {
			if (source[key] === undefined || source[key] === '') errors.push(`Source is missing ${key}.`);
		}
		if (sourceById.has(source.id)) errors.push(`Duplicate source id: ${source.id}.`);
		sourceById.set(source.id, source);
		if (!sourceTypes.has(source.source_type)) errors.push(`${source.id} has an unsupported source_type.`);
		if (!['reachable', 'blocked', 'not_found'].includes(source.access_status)) errors.push(`${source.id} has an unsupported access_status.`);
		ensureDate(source.checked_at, `${source.id}.checked_at`, errors);
		if (source.published_at) ensureDate(source.published_at, `${source.id}.published_at`, errors);
		try {
			const url = normaliseUrl(source.url);
			if (sourceUrls.has(url)) errors.push(`Duplicate source URL: ${source.id} and ${sourceUrls.get(url)}.`);
			sourceUrls.set(url, source.id);
		} catch {
			errors.push(`${source.id} has an invalid URL.`);
		}
	}

	for (const page of pages) {
		for (const key of ['slug', 'url', 'page_type', 'publication_status', 'last_content_audit']) {
			if (page[key] === undefined || page[key] === '') errors.push(`Page is missing ${key}.`);
		}
		if (pageBySlug.has(page.slug)) errors.push(`Duplicate page slug: ${page.slug}.`);
		pageBySlug.set(page.slug, page);
		if (!publicationStatuses.has(page.publication_status)) errors.push(`${page.slug} has an unsupported publication_status.`);
		ensureDate(page.last_content_audit, `${page.slug}.last_content_audit`, errors);
		ensureArray(page.claim_ids, `${page.slug}.claim_ids`, errors);
		ensureArray(page.source_ids, `${page.slug}.source_ids`, errors);
		ensureArray(page.search_observation_ids, `${page.slug}.search_observation_ids`, errors);
	}

	for (const observation of observations) {
		for (const key of ['id', 'method', 'checked_at', 'status', 'note']) {
			if (observation[key] === undefined || observation[key] === '') errors.push(`Search observation is missing ${key}.`);
		}
		if (observationById.has(observation.id)) errors.push(`Duplicate search observation id: ${observation.id}.`);
		observationById.set(observation.id, observation);
		ensureDate(observation.checked_at, `${observation.id}.checked_at`, errors);
	}

	for (const claim of claims) {
		for (const key of ['id', 'statement', 'claim_type', 'verification_rule', 'freshness_class', 'status', 'publication_status', 'last_checked', 'next_review_at']) {
			if (claim[key] === undefined || claim[key] === '') errors.push(`Claim is missing ${key}.`);
		}
		if (claimById.has(claim.id)) errors.push(`Duplicate claim id: ${claim.id}.`);
		claimById.set(claim.id, claim);
		if (!evidenceStatuses.has(claim.status)) errors.push(`${claim.id} has an unsupported status.`);
		if (!freshnessClasses.has(claim.freshness_class)) errors.push(`${claim.id} has an unsupported freshness_class.`);
		if (!publicationStatuses.has(claim.publication_status)) errors.push(`${claim.id} has an unsupported publication_status.`);
		ensureDate(claim.last_checked, `${claim.id}.last_checked`, errors);
		ensureDate(claim.next_review_at, `${claim.id}.next_review_at`, errors);
		const claimSources = ensureArray(claim.source_ids, `${claim.id}.source_ids`, errors);
		const usedBy = ensureArray(claim.used_by, `${claim.id}.used_by`, errors);
		const resolvedSources = claimSources.map((id) => sourceById.get(id)).filter(Boolean);
		for (const sourceId of claimSources) if (!sourceById.has(sourceId)) errors.push(`${claim.id} references missing source ${sourceId}.`);
		for (const usage of usedBy) {
			if (!pageBySlug.has(usage.slug)) errors.push(`${claim.id} references missing page ${usage.slug}.`);
			if (!usage.location) errors.push(`${claim.id} has a page usage without a location.`);
		}
		if (claim.verification_rule === 'official_single') {
			if (!resolvedSources.some((source) => source.official && source.access_status === 'reachable')) {
				errors.push(`${claim.id} needs a reachable official source.`);
			}
		}
		if (claim.status === 'community_tested') {
			const eligible = resolvedSources.filter((source) => !source.official && source.access_status === 'reachable');
			const domains = new Set(eligible.map((source) => new URL(source.url).hostname));
			const independence = new Set(eligible.map((source) => source.independence_key));
			if (eligible.length < 2 || domains.size < 2 || independence.size < 2) {
				errors.push(`${claim.id} needs two reachable, independent community sources on different domains.`);
			}
		}
		if (claim.status === 'community_reported' && !resolvedSources.some((source) => !source.official && source.access_status === 'reachable')) {
			errors.push(`${claim.id} needs one reachable community source.`);
		}
	}

	for (const page of pages) {
		for (const claimId of page.claim_ids) if (!claimById.has(claimId)) errors.push(`${page.slug} references missing claim ${claimId}.`);
		for (const sourceId of page.source_ids) if (!sourceById.has(sourceId)) errors.push(`${page.slug} references missing source ${sourceId}.`);
		for (const observationId of page.search_observation_ids) if (!observationById.has(observationId)) errors.push(`${page.slug} references missing search observation ${observationId}.`);
		if (page.publication_status === 'published' && page.page_type === 'guide' && page.claim_ids.length === 0) {
			errors.push(`${page.slug} is a published guide without mapped claims.`);
		}
	}

	return errors;
}

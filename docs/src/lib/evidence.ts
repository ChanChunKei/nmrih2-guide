import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

type Source = {
	id: string;
	url: string;
	title: string;
	publisher: string;
};

type Page = {
	slug: string;
	url: string;
	title: string;
};

type Claim = {
	id: string;
	statement: string;
	status: 'officially_confirmed' | 'community_tested' | 'community_reported' | 'conflicted' | 'hold_for_evidence';
	publication_status: 'published' | 'published_watchlist' | 'internal_only' | 'hold';
	version_scope: string;
	last_checked: string;
	next_review_at: string;
	source_ids: string[];
	used_by: Array<{ slug: string; location: string }>;
};

type Ledger = {
	sources: Source[];
	claims: Claim[];
	pages: Page[];
};

export type PublicEvidenceClaim = {
	id: string;
	statement: string;
	status: 'officially_confirmed' | 'community_tested' | 'pending_recheck';
	versionScope: string;
	lastChecked: string;
	nextReviewAt: string;
	sources: Source[];
	usedBy: Array<Page & { location: string }>;
};

export type PublicEvidence = {
	current: PublicEvidenceClaim[];
	pendingReview: PublicEvidenceClaim[];
};

const ledgerPath = resolve(process.cwd(), '../research/nmrih2/evidence-ledger.json');

function currentStatus(claim: Claim, now: Date) {
	if (new Date(claim.next_review_at) < now) return 'pending_recheck' as const;
	return claim.status;
}

export async function loadPublicEvidence(now = new Date()): Promise<PublicEvidence> {
	const ledger = JSON.parse(await readFile(ledgerPath, 'utf8')) as Ledger;
	const sourceById = new Map(ledger.sources.map((source) => [source.id, source]));
	const pageBySlug = new Map(ledger.pages.map((page) => [page.slug, page]));
	const selected: PublicEvidenceClaim[] = [];

	for (const claim of ledger.claims) {
		if (claim.publication_status !== 'published') continue;
		const status = currentStatus(claim, now);
		if (status !== 'officially_confirmed' && status !== 'community_tested' && status !== 'pending_recheck') continue;
		selected.push({
			id: claim.id,
			statement: claim.statement,
			status,
			versionScope: claim.version_scope,
			lastChecked: claim.last_checked,
			nextReviewAt: claim.next_review_at,
			sources: claim.source_ids.map((id) => sourceById.get(id)).filter((source): source is Source => Boolean(source)),
			usedBy: claim.used_by
				.map((usage) => {
					const page = pageBySlug.get(usage.slug);
					return page ? { ...page, location: usage.location } : undefined;
				})
				.filter((usage): usage is Page & { location: string } => Boolean(usage)),
		});
	}

	return {
		current: selected.filter((claim) => claim.status !== 'pending_recheck'),
		pendingReview: selected.filter((claim) => claim.status === 'pending_recheck'),
	};
}

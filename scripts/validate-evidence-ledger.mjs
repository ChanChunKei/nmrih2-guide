import { readLedger, validateLedger } from './evidence-ledger-lib.mjs';

const ledger = await readLedger();
const errors = validateLedger(ledger);

if (errors.length > 0) {
	console.error(`Evidence ledger validation failed with ${errors.length} error(s):`);
	for (const error of errors) console.error(`- ${error}`);
	process.exitCode = 1;
} else {
	console.log(`Evidence ledger is valid: ${ledger.sources.length} sources, ${ledger.claims.length} claims, ${ledger.pages.length} pages.`);
}

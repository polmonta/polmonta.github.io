const EVIDENCE_COLLECTIONS = ['reviews', 'testimonials', 'claims', 'screenshots'];
const WORKFLOW_CLAIM_IDS = [
  'claim-monthly-financial-summary',
  'claim-property-document-storage',
  'claim-xlsx-data-export'
];

function emptyEvidence() {
  return Object.fromEntries(EVIDENCE_COLLECTIONS.map((collection) => [collection, []]));
}

export function selectVerifiedEvidence(evidence, validationErrors) {
  if (validationErrors.length > 0) {
    return emptyEvidence();
  }

  return Object.fromEntries(
    EVIDENCE_COLLECTIONS.map((collection) => [collection, evidence[collection]])
  );
}

export function buildWorkflowFaqAnswer(claims) {
  if (!Array.isArray(claims)) {
    return null;
  }

  const claimsById = new Map(
    claims
      .filter((claim) => claim !== null && typeof claim === 'object' && !Array.isArray(claim))
      .map((claim) => [claim.id, claim])
  );

  if (WORKFLOW_CLAIM_IDS.some((claimId) => !claimsById.has(claimId))) {
    return null;
  }

  const workflowText = WORKFLOW_CLAIM_IDS.map((claimId) => claimsById.get(claimId).text);
  if (workflowText.some((text) => typeof text !== 'string' || text.trim() === '')) {
    return null;
  }

  return `Verified workflows include ${workflowText.join(' ')}`;
}

import { MasterRecord, Deal, ScrubResultItem, ScrubStatus } from '../types';

// Common free webmail domains that shouldn't trigger full domain-wide blocking
const FREE_EMAIL_DOMAINS = new Set([
  'gmail.com',
  'googlemail.com',
  'yahoo.com',
  'yahoo.co.uk',
  'yahoo.fr',
  'yahoo.es',
  'hotmail.com',
  'hotmail.co.uk',
  'outlook.com',
  'live.com',
  'msn.com',
  'icloud.com',
  'me.com',
  'aol.com',
  'proton.me',
  'protonmail.com',
  'zoho.com',
  'mail.com',
  'yandex.com',
  'gmx.com',
  'fastmail.com'
]);

// Strip common corporate suffixes for canonical fuzzy matching
const COMPANY_SUFFIX_REGEX = /\b(inc|incorporated|llc|ltd|limited|corp|corporation|co|group|holdings|services|solutions|uk|agency|consulting|global|technologies|tech|partners)\b/gi;

/**
 * Extracts and normalizes the domain from an email address or URL
 */
export function extractNormalizedDomain(input: string): string {
  if (!input) return '';
  let cleaned = input.trim().toLowerCase();
  
  // If input is an email, grab everything after @
  if (cleaned.includes('@')) {
    cleaned = cleaned.split('@')[1];
  }

  // Remove protocol
  cleaned = cleaned.replace(/^https?:\/\//, '');
  // Remove www or mail subdomains
  cleaned = cleaned.replace(/^(www\d?|mail\d?|webmail)\./, '');
  // Remove trailing slashes and paths
  cleaned = cleaned.split('/')[0];
  // Remove port numbers
  cleaned = cleaned.split(':')[0];

  return cleaned.trim();
}

export function isFreeEmailDomain(domain: string): boolean {
  return FREE_EMAIL_DOMAINS.has(domain.toLowerCase());
}

/**
 * Canonicalizes company names to catch "Acme Logistics Ltd" vs "Acme Logistics"
 */
export function normalizeCompanyName(name?: string): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // remove punctuation
    .replace(COMPANY_SUFFIX_REGEX, '') // remove corp suffixes
    .replace(/\s+/g, ' ') // collapse whitespaces
    .trim();
}

/**
 * Compares two strings using token-based Jaccard similarity
 */
export function areCompanyNamesSimilar(nameA?: string, nameB?: string): boolean {
  const normA = normalizeCompanyName(nameA);
  const normB = normalizeCompanyName(nameB);

  if (!normA || !normB) return false;
  if (normA === normB) return true;
  if (normA.includes(normB) || normB.includes(normA)) {
    // Only if the common token is significant (> 3 chars)
    const shorter = normA.length < normB.length ? normA : normB;
    if (shorter.length >= 4) return true;
  }

  const tokensA = new Set(normA.split(' ').filter(t => t.length > 2));
  const tokensB = new Set(normB.split(' ').filter(t => t.length > 2));

  if (tokensA.size === 0 || tokensB.size === 0) return false;

  let intersection = 0;
  tokensA.forEach(t => {
    if (tokensB.has(t)) intersection++;
  });

  const union = new Set([...tokensA, ...tokensB]).size;
  return union > 0 && (intersection / union) >= 0.5;
}

export interface CollisionScanResult {
  items: ScrubResultItem[];
  stats: {
    total: number;
    safe: number;
    dncBlocked: number;
    salesConflicts: number;
    interestedConflicts: number;
    duplicates: number;
    freemailWarnings: number;
  };
}

/**
 * Multi-layer Collision Scanner
 * Runs across master records, active sales pipeline deals, and intra-batch duplicates
 */
export function scanCampaignList(
  rawLines: string[],
  masterRecords: MasterRecord[],
  activeDeals: Deal[],
  currentRepName: string
): CollisionScanResult {
  const results: ScrubResultItem[] = [];
  const seenEmails = new Set<string>();
  const seenDomainsInBatch = new Map<string, string>(); // domain -> first email in batch

  // Build high-speed lookup maps
  const masterEmailMap = new Map<string, MasterRecord>();
  const masterDomainMap = new Map<string, MasterRecord[]>();
  
  masterRecords.forEach(rec => {
    const emailKey = rec.email.toLowerCase().trim();
    masterEmailMap.set(emailKey, rec);
    if (rec.alternateEmails && Array.isArray(rec.alternateEmails)) {
      rec.alternateEmails.forEach((alt) => {
        if (alt && alt.trim()) {
          masterEmailMap.set(alt.toLowerCase().trim(), rec);
        }
      });
    }

    if (rec.domain && !isFreeEmailDomain(rec.domain)) {
      const domKey = rec.domain.toLowerCase().trim();
      const existing = masterDomainMap.get(domKey) || [];
      existing.push(rec);
      masterDomainMap.set(domKey, existing);
    }
  });

  // Active Deals lookup maps
  const dealEmailMap = new Map<string, Deal>();
  const dealDomainMap = new Map<string, Deal[]>();

  activeDeals.forEach(deal => {
    // Only look at active / ongoing deals or closed won (ignore closed lost if any)
    if (deal.stage !== 'closed_lost') {
      const emailKey = deal.email.toLowerCase().trim();
      dealEmailMap.set(emailKey, deal);
      if (deal.alternateEmails && Array.isArray(deal.alternateEmails)) {
        deal.alternateEmails.forEach((alt) => {
          if (alt && alt.trim()) {
            dealEmailMap.set(alt.toLowerCase().trim(), deal);
          }
        });
      }

      if (deal.domain && !isFreeEmailDomain(deal.domain)) {
        const domKey = deal.domain.toLowerCase().trim();
        const existing = dealDomainMap.get(domKey) || [];
        existing.push(deal);
        dealDomainMap.set(domKey, existing);
      }
    }
  });

  let stats = {
    total: 0,
    safe: 0,
    dncBlocked: 0,
    salesConflicts: 0,
    interestedConflicts: 0,
    duplicates: 0,
    freemailWarnings: 0
  };

  rawLines.forEach((rawLine, index) => {
    const trimmed = rawLine.trim();
    if (!trimmed) return;

    // Handle CSV lines or single emails: e.g. "john@acme.com, Acme, John Doe"
    let email = trimmed;
    let companyName = '';
    let contactName = '';

    if (trimmed.includes(',')) {
      const parts = trimmed.split(',').map(p => p.trim().replace(/^["']|["']$/g, ''));
      email = parts[0];
      if (parts.length > 1) companyName = parts[1];
      if (parts.length > 2) contactName = parts[2];
    } else if (trimmed.includes('\t')) {
      const parts = trimmed.split('\t').map(p => p.trim().replace(/^["']|["']$/g, ''));
      email = parts[0];
      if (parts.length > 1) companyName = parts[1];
      if (parts.length > 2) contactName = parts[2];
    }

    if (!email || !email.includes('@')) {
      return; // Skip invalid rows
    }

    stats.total++;
    const normalizedEmail = email.toLowerCase().trim();
    const domain = extractNormalizedDomain(normalizedEmail);
    const isFreeMail = isFreeEmailDomain(domain);

    const itemId = `scrub-${index}-${Date.now()}`;
    let itemStatus: ScrubStatus = 'safe';
    let reason = 'Verified clean & safe for outreach';
    let ownerRep: string | undefined = undefined;
    let matchedRecord: MasterRecord | Deal | undefined = undefined;
    let isFlagged = false;

    // 1. CHECK INTRA-BATCH DUPLICATES FIRST
    if (seenEmails.has(normalizedEmail)) {
      itemStatus = 'intra_batch_dup';
      reason = 'Duplicate email found within this uploaded list';
      isFlagged = true;
      stats.duplicates++;
    } else if (!isFreeMail && domain && seenDomainsInBatch.has(domain)) {
      itemStatus = 'intra_batch_dup';
      reason = `Same company domain (@${domain}) already included earlier in this list (${seenDomainsInBatch.get(domain)})`;
      isFlagged = true;
      stats.duplicates++;
    } else {
      // 2. CHECK ACTIVE SALES OPPORTUNITIES
      const directDeal = dealEmailMap.get(normalizedEmail);
      const domainDeals = !isFreeMail && domain ? dealDomainMap.get(domain) : undefined;

      if (directDeal) {
        matchedRecord = directDeal;
        ownerRep = directDeal.salesRep;
        itemStatus = 'sales_conflict';
        isFlagged = true;
        stats.salesConflicts++;
        const valStr = directDeal.valueGbp ? ` (£${directDeal.valueGbp.toLocaleString()})` : '';
        reason = `SALES CONFLICT: Deal "${directDeal.title}" is in stage ${directDeal.stage} with Closer ${directDeal.salesRep}${valStr}`;
      } else if (domainDeals && domainDeals.length > 0) {
        const topDeal = domainDeals[0];
        matchedRecord = topDeal;
        ownerRep = topDeal.salesRep;
        itemStatus = 'sales_conflict';
        isFlagged = true;
        stats.salesConflicts++;
        const valStr = topDeal.valueGbp ? ` (£${topDeal.valueGbp.toLocaleString()})` : '';
        reason = `DOMAIN COLLISION: Company (@${domain}) has an ongoing deal with Sales Rep ${topDeal.salesRep}${valStr}`;
      } else {
        // 3. CHECK MASTER DATABASE (DNC, INTERESTED, ON-BOARDED)
        const directMaster = masterEmailMap.get(normalizedEmail);
        const domainMasters = !isFreeMail && domain ? masterDomainMap.get(domain) : undefined;

        if (directMaster) {
          matchedRecord = directMaster;
          ownerRep = directMaster.salesRep || directMaster.leadGenRep;
          isFlagged = true;

          if (directMaster.status === 'dnc') {
            itemStatus = 'dnc_block';
            reason = `BLOCKED (DNC): Email blacklisted (${directMaster.dncReason || 'Unsubscribed/Hostile'})`;
            stats.dncBlocked++;
          } else if (directMaster.status === 'paid_client') {
            itemStatus = 'sales_conflict';
            reason = `BLOCKED: Active On-Boarded Client (Protected)`;
            stats.salesConflicts++;
          } else if (directMaster.status === 'interested') {
            itemStatus = 'interested_conflict';
            reason = `COLLISION: Marked as Interested by ${directMaster.leadGenRep || 'Lead Team'}`;
            stats.interestedConflicts++;
          } else if (directMaster.status === 'in_conversation') {
            itemStatus = 'in_conversation_conflict';
            reason = `IN DIALOGUE: Active conversation ongoing with ${directMaster.leadGenRep || 'Lead Team'}`;
            stats.interestedConflicts++;
          } else if (directMaster.status === 'meeting_scheduled' || directMaster.status === 'meeting_done' || directMaster.status === 'invoice_sent') {
            itemStatus = 'sales_conflict';
            reason = `SALES COLLISION: In stage ${directMaster.status} (Rep: ${directMaster.salesRep || directMaster.leadGenRep || 'Sales Team'})`;
            stats.salesConflicts++;
          }
        } else if (domainMasters && domainMasters.length > 0) {
          // Domain matched in master repo
          const conflict = domainMasters[0];
          matchedRecord = conflict;
          ownerRep = conflict.salesRep || conflict.leadGenRep;
          isFlagged = true;

          if (conflict.status === 'dnc') {
            itemStatus = 'dnc_block';
            reason = `BLOCKED (DNC): Company domain @${domain} is blacklisted`;
            stats.dncBlocked++;
          } else if (conflict.status === 'paid_client') {
            itemStatus = 'sales_conflict';
            reason = `BLOCKED: Company @${domain} is an existing paid client`;
            stats.salesConflicts++;
          } else if (conflict.status === 'interested' || conflict.status === 'in_conversation') {
            itemStatus = 'interested_conflict';
            reason = `DOMAIN COLLISION: Lead team (${conflict.leadGenRep || 'ROS'}) is already nurturing this company`;
            stats.interestedConflicts++;
          } else {
            itemStatus = 'sales_conflict';
            reason = `DOMAIN COLLISION: Company @${domain} linked to active deal with ${conflict.salesRep || 'Sales'}`;
            stats.salesConflicts++;
          }
        } else if (companyName && companyName.trim().length >= 3) {
          // 4. CHECK COMPANY NAME COLLISION
          const companyConflict = masterRecords.find(
            (r) => r.companyName && areCompanyNamesSimilar(companyName, r.companyName)
          );
          if (companyConflict) {
            matchedRecord = companyConflict;
            ownerRep = companyConflict.salesRep || companyConflict.leadGenRep;
            isFlagged = true;

            if (companyConflict.status === 'dnc') {
              itemStatus = 'dnc_block';
              reason = `BLOCKED (DNC): Company "${companyConflict.companyName}" is marked as DNC`;
              stats.dncBlocked++;
            } else if (companyConflict.status === 'paid_client') {
              itemStatus = 'sales_conflict';
              reason = `BLOCKED: Company "${companyConflict.companyName}" is an active Paid Client`;
              stats.salesConflicts++;
            } else if (companyConflict.status === 'interested' || companyConflict.status === 'in_conversation') {
              itemStatus = 'interested_conflict';
              reason = `COMPANY MATCH: Company "${companyConflict.companyName}" is active with ${companyConflict.leadGenRep || 'Lead Team'}`;
              stats.interestedConflicts++;
            } else {
              itemStatus = 'sales_conflict';
              reason = `COMPANY MATCH: Company "${companyConflict.companyName}" is in pipeline with ${companyConflict.salesRep || 'Sales'}`;
              stats.salesConflicts++;
            }
          }
        }
      }
    }

    if (!isFlagged) {
      stats.safe++;
      if (isFreeMail) {
        stats.freemailWarnings++;
      }
      seenEmails.add(normalizedEmail);
      if (!isFreeMail && domain) {
        seenDomainsInBatch.set(domain, normalizedEmail);
      }
    }

    results.push({
      id: itemId,
      rawEmail: email,
      normalizedEmail,
      domain,
      companyName: companyName || (domain ? domain.split('.')[0] : ''),
      contactName,
      status: itemStatus,
      reason,
      ownerRep,
      matchedRecord,
      isFlagged
    });
  });

  return { items: results, stats };
}

// Every change to s.gold goes through addLedger, so the money tab can always say why.
const LEDGER_MONTHS = 24;

export function addLedger(s, label, amt) {
  if (!amt) return;
  s.gold += amt;
  s.ledger.push({ m: s.ageM, label, amt });
  if (s.flags.fullLedger) return;
  const cut = s.ageM - LEDGER_MONTHS;
  while (s.ledger.length && s.ledger[0].m < cut) s.ledger.shift();
}

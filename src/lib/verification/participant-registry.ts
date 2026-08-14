// Checks whether a wallet is a confirmed, registered Generator or Host
// operator — required before that wallet can be used as a self-serve
// referral identifier (team decision: "Only allow wallets that are
// confirmed as registered Generator/Host operators on-chain," 2026-07-29).
//
// NOT YET WIRED UP. We don't yet know the actual mechanism: whether to
// query an on-chain registry contract directly, or call a ShinzoHub API
// (Duncan mentioned "wallets that are registered with Shinzohub can get
// uuids," implying ShinzoHub maintains this registry — but we don't have
// an endpoint, contract address, or ABI). Flagged in
// DECISIONS_AND_OPEN_QUESTIONS.md as the concrete blocking question.
//
// Deliberately fails closed (returns false) rather than failing open, per
// the team's explicit "avoid random/shady wallets" stance — until this is
// wired to a real source of truth, self-serve for Generators/Hosts is
// paused rather than silently left unverified.
export async function isRegisteredParticipant(
  _walletAddress: string,
  _type: "GENERATOR" | "HOST",
): Promise<boolean> {
  return false;
}

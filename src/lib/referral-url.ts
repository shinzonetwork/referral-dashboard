export function buildReferralUrl(code: string): string {
  const base =
    process.env.NEXT_PUBLIC_REFERRAL_BASE_URL ?? "https://shinzo.network/join";
  const param = process.env.NEXT_PUBLIC_REFERRAL_PARAM ?? "ref";
  const url = new URL(base);
  url.searchParams.set(param, code);
  return url.toString();
}

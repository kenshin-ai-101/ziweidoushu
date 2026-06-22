export interface AccountQuotaResponse {
  /** Total usable asks (daily pool + bonus credits). */
  remaining: number;
  /** Daily pool remaining only — shown as 今日剩余 numerator. */
  dailyRemaining: number;
  max: number;
  bonusCredits: number;
  unlimited: boolean;
}

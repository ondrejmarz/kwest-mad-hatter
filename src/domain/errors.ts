/**
 * Expected failures are values, not exceptions (spec 15.5). Every domain function
 * that can fail returns `Result<T, DomainError>`. The i18n layer maps each code to
 * a localized sentence via a total `Record<DomainError['code'], …>`, so adding a
 * code without a translation fails typecheck.
 */
export type DomainError =
  | { readonly code: 'INSUFFICIENT_COINS'; readonly needed: number; readonly available: number }
  | { readonly code: 'TASK_ALREADY_USED_BY_PLAYER' }
  | { readonly code: 'TASK_INACTIVE' }
  | { readonly code: 'TASK_CATEGORY_CLOSED'; readonly category: string }
  | { readonly code: 'TASK_TAKEN_TODAY'; readonly byPlayerName: string }
  | { readonly code: 'DAY_LOCKED' }
  | { readonly code: 'REWARD_INACTIVE' }
  | { readonly code: 'REWARD_EXCLUSIVE_TAKEN'; readonly byPlayerName: string }
  | { readonly code: 'TOO_MANY_ACTIVE_REWARDS'; readonly max: number }
  | { readonly code: 'CANNOT_TARGET_SELF' }
  | { readonly code: 'TARGET_COUNT_OUT_OF_RANGE'; readonly min: number; readonly max: number }
  | { readonly code: 'TARGET_AT_PUNISH_LIMIT'; readonly playerName: string; readonly max: number }
  | { readonly code: 'PARTNER_REQUIRED' }
  | { readonly code: 'PARTNER_IS_SELF' }
  | { readonly code: 'PLAYER_NOT_APPROVED' }
  | { readonly code: 'PLAYER_ALREADY_CLAIMED' }
  | { readonly code: 'INVALID_CODE' }
  | { readonly code: 'CLAIM_LOCKED_OUT'; readonly retryAfterMs: number }
  | { readonly code: 'REQUIRES_ONLINE' };

export type DomainErrorCode = DomainError['code'];

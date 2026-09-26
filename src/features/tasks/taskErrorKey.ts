import type { DomainError } from '../../domain/errors';
import type { TranslationKey } from '../../i18n/translate';

/**
 * The message a failed task action shows (spec 7). Each failure a player can actually run into gets
 * its own sentence — a task someone grabbed a moment earlier or a round the organizer just locked
 * must never read as "you're offline". Anything else falls back to the generic error.
 */
export function taskErrorKey(error: DomainError): TranslationKey {
  switch (error.code) {
    case 'REQUIRES_ONLINE':
      return 'entry.offline';
    case 'TASK_TAKEN_TODAY':
      return 'tasks.takenToday';
    case 'DAY_LOCKED':
      return 'tasks.dayLocked';
    case 'TASK_SWITCH_DISABLED':
      return 'tasks.switchDisabled';
    case 'TASK_ALREADY_USED_BY_PLAYER':
      return 'tasks.reasonUsed';
    case 'TASK_INACTIVE':
      return 'tasks.reasonInactive';
    case 'PARTNER_REQUIRED':
      return 'tasks.choosePartner';
    default:
      return 'common.somethingWrong';
  }
}

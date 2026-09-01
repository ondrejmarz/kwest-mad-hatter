import { useTranslation } from '../i18n/LocaleProvider';

/**
 * The pencil that admins see on every list row (spec 9.4). It stops propagation so
 * tapping it never triggers the surrounding row's own click (a player's detail).
 */
export function EditButton({ onClick }: { onClick: () => void }) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      aria-label={t('common.edit')}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      className="tap-target -m-1 rounded-lg p-1 text-content-muted"
    >
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
        <path d="M13.586 3.586a2 2 0 1 1 2.828 2.828l-.793.793-2.828-2.828.793-.793ZM11.379 5.793 3 14.172V17h2.828l8.379-8.379-2.828-2.828Z" />
      </svg>
    </button>
  );
}

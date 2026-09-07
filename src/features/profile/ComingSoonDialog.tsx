import { useTranslation } from '../../i18n/LocaleProvider';
import { Dialog } from '../../ui/Dialog';

/**
 * Placeholder for the public-profiles comparison views (spec, "Not yet built" #1). The per-section
 * "Zobrazit více" buttons only appear once an admin turns public profiles on; until the comparison
 * is built they open this. Own coin history is a real view and does NOT use this.
 */
export function ComingSoonDialog({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  return (
    <Dialog open onClose={onClose} title={t('profile.showMore')}>
      <p className="text-content-muted">{t('profile.comingSoon')}</p>
    </Dialog>
  );
}

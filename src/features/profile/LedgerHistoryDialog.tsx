import type { LedgerEntryDoc } from '../../data/schemas/ledger';
import { useTranslation } from '../../i18n/LocaleProvider';
import { Dialog } from '../../ui/Dialog';

import { LedgerHistory } from './ledgerView';

/** The full, scrollable coin history (spec 9.1) — the profile card shows only a preview. */
export function LedgerHistoryDialog({
  entries,
  coins,
  onClose,
}: {
  entries: readonly LedgerEntryDoc[];
  coins: number;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  return (
    <Dialog open onClose={onClose} title={t('ledger.historyTitle')}>
      <LedgerHistory entries={entries} coins={coins} showOpening />
    </Dialog>
  );
}

import { type ReactNode, useState } from 'react';

import { db } from '../../../data/firebase';
import {
  applyRewardImport,
  applyTaskImport,
  parseRewards,
  parseTasks,
  splitByName,
} from '../../../data/importCatalog';
import type { LocalizedText } from '../../../domain/types';
import { useTranslation } from '../../../i18n/LocaleProvider';
import { cx } from '../../../lib/cx';
import { Button } from '../../../ui/Button';

const AREA =
  'min-h-32 w-full rounded-xl border border-border bg-surface px-3 py-2 font-mono text-xs text-content outline-none focus:border-accent';

/** TSV import with a live preview (spec 10): counts of new vs. updated before applying. */
export function CatalogImport({
  turnusId,
  coinsPerDifficulty,
  penaltyRatio,
  taskNames,
  rewardNames,
}: {
  turnusId: string;
  coinsPerDifficulty: number;
  penaltyRatio: number;
  taskNames: ReadonlySet<string>;
  rewardNames: ReadonlySet<string>;
}) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<'tasks' | 'rewards'>('tasks');
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ created: number; updated: number } | null>(null);

  const isTasks = tab === 'tasks';
  const parsed: readonly { name: LocalizedText }[] = isTasks
    ? parseTasks(text)
    : parseRewards(text);
  const { toCreate, toUpdate } = splitByName(parsed, isTasks ? taskNames : rewardNames);

  const switchTab = (next: 'tasks' | 'rewards'): void => {
    setTab(next);
    setText('');
    setDone(null);
  };

  const apply = async (): Promise<void> => {
    setBusy(true);
    setDone(null);
    const result = isTasks
      ? await applyTaskImport(db, turnusId, parseTasks(text), coinsPerDifficulty, penaltyRatio)
      : await applyRewardImport(db, turnusId, parseRewards(text));
    setBusy(false);
    setDone(result);
    setText('');
  };

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface-raised p-4">
      <h2 className="font-semibold text-content">{t('catalog.importTitle')}</h2>
      <div className="flex gap-2">
        <Tab active={isTasks} onClick={() => switchTab('tasks')}>
          {t('catalog.tabTasks')}
        </Tab>
        <Tab active={!isTasks} onClick={() => switchTab('rewards')}>
          {t('catalog.tabRewards')}
        </Tab>
      </div>
      <p className="text-xs text-content-muted">
        {isTasks ? t('catalog.taskColumns') : t('catalog.rewardColumns')}
      </p>
      <textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        className={AREA}
        placeholder={t('catalog.importHint')}
      />
      {parsed.length > 0 && (
        <p className="text-sm text-content-muted">
          {t('catalog.preview', { created: toCreate.length, updated: toUpdate.length })}
        </p>
      )}
      {done !== null && (
        <p className="text-sm text-success">
          {t('catalog.done', { created: done.created, updated: done.updated })}
        </p>
      )}
      <Button onClick={() => void apply()} disabled={busy || parsed.length === 0}>
        {t('catalog.apply')}
      </Button>
    </div>
  );
}

function Tab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        'rounded-full px-3 py-1 text-sm font-medium',
        active ? 'bg-accent text-white' : 'bg-surface text-content-muted',
      )}
    >
      {children}
    </button>
  );
}

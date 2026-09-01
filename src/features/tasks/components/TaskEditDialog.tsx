import { type FormEvent, useState } from 'react';

import { createTask, type TaskFields, updateTask } from '../../../data/catalogAdmin';
import { db } from '../../../data/firebase';
import { parseLocalizedLines, serializeLocalized } from '../../../data/importCatalog';
import { derivePenalty, deriveReward } from '../../../domain/coins';
import type { LocalizedText, Task } from '../../../domain/types';
import { useTranslation } from '../../../i18n/LocaleProvider';
import { Button } from '../../../ui/Button';
import { Checkbox } from '../../../ui/Checkbox';
import { CoinAmount } from '../../../ui/CoinAmount';
import { Dialog } from '../../../ui/Dialog';
import { LocalizedField } from '../../../ui/LocalizedField';
import { Select } from '../../../ui/Select';
import { TextInput } from '../../../ui/TextInput';

const DIFFICULTIES = [1, 2, 3, 4, 5, 6];
const EMPTY: LocalizedText = { cs: '', en: '', de: '' };
const AREA =
  'min-h-20 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-content outline-none focus:border-accent';

const trimLoc = (value: LocalizedText): LocalizedText => ({
  cs: value.cs.trim(),
  en: value.en.trim(),
  de: value.de.trim(),
});

/**
 * Add or edit one task (spec 9.4). Name and description are trilingual; category tags are edited
 * one per line. Coins follow the difficulty formula unless "manual coins" is ticked, which pins an
 * override the TSV importer will then leave alone (spec 5). `Task` carries no `manualCoins`, so on
 * open we infer it: coins that differ from the formula were overridden.
 */
export function TaskEditDialog({
  task,
  onClose,
  turnusId,
  coinsPerDifficulty,
  penaltyRatio,
}: {
  task: Task | null;
  onClose: () => void;
  turnusId: string;
  coinsPerDifficulty: number;
  penaltyRatio: number;
}) {
  const { t } = useTranslation();
  const [name, setName] = useState<LocalizedText>(task?.name ?? EMPTY);
  const [description, setDescription] = useState<LocalizedText>(task?.description ?? EMPTY);
  const [tags, setTags] = useState(() =>
    (task?.categories ?? []).map(serializeLocalized).join('\n'),
  );
  const [difficulty, setDifficulty] = useState(task?.difficulty ?? 3);
  const [isPair, setIsPair] = useState(task?.isPair ?? false);
  const [active, setActive] = useState(task?.active ?? true);
  const [manual, setManual] = useState(
    task !== null && task.coinReward !== deriveReward(task.difficulty, coinsPerDifficulty),
  );
  const [reward, setReward] = useState(String(task?.coinReward ?? ''));
  const [penalty, setPenalty] = useState(String(task?.coinPenalty ?? ''));
  const [error, setError] = useState<string | null>(null);

  const autoReward = deriveReward(difficulty, coinsPerDifficulty);
  const autoPenalty = derivePenalty(autoReward, penaltyRatio);

  const submit = (event: FormEvent): void => {
    event.preventDefault();
    if (name.cs.trim().length === 0) {
      setError(t('tasks.invalidName'));
      return;
    }
    const coinReward = manual ? Number(reward) : autoReward;
    const coinPenalty = manual ? Number(penalty) : autoPenalty;
    if (manual && (!Number.isFinite(coinReward) || !Number.isFinite(coinPenalty))) {
      setError(t('tasks.invalidCoins'));
      return;
    }
    const fields: TaskFields = {
      name: trimLoc(name),
      description: trimLoc(description),
      categories: parseLocalizedLines(tags),
      difficulty,
      isPair,
      coinReward,
      coinPenalty,
      manualCoins: manual,
      active,
    };
    if (task === null) void createTask(db, turnusId, fields);
    else void updateTask(db, turnusId, task.id, fields);
    onClose();
  };

  return (
    <Dialog
      open
      onClose={onClose}
      title={t(task === null ? 'tasks.createTitle' : 'tasks.editTitle')}
    >
      <form onSubmit={submit} className="flex flex-col gap-3">
        <LocalizedField label={t('tasks.nameLabel')} value={name} onChange={setName} autoFocus />
        <LocalizedField
          label={t('tasks.descriptionLabel')}
          value={description}
          onChange={setDescription}
        />
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-content-muted">{t('tasks.tagsLabel')}</span>
          <textarea
            value={tags}
            onChange={(event) => setTags(event.target.value)}
            className={AREA}
            placeholder={t('tasks.tagsHint')}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-content-muted">
            {t('tasks.difficultyLabel')}
          </span>
          <Select
            value={String(difficulty)}
            onChange={(event) => setDifficulty(Number(event.target.value))}
            className="w-full"
          >
            {DIFFICULTIES.map((value) => (
              <option key={value} value={String(value)}>
                {value}
              </option>
            ))}
          </Select>
        </label>
        <Checkbox label={t('tasks.pairLabel')} checked={isPair} onChange={setIsPair} />
        <Checkbox label={t('tasks.activeLabel')} checked={active} onChange={setActive} />
        <Checkbox label={t('tasks.manualCoinsLabel')} checked={manual} onChange={setManual} />
        {manual ? (
          <div className="flex gap-2">
            <TextInput
              label={t('tasks.coinRewardLabel')}
              value={reward}
              onChange={(event) => setReward(event.target.value)}
              inputMode="numeric"
            />
            <TextInput
              label={t('tasks.coinPenaltyLabel')}
              value={penalty}
              onChange={(event) => setPenalty(event.target.value)}
              inputMode="numeric"
            />
          </div>
        ) : (
          <p className="flex items-center gap-2 text-sm text-content-muted">
            {t('tasks.autoCoins')}
            <CoinAmount amount={autoReward} signed />
            <CoinAmount amount={-autoPenalty} signed />
          </p>
        )}
        {error !== null && <p className="text-sm text-danger">{error}</p>}
        <Button type="submit">{t('tasks.save')}</Button>
      </form>
    </Dialog>
  );
}

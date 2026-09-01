import { type FormEvent, useState } from 'react';

import { createTask, type TaskFields, updateTask } from '../../../data/catalogAdmin';
import { db } from '../../../data/firebase';
import { derivePenalty, deriveReward } from '../../../domain/coins';
import type { Task } from '../../../domain/types';
import { useTranslation } from '../../../i18n/LocaleProvider';
import { Button } from '../../../ui/Button';
import { Checkbox } from '../../../ui/Checkbox';
import { CoinAmount } from '../../../ui/CoinAmount';
import { Dialog } from '../../../ui/Dialog';
import { Select } from '../../../ui/Select';
import { TextInput } from '../../../ui/TextInput';

const DIFFICULTIES = [1, 2, 3, 4, 5, 6];

/**
 * Add or edit one task (spec 9.4). Coins follow the difficulty formula unless "manual
 * coins" is ticked, which pins an override the TSV importer will then leave alone (spec 5).
 * `Task` carries no `manualCoins`, so on open we infer it: coins that differ from what the
 * formula would produce were overridden.
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
  const [name, setName] = useState(task?.name ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [category, setCategory] = useState(task?.category ?? '');
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
    if (name.trim().length === 0) {
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
      name: name.trim(),
      description: description.trim(),
      category: category.trim() || 'Ostatní',
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
        <TextInput
          label={t('tasks.nameLabel')}
          value={name}
          onChange={(event) => setName(event.target.value)}
          autoFocus
        />
        <TextInput
          label={t('tasks.descriptionLabel')}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
        <TextInput
          label={t('tasks.categoryField')}
          value={category}
          onChange={(event) => setCategory(event.target.value)}
        />
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

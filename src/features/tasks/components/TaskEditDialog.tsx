import { type FormEvent, useState } from 'react';

import { createTask, type TaskFields, updateTask } from '../../../data/catalogAdmin';
import { db } from '../../../data/firebase';
import {
  parseLocalized,
  parseLocalizedLines,
  serializeLocalized,
} from '../../../data/importCatalog';
import { deriveReward } from '../../../domain/coins';
import type { Task } from '../../../domain/types';
import { useTranslation } from '../../../i18n/LocaleProvider';
import { Button } from '../../../ui/Button';
import { Checkbox } from '../../../ui/Checkbox';
import { CoinAmount } from '../../../ui/CoinAmount';
import { Dialog } from '../../../ui/Dialog';
import { Select } from '../../../ui/Select';
import { TextInput } from '../../../ui/TextInput';

const DIFFICULTIES = [1, 2, 3, 4, 5, 6];
const AREA =
  'min-h-20 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-content outline-none focus:border-accent';

/**
 * Add or edit one task (spec 9.4). Name, description and each category tag are written in one field
 * as `cs|en|de` (like the import), which keeps the form short enough to stay usable on a phone.
 * Coins follow the difficulty formula unless "manual coins" is ticked, which pins an override the
 * TSV importer then leaves alone (spec 5). `Task` carries no `manualCoins`, so on open we infer it:
 * coins that differ from the formula were overridden.
 */
export function TaskEditDialog({
  task,
  onClose,
  turnusId,
}: {
  task: Task | null;
  onClose: () => void;
  turnusId: string;
}) {
  const { t } = useTranslation();
  const [name, setName] = useState(task ? serializeLocalized(task.name) : '');
  const [description, setDescription] = useState(task ? serializeLocalized(task.description) : '');
  const [tags, setTags] = useState(() =>
    (task?.categories ?? []).map(serializeLocalized).join('\n'),
  );
  const [difficulty, setDifficulty] = useState(task?.difficulty ?? 3);
  const [minPlayers, setMinPlayers] = useState(String(task?.minPlayers ?? 1));
  const [maxPlayers, setMaxPlayers] = useState(String(task?.maxPlayers ?? 1));
  const [active, setActive] = useState(task?.active ?? true);
  const [manual, setManual] = useState(
    task !== null && task.coinReward !== deriveReward(task.difficulty),
  );
  const [reward, setReward] = useState(String(task?.coinReward ?? ''));
  const [error, setError] = useState<string | null>(null);

  const autoReward = deriveReward(difficulty);

  const submit = (event: FormEvent): void => {
    event.preventDefault();
    const parsedName = parseLocalized(name);
    if (parsedName.cs.length === 0) {
      setError(t('tasks.invalidName'));
      return;
    }
    const coinReward = manual ? Number(reward) : autoReward;
    if (manual && !Number.isFinite(coinReward)) {
      setError(t('tasks.invalidCoins'));
      return;
    }
    const min = Math.max(1, Number(minPlayers) || 1);
    const max = Math.max(min, Number(maxPlayers) || min);
    const fields: TaskFields = {
      name: parsedName,
      description: parseLocalized(description),
      categories: parseLocalizedLines(tags),
      difficulty,
      minPlayers: min,
      maxPlayers: max,
      coinReward,
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
          placeholder="cs|en|de"
          autoFocus
        />
        <TextInput
          label={t('tasks.descriptionLabel')}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="cs|en|de"
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
        <div className="flex gap-2">
          <TextInput
            label={t('tasks.minPlayersLabel')}
            value={minPlayers}
            onChange={(event) => setMinPlayers(event.target.value)}
            inputMode="numeric"
          />
          <TextInput
            label={t('tasks.maxPlayersLabel')}
            value={maxPlayers}
            onChange={(event) => setMaxPlayers(event.target.value)}
            inputMode="numeric"
          />
        </div>
        <Checkbox label={t('tasks.activeLabel')} checked={active} onChange={setActive} />
        <Checkbox label={t('tasks.manualCoinsLabel')} checked={manual} onChange={setManual} />
        {manual ? (
          <TextInput
            label={t('tasks.coinRewardLabel')}
            value={reward}
            onChange={(event) => setReward(event.target.value)}
            inputMode="numeric"
          />
        ) : (
          <p className="flex items-center gap-2 text-sm text-content-muted">
            {t('tasks.autoCoins')}
            <CoinAmount amount={autoReward} signed />
          </p>
        )}
        {error !== null && <p className="text-sm text-danger">{error}</p>}
        <Button type="submit">{t('tasks.save')}</Button>
      </form>
    </Dialog>
  );
}

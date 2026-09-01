import { type FormEvent, useState } from 'react';

import { createReward, type RewardFields, updateReward } from '../../../data/catalogAdmin';
import { db } from '../../../data/firebase';
import {
  parseLocalized,
  parseLocalizedLines,
  serializeLocalized,
} from '../../../data/importCatalog';
import type { Reward, RewardForm } from '../../../domain/types';
import { useTranslation } from '../../../i18n/LocaleProvider';
import { Button } from '../../../ui/Button';
import { Checkbox } from '../../../ui/Checkbox';
import { Dialog } from '../../../ui/Dialog';
import { Select } from '../../../ui/Select';
import { TextInput } from '../../../ui/TextInput';

const FORMS: readonly RewardForm[] = ['reward', 'punish_someone', 'punish_all'];
const AREA =
  'min-h-20 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-content outline-none focus:border-accent';

/** Add or edit one reward (spec 9.4). Name, description and each tag are one `cs|en|de` field (like
 * the import), keeping the form short on mobile. `punish_someone` also picks how many players it
 * targets (a min–max range, like a group task); other forms carry no targets. */
export function RewardEditDialog({
  reward,
  onClose,
  turnusId,
}: {
  reward: Reward | null;
  onClose: () => void;
  turnusId: string;
}) {
  const { t } = useTranslation();
  const [name, setName] = useState(reward ? serializeLocalized(reward.name) : '');
  const [description, setDescription] = useState(
    reward ? serializeLocalized(reward.description) : '',
  );
  const [tags, setTags] = useState(() =>
    (reward?.categories ?? []).map(serializeLocalized).join('\n'),
  );
  const [price, setPrice] = useState(String(reward?.price ?? ''));
  const [form, setForm] = useState<RewardForm>(reward?.form ?? 'reward');
  const [minTargets, setMinTargets] = useState(String(reward?.minTargets || 1));
  const [maxTargets, setMaxTargets] = useState(String(reward?.maxTargets || 1));
  const [exclusive, setExclusive] = useState(reward?.exclusivePerDay ?? false);
  const [active, setActive] = useState(reward?.active ?? true);
  const [error, setError] = useState<string | null>(null);

  const submit = (event: FormEvent): void => {
    event.preventDefault();
    const parsedName = parseLocalized(name);
    if (parsedName.cs.length === 0) {
      setError(t('rewards.invalidName'));
      return;
    }
    const priceValue = Number(price);
    if (!Number.isFinite(priceValue) || priceValue < 0) {
      setError(t('rewards.invalidPrice'));
      return;
    }
    const min = form === 'punish_someone' ? Math.max(1, Number(minTargets) || 1) : 0;
    const max = form === 'punish_someone' ? Math.max(min, Number(maxTargets) || min) : 0;
    const fields: RewardFields = {
      name: parsedName,
      description: parseLocalized(description),
      categories: parseLocalizedLines(tags),
      price: priceValue,
      form,
      minTargets: min,
      maxTargets: max,
      exclusivePerDay: exclusive,
      active,
    };
    if (reward === null) void createReward(db, turnusId, fields);
    else void updateReward(db, turnusId, reward.id, fields);
    onClose();
  };

  return (
    <Dialog
      open
      onClose={onClose}
      title={t(reward === null ? 'rewards.createTitle' : 'rewards.editTitle')}
    >
      <form onSubmit={submit} className="flex flex-col gap-3">
        <TextInput
          label={t('rewards.nameLabel')}
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="cs|en|de"
          autoFocus
        />
        <TextInput
          label={t('rewards.descriptionLabel')}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="cs|en|de"
        />
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-content-muted">{t('rewards.tagsLabel')}</span>
          <textarea
            value={tags}
            onChange={(event) => setTags(event.target.value)}
            className={AREA}
            placeholder={t('rewards.tagsHint')}
          />
        </label>
        <TextInput
          label={t('rewards.priceLabel')}
          value={price}
          onChange={(event) => setPrice(event.target.value)}
          inputMode="numeric"
        />
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-content-muted">
            {t('rewards.formLabel')}
          </span>
          <Select
            value={form}
            onChange={(event) => setForm(event.target.value as RewardForm)}
            className="w-full"
          >
            {FORMS.map((value) => (
              <option key={value} value={value}>
                {t(`rewards.forms.${value}`)}
              </option>
            ))}
          </Select>
        </label>
        {form === 'punish_someone' && (
          <div className="flex gap-2">
            <TextInput
              label={t('rewards.minTargetsLabel')}
              value={minTargets}
              onChange={(event) => setMinTargets(event.target.value)}
              inputMode="numeric"
            />
            <TextInput
              label={t('rewards.maxTargetsLabel')}
              value={maxTargets}
              onChange={(event) => setMaxTargets(event.target.value)}
              inputMode="numeric"
            />
          </div>
        )}
        <Checkbox label={t('rewards.exclusiveLabel')} checked={exclusive} onChange={setExclusive} />
        <Checkbox label={t('rewards.activeLabel')} checked={active} onChange={setActive} />
        {error !== null && <p className="text-sm text-danger">{error}</p>}
        <Button type="submit">{t('rewards.save')}</Button>
      </form>
    </Dialog>
  );
}

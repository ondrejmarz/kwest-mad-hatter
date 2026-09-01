import { type FormEvent, useState } from 'react';

import { createReward, type RewardFields, updateReward } from '../../../data/catalogAdmin';
import { db } from '../../../data/firebase';
import { parseLocalizedLines, serializeLocalized } from '../../../data/importCatalog';
import type { LocalizedText, Reward, RewardForm } from '../../../domain/types';
import { useTranslation } from '../../../i18n/LocaleProvider';
import { Button } from '../../../ui/Button';
import { Checkbox } from '../../../ui/Checkbox';
import { Dialog } from '../../../ui/Dialog';
import { LocalizedField } from '../../../ui/LocalizedField';
import { Select } from '../../../ui/Select';
import { TextInput } from '../../../ui/TextInput';

const FORMS: readonly RewardForm[] = ['reward', 'punish_someone', 'punish_all'];
const EMPTY: LocalizedText = { cs: '', en: '', de: '' };
const AREA =
  'min-h-20 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-content outline-none focus:border-accent';

const trimLoc = (value: LocalizedText): LocalizedText => ({
  cs: value.cs.trim(),
  en: value.en.trim(),
  de: value.de.trim(),
});

/** Add or edit one reward (spec 9.4). Trilingual name/description + category tags (one per line);
 * target counts are derived from the form in the data layer. */
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
  const [name, setName] = useState<LocalizedText>(reward?.name ?? EMPTY);
  const [description, setDescription] = useState<LocalizedText>(reward?.description ?? EMPTY);
  const [tags, setTags] = useState(() =>
    (reward?.categories ?? []).map(serializeLocalized).join('\n'),
  );
  const [price, setPrice] = useState(String(reward?.price ?? ''));
  const [form, setForm] = useState<RewardForm>(reward?.form ?? 'reward');
  const [exclusive, setExclusive] = useState(reward?.exclusivePerDay ?? false);
  const [active, setActive] = useState(reward?.active ?? true);
  const [error, setError] = useState<string | null>(null);

  const submit = (event: FormEvent): void => {
    event.preventDefault();
    if (name.cs.trim().length === 0) {
      setError(t('rewards.invalidName'));
      return;
    }
    const priceValue = Number(price);
    if (!Number.isFinite(priceValue) || priceValue < 0) {
      setError(t('rewards.invalidPrice'));
      return;
    }
    const fields: RewardFields = {
      name: trimLoc(name),
      description: trimLoc(description),
      categories: parseLocalizedLines(tags),
      price: priceValue,
      form,
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
        <LocalizedField label={t('rewards.nameLabel')} value={name} onChange={setName} autoFocus />
        <LocalizedField
          label={t('rewards.descriptionLabel')}
          value={description}
          onChange={setDescription}
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
        <Checkbox label={t('rewards.exclusiveLabel')} checked={exclusive} onChange={setExclusive} />
        <Checkbox label={t('rewards.activeLabel')} checked={active} onChange={setActive} />
        {error !== null && <p className="text-sm text-danger">{error}</p>}
        <Button type="submit">{t('rewards.save')}</Button>
      </form>
    </Dialog>
  );
}

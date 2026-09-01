import { type FormEvent, useState } from 'react';

import { createReward, type RewardFields, updateReward } from '../../../data/catalogAdmin';
import { db } from '../../../data/firebase';
import type { Reward, RewardForm } from '../../../domain/types';
import { useTranslation } from '../../../i18n/LocaleProvider';
import { Button } from '../../../ui/Button';
import { Checkbox } from '../../../ui/Checkbox';
import { Dialog } from '../../../ui/Dialog';
import { Select } from '../../../ui/Select';
import { TextInput } from '../../../ui/TextInput';

const FORMS: readonly RewardForm[] = ['reward', 'punish_someone', 'punish_all'];

/** Add or edit one reward (spec 9.4). Target counts are derived from the form in the data layer. */
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
  const [name, setName] = useState(reward?.name ?? '');
  const [description, setDescription] = useState(reward?.description ?? '');
  const [price, setPrice] = useState(String(reward?.price ?? ''));
  const [form, setForm] = useState<RewardForm>(reward?.form ?? 'reward');
  const [exclusive, setExclusive] = useState(reward?.exclusivePerDay ?? false);
  const [active, setActive] = useState(reward?.active ?? true);
  const [error, setError] = useState<string | null>(null);

  const submit = (event: FormEvent): void => {
    event.preventDefault();
    if (name.trim().length === 0) {
      setError(t('rewards.invalidName'));
      return;
    }
    const priceValue = Number(price);
    if (!Number.isFinite(priceValue) || priceValue < 0) {
      setError(t('rewards.invalidPrice'));
      return;
    }
    const fields: RewardFields = {
      name: name.trim(),
      description: description.trim(),
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
        <TextInput
          label={t('rewards.nameLabel')}
          value={name}
          onChange={(event) => setName(event.target.value)}
          autoFocus
        />
        <TextInput
          label={t('rewards.descriptionLabel')}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
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

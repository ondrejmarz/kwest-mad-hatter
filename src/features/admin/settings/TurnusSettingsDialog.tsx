import { type FormEvent, useState } from 'react';

import { db } from '../../../data/firebase';
import type { Turnus } from '../../../data/schemas/turnus';
import { type TurnusSettingsFields, updateTurnusSettings } from '../../../data/turnusAdmin';
import { useTranslation } from '../../../i18n/LocaleProvider';
import { Button } from '../../../ui/Button';
import { Checkbox } from '../../../ui/Checkbox';
import { Dialog } from '../../../ui/Dialog';
import { FormError } from '../../../ui/FormError';
import { TextInput } from '../../../ui/TextInput';

/**
 * Admin form for the turnus game parameters (spec 9.4). Identity, the round counter and the day
 * lock are edited by their own actions, so only the tunable knobs live here; the rules already limit
 * a turnus update to its admin, so this is plain UI over `updateTurnusSettings`.
 */
export function TurnusSettingsDialog({
  turnus,
  turnusId,
  onClose,
}: {
  turnus: Turnus;
  turnusId: string;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [startingCoins, setStartingCoins] = useState(String(turnus.startingCoins));
  const [failPenalty, setFailPenalty] = useState(String(turnus.failPenalty));
  const [noPickPenalty, setNoPickPenalty] = useState(String(turnus.noPickPenalty));
  const [maxRewards, setMaxRewards] = useState(String(turnus.maxActiveRewardsPerPlayer));
  const [maxPunishes, setMaxPunishes] = useState(String(turnus.maxActivePunishesPerPlayer));
  const [allowNegative, setAllowNegative] = useState(turnus.allowNegativeBalance);
  const [error, setError] = useState<string | null>(null);

  const submit = (event: FormEvent): void => {
    event.preventDefault();
    const values = {
      startingCoins: Number(startingCoins),
      failPenalty: Number(failPenalty),
      noPickPenalty: Number(noPickPenalty),
      maxActiveRewardsPerPlayer: Number(maxRewards),
      maxActivePunishesPerPlayer: Number(maxPunishes),
    };
    if (Object.values(values).some((n) => !Number.isFinite(n) || n < 0)) {
      setError(t('turnusSettings.invalid'));
      return;
    }
    const fields: TurnusSettingsFields = {
      ...values,
      allowNegativeBalance: allowNegative,
    };
    void updateTurnusSettings(db, turnusId, fields);
    onClose();
  };

  return (
    <Dialog open onClose={onClose} title={t('turnusSettings.title')}>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <TextInput
          label={t('turnusSettings.startingCoins')}
          value={startingCoins}
          onChange={(event) => setStartingCoins(event.target.value)}
          inputMode="numeric"
        />
        <div className="flex gap-2">
          <TextInput
            label={t('turnusSettings.failPenalty')}
            value={failPenalty}
            onChange={(event) => setFailPenalty(event.target.value)}
            inputMode="numeric"
          />
          <TextInput
            label={t('turnusSettings.noPickPenalty')}
            value={noPickPenalty}
            onChange={(event) => setNoPickPenalty(event.target.value)}
            inputMode="numeric"
          />
        </div>
        <div className="flex gap-2">
          <TextInput
            label={t('turnusSettings.maxRewards')}
            value={maxRewards}
            onChange={(event) => setMaxRewards(event.target.value)}
            inputMode="numeric"
          />
          <TextInput
            label={t('turnusSettings.maxPunishes')}
            value={maxPunishes}
            onChange={(event) => setMaxPunishes(event.target.value)}
            inputMode="numeric"
          />
        </div>
        <Checkbox
          label={t('turnusSettings.allowNegative')}
          checked={allowNegative}
          onChange={setAllowNegative}
        />
        <FormError message={error} />
        <Button type="submit">{t('turnusSettings.save')}</Button>
      </form>
    </Dialog>
  );
}

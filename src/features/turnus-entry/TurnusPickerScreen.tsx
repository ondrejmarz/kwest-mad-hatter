import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { db } from '../../data/firebase';
import { listTurnuses } from '../../data/repositories/turnus';
import type { Turnus } from '../../data/schemas/turnus';
import { useTranslation } from '../../i18n/LocaleProvider';
import { Button } from '../../ui/Button';
import { Spinner } from '../../ui/Spinner';

import { EntryLayout } from './EntryLayout';

/** Lists the available turnuses; picking one routes to its `/t/{slug}` entry (spec 3a). */
export function TurnusPickerScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [turnuses, setTurnuses] = useState<readonly Turnus[] | null>(null);

  useEffect(() => {
    let active = true;
    listTurnuses(db)
      .then((list) => {
        if (active) setTurnuses(list);
      })
      .catch(() => {
        if (active) setTurnuses([]);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <EntryLayout title={t('entry.pickTitle')} subtitle={t('entry.pickSubtitle')}>
      {turnuses === null ? (
        <div className="flex justify-center">
          <Spinner />
        </div>
      ) : turnuses.length === 0 ? (
        <p className="text-center text-content-muted">{t('entry.empty')}</p>
      ) : (
        turnuses.map((turnus) => (
          <Button key={turnus.id} variant="secondary" onClick={() => navigate(`/t/${turnus.slug}`)}>
            {turnus.name}
          </Button>
        ))
      )}
    </EntryLayout>
  );
}

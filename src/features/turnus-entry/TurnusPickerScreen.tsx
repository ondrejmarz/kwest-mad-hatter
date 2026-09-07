import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';

import { db } from '../../data/firebase';
import { getMyRole, listTurnuses } from '../../data/repositories/turnus';
import type { Turnus } from '../../data/schemas/turnus';
import { useTranslation } from '../../i18n/LocaleProvider';
import { Button } from '../../ui/Button';
import { Spinner } from '../../ui/Spinner';
import { useSession } from '../session';

import type { EntryOutletContext } from './EntryTabsLayout';
import { JoinTurnusDialog } from './JoinTurnusDialog';

/** The Skupiny tab (spec 3a): lists every turnus; picking one opens the join dialog. */
export function TurnusPickerScreen() {
  const { t } = useTranslation();
  const { uid } = useSession();
  const { beginEnter } = useOutletContext<EntryOutletContext>();
  const [turnuses, setTurnuses] = useState<readonly Turnus[] | null>(null);
  const [selected, setSelected] = useState<Turnus | null>(null);
  const [checking, setChecking] = useState<string | null>(null);

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

  // A device that already belongs to this turnus (a code was accepted here before) skips the code
  // and goes straight in; a turnus it has never joined still needs the code (the rules require it).
  const pick = async (turnus: Turnus): Promise<void> => {
    if (uid === null || checking !== null) return;
    setChecking(turnus.id);
    try {
      const role = await getMyRole(db, turnus.id, uid);
      if (role !== null) beginEnter(turnus);
      else setSelected(turnus);
    } catch {
      setSelected(turnus);
    } finally {
      setChecking(null);
    }
  };

  return (
    <section className="flex flex-col gap-6">
      <header className="text-center">
        {/* Smaller on phones (a long title wraps on a narrow iPhone), full size from sm up. */}
        <h1 className="text-balance text-xl font-bold text-content sm:text-2xl">
          {t('entry.pickTitle')}
        </h1>
        <p className="mt-2 text-content-muted">{t('entry.pickSubtitle')}</p>
      </header>

      <div className="flex flex-col gap-3">
        {turnuses === null ? (
          <div className="flex justify-center">
            <Spinner />
          </div>
        ) : turnuses.length === 0 ? (
          <p className="text-center text-content-muted">{t('entry.empty')}</p>
        ) : (
          turnuses.map((turnus) => (
            <Button
              key={turnus.id}
              variant="secondary"
              disabled={checking !== null}
              onClick={() => void pick(turnus)}
            >
              {turnus.name}
            </Button>
          ))
        )}
      </div>

      {selected !== null && (
        <JoinTurnusDialog
          turnus={selected}
          onClose={() => setSelected(null)}
          onJoined={() => beginEnter(selected)}
        />
      )}
    </section>
  );
}

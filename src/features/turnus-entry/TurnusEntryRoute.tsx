import { useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';

import { db } from '../../data/firebase';
import { getTurnusBySlug } from '../../data/repositories/turnus';
import { useTranslation } from '../../i18n/LocaleProvider';
import { Button } from '../../ui/Button';
import { Spinner } from '../../ui/Spinner';
import { useSession } from '../session';

import { EntryLayout } from './EntryLayout';

/** Resolves the bookmarkable `/t/{slug}` URL to a turnus, then hands off to the gate (spec 3a). */
export function TurnusEntryRoute() {
  const { slug } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { uid, turnus, enterTurnus } = useSession();
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (uid === null || slug === undefined || turnus?.slug === slug) return;
    let active = true;
    getTurnusBySlug(db, slug)
      .then((found) => {
        if (!active) return;
        if (found) enterTurnus({ id: found.id, slug: found.slug });
        else setNotFound(true);
      })
      .catch(() => {
        if (active) setNotFound(true);
      });
    return () => {
      active = false;
    };
  }, [uid, slug, turnus, enterTurnus]);

  if (turnus?.slug === slug) return <Navigate to="/" replace />;
  if (notFound) {
    return (
      <EntryLayout title={t('entry.pickTitle')}>
        <p className="text-center text-danger">{t('entry.unknownTurnus')}</p>
        <Button variant="secondary" onClick={() => navigate('/enter')}>
          {t('entry.back')}
        </Button>
      </EntryLayout>
    );
  }
  return (
    <div className="flex min-h-full items-center justify-center bg-surface">
      <Spinner />
    </div>
  );
}

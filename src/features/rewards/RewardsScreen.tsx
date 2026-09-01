import { useMemo, useState } from 'react';

import type { Reward, RewardForm } from '../../domain/types';
import { useTranslation } from '../../i18n/LocaleProvider';
import { localize } from '../../i18n/localize';
import type { Locale } from '../../i18n/translate';
import { csCollator } from '../../lib/collator';
import { byNumber, byText } from '../../lib/sort';
import { usePersistentState } from '../../platform/storage/usePersistentState';
import { Button } from '../../ui/Button';
import { EmptyState } from '../../ui/EmptyState';
import { Select } from '../../ui/Select';
import { Spinner } from '../../ui/Spinner';
import { useCatalogRewards, useSession, useTurnus } from '../session';

import { RewardCard } from './components/RewardCard';
import { RewardEditDialog } from './components/RewardEditDialog';

const REWARD_SORTS = ['nameAsc', 'nameDesc', 'coinsAsc', 'coinsDesc'] as const;
type RewardSort = (typeof REWARD_SORTS)[number];
const FORMS: readonly RewardForm[] = ['reward', 'punish_someone', 'punish_all'];

function rewardComparator(sort: RewardSort, locale: Locale): (a: Reward, b: Reward) => number {
  switch (sort) {
    case 'nameAsc':
      return byText((reward) => localize(reward.name, locale), 'asc');
    case 'nameDesc':
      return byText((reward) => localize(reward.name, locale), 'desc');
    case 'coinsAsc':
      return byNumber((reward) => reward.price, 'asc');
    case 'coinsDesc':
      return byNumber((reward) => reward.price, 'desc');
  }
}

/** Reward catalog (spec 9.3): sort, filter by form, admin add/edit. Buying lands in phase 7. */
export function RewardsScreen() {
  const { t, locale } = useTranslation();
  const { role } = useSession();
  const rewardsState = useCatalogRewards();
  const turnusState = useTurnus();
  const isAdmin = role === 'admin';

  const [sort, setSort] = usePersistentState<RewardSort>('kwest.rewards.sort', 'nameAsc');
  const [formFilter, setFormFilter] = usePersistentState<'' | RewardForm>('kwest.rewards.form', '');
  const [editing, setEditing] = useState<Reward | null | undefined>(undefined);

  const turnus = turnusState.status === 'ready' ? turnusState.data : null;
  const rewards = useMemo(() => {
    if (rewardsState.status !== 'ready') return [];
    const compare = rewardComparator(sort, locale);
    return rewardsState.data
      .filter((reward) => reward.active)
      .filter((reward) => formFilter === '' || reward.form === formFilter)
      .sort(
        (a, b) =>
          compare(a, b) || csCollator.compare(localize(a.name, locale), localize(b.name, locale)),
      );
  }, [rewardsState, sort, formFilter, locale]);

  if (rewardsState.status === 'loading') {
    return (
      <div className="flex justify-center py-10">
        <Spinner />
      </div>
    );
  }
  if (rewardsState.status === 'error') {
    return <EmptyState title={t('common.somethingWrong')} description={t('common.retry')} />;
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <Select value={sort} onChange={(event) => setSort(event.target.value as RewardSort)}>
            {REWARD_SORTS.map((value) => (
              <option key={value} value={value}>
                {t(`sort.${value}`)}
              </option>
            ))}
          </Select>
          <Select
            value={formFilter}
            onChange={(event) => setFormFilter(event.target.value as '' | RewardForm)}
          >
            <option value="">{t('rewards.filterAll')}</option>
            {FORMS.map((value) => (
              <option key={value} value={value}>
                {t(`rewards.forms.${value}`)}
              </option>
            ))}
          </Select>
        </div>
        {isAdmin && (
          <Button
            variant="secondary"
            size="icon"
            className="shrink-0"
            aria-label={t('rewards.add')}
            onClick={() => setEditing(null)}
          >
            +
          </Button>
        )}
      </div>

      {rewards.length === 0 ? (
        <EmptyState title={t('nav.rewards')} description={t('rewards.empty')} />
      ) : (
        <div className="flex flex-col gap-2">
          {rewards.map((reward) => (
            <RewardCard
              key={reward.id}
              reward={reward}
              isAdmin={isAdmin}
              onEdit={() => setEditing(reward)}
            />
          ))}
        </div>
      )}

      {editing !== undefined && turnus !== null && (
        <RewardEditDialog
          reward={editing}
          onClose={() => setEditing(undefined)}
          turnusId={turnus.id}
        />
      )}
    </section>
  );
}

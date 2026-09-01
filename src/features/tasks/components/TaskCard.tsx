import { memo } from 'react';

import type { Task } from '../../../domain/types';
import { useTranslation } from '../../../i18n/LocaleProvider';
import { categoryLabel } from '../../../lib/category';
import { Chip } from '../../../ui/Chip';
import { CoinAmount } from '../../../ui/CoinAmount';
import { DifficultyDots } from '../../../ui/DifficultyDots';
import { EditButton } from '../../../ui/EditButton';
import { ListCard } from '../../../ui/ListCard';

/**
 * A task card (spec 9.2): name + difficulty dots on the first line, chips (category
 * without its emoji, pair, availability), the description, then coins and the admin
 * pencil. The availability flags come from the pure eligibility rules in the screen.
 */
export const TaskCard = memo(function TaskCard({
  task,
  unavailableTomorrow,
  unavailableToday,
  isAdmin,
  onEdit,
}: {
  task: Task;
  unavailableTomorrow: boolean;
  unavailableToday: boolean;
  isAdmin: boolean;
  onEdit: () => void;
}) {
  const { t } = useTranslation();
  return (
    <ListCard
      title={task.name}
      topRight={<DifficultyDots value={task.difficulty} />}
      chips={
        <>
          <Chip>{t('tasks.category', { name: categoryLabel(task.category) })}</Chip>
          {task.isPair && <Chip tone="accent">{t('tasks.pair')}</Chip>}
          {unavailableTomorrow && <Chip tone="warning">{t('tasks.unavailableTomorrow')}</Chip>}
          {unavailableToday && <Chip>{t('tasks.unavailableToday')}</Chip>}
        </>
      }
      description={task.description}
      footerLeft={isAdmin ? <EditButton onClick={onEdit} /> : undefined}
      footerRight={
        <div className="flex items-center gap-2">
          <CoinAmount amount={task.coinReward} signed />
          <CoinAmount amount={-task.coinPenalty} signed />
        </div>
      }
    />
  );
});

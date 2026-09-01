import { memo } from 'react';

import type { Task } from '../../../domain/types';
import { useTranslation } from '../../../i18n/LocaleProvider';
import { localize } from '../../../i18n/localize';
import { categoryLabel } from '../../../lib/category';
import { formatGroupSize, taskType } from '../../../lib/group';
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
  reserved = false,
  isAdmin,
  onOpen,
  onEdit,
}: {
  task: Task;
  unavailableTomorrow: boolean;
  unavailableToday: boolean;
  reserved?: boolean;
  isAdmin: boolean;
  onOpen?: () => void;
  onEdit: () => void;
}) {
  const { t, locale } = useTranslation();
  return (
    <ListCard
      {...(onOpen ? { onClick: onOpen } : {})}
      title={localize(task.name, locale)}
      topRight={<DifficultyDots value={task.difficulty} />}
      chips={
        <>
          {task.categories.map((category) => (
            <Chip key={category.cs}>{categoryLabel(localize(category, locale))}</Chip>
          ))}
          {taskType(task.minPlayers, task.maxPlayers) === 'pair' && (
            <Chip tone="accent">{t('tasks.pairChip')}</Chip>
          )}
          {taskType(task.minPlayers, task.maxPlayers) === 'group' && (
            <Chip tone="accent">
              {t('tasks.groupSize', { size: formatGroupSize(task.minPlayers, task.maxPlayers) })}
            </Chip>
          )}
          {reserved && <Chip tone="success">{t('tasks.reservedChip')}</Chip>}
          {unavailableTomorrow && <Chip tone="warning">{t('tasks.unavailableTomorrow')}</Chip>}
          {unavailableToday && <Chip tone="danger">{t('tasks.unavailableToday')}</Chip>}
        </>
      }
      description={localize(task.description, locale)}
      footerLeft={isAdmin ? <EditButton onClick={onEdit} /> : undefined}
      footerRight={<CoinAmount amount={task.coinReward} signed />}
    />
  );
});

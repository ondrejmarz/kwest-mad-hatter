import { memo } from 'react';

import type { Task } from '../../../domain/types';
import { useTranslation } from '../../../i18n/LocaleProvider';
import { localize } from '../../../i18n/localize';
import { categoryLabel } from '../../../lib/category';
import { formatGroupSize, taskType } from '../../../lib/group';
import { CardTopRight } from '../../../ui/CardTopRight';
import { Chip } from '../../../ui/Chip';
import { CoinAmount } from '../../../ui/CoinAmount';
import { DifficultyDots } from '../../../ui/DifficultyDots';
import { EditButton } from '../../../ui/EditButton';
import { ListCard } from '../../../ui/ListCard';

/**
 * A task card (spec 9.2): the name, then top-right the coin reward with the difficulty dots directly
 * beneath it and (for an admin) the edit pencil furthest right; chips (category without its emoji,
 * pair/group, and live status) and the description below. The status chips are the concrete facts the
 * screen computes: who holds it today (mine vs. someone else) and whether it carries a reservation
 * for tomorrow (mine vs. another player's interest).
 */
export const TaskCard = memo(function TaskCard({
  task,
  mine = false,
  taken = false,
  reserved = false,
  interestCount = 0,
  isAdmin,
  onOpen,
  onEdit,
}: {
  task: Task;
  /** This is the viewer's own active task today. */
  mine?: boolean;
  /** Another player holds this task today (first-come "taken"). */
  taken?: boolean;
  /** The viewer reserved this task for tomorrow. */
  reserved?: boolean;
  /** How many other players reserved this task for tomorrow (no names). */
  interestCount?: number;
  isAdmin: boolean;
  onOpen?: () => void;
  onEdit: () => void;
}) {
  const { t, locale } = useTranslation();
  return (
    <ListCard
      {...(onOpen ? { onClick: onOpen } : {})}
      title={localize(task.name, locale)}
      topRight={
        <CardTopRight
          coins={<CoinAmount amount={task.coinReward} signed />}
          below={<DifficultyDots value={task.difficulty} />}
          {...(isAdmin ? { edit: <EditButton onClick={onEdit} /> } : {})}
        />
      }
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
          {mine && <Chip tone="success">{t('tasks.selectedChip')}</Chip>}
          {taken && <Chip tone="danger">{t('tasks.takenChip')}</Chip>}
          {reserved && <Chip tone="success">{t('tasks.reservedChip')}</Chip>}
          {interestCount > 0 && (
            <Chip tone="warning">
              {interestCount > 1
                ? t('tasks.hasInterestCount', { count: interestCount })
                : t('tasks.hasInterest')}
            </Chip>
          )}
        </>
      }
      description={localize(task.description, locale)}
    />
  );
});

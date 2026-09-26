import type { Task } from '../../../domain/types';
import { useTranslation } from '../../../i18n/LocaleProvider';
import { localize } from '../../../i18n/localize';
import { categoryLabel } from '../../../lib/category';
import { formatGroupSize, taskType } from '../../../lib/group';
import { CardLayout } from '../../../ui/CardLayout';
import { Chip } from '../../../ui/Chip';
import { CoinAmount } from '../../../ui/CoinAmount';
import { DifficultyDots } from '../../../ui/DifficultyDots';

/**
 * The top of the task dialog (spec 9.2): the same card layout as the list row — name, difficulty,
 * category and pair/group chips, the full (unclamped) description and the coin reward.
 */
export function TaskDialogHeader({ task }: { task: Task }) {
  const { t, locale } = useTranslation();
  const type = taskType(task.minPlayers, task.maxPlayers);
  return (
    <CardLayout
      title={localize(task.name, locale)}
      topRight={<DifficultyDots value={task.difficulty} />}
      chips={
        <>
          {task.categories.map((category) => (
            <Chip key={category.cs}>{categoryLabel(localize(category, locale))}</Chip>
          ))}
          {type === 'pair' && <Chip tone="accent">{t('tasks.pairChip')}</Chip>}
          {type === 'group' && (
            <Chip tone="accent">
              {t('tasks.groupSize', { size: formatGroupSize(task.minPlayers, task.maxPlayers) })}
            </Chip>
          )}
        </>
      }
      {...(task.description.cs !== '' ? { description: localize(task.description, locale) } : {})}
      footerRight={<CoinAmount amount={task.coinReward} signed />}
      clampDescription={false}
    />
  );
}

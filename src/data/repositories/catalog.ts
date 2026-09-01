import type { Firestore } from 'firebase/firestore';

import type { Reward, Task } from '../../domain/types';
import { rewardsCol, tasksCol } from '../paths';
import { parseReward, parseTask } from '../schemas/catalog';
import { subscribeQuery, type Subscription } from '../subscriptions';

export const subscribeTasks = (
  db: Firestore,
  t: string,
  onState: (state: Subscription<readonly Task[]>) => void,
): (() => void) => subscribeQuery(tasksCol(db, t), parseTask, onState);

export const subscribeRewards = (
  db: Firestore,
  t: string,
  onState: (state: Subscription<readonly Reward[]>) => void,
): (() => void) => subscribeQuery(rewardsCol(db, t), parseReward, onState);

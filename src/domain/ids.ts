/**
 * Branded id types prevent mixing up a TaskId and a PlayerId in function
 * parameters (spec 15.12). The brand is erased at runtime.
 */
declare const brand: unique symbol;
type Brand<T, B extends string> = T & { readonly [brand]: B };

export type PlayerId = Brand<string, 'PlayerId'>;
export type TaskId = Brand<string, 'TaskId'>;
export type RewardId = Brand<string, 'RewardId'>;
export type TurnusId = Brand<string, 'TurnusId'>;
export type Day = Brand<number, 'Day'>;

export const PlayerId = (raw: string): PlayerId => raw as PlayerId;
export const TaskId = (raw: string): TaskId => raw as TaskId;
export const RewardId = (raw: string): RewardId => raw as RewardId;
export const TurnusId = (raw: string): TurnusId => raw as TurnusId;
export const Day = (raw: number): Day => raw as Day;

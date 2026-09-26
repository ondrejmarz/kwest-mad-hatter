import type { RulesContent } from './types.ts';

export const rulesEn: RulesContent = {
  title: 'Rules of the game',
  intro: 'All the rules in one place. Tap a rule with a question mark to read the details.',
  contents: 'Contents',
  related: 'Related',
  checkedAt: 'These rules match the game as of {date}.',
  sections: {
    basics: { title: 'How the game works', short: 'How it works' },
    character: { title: 'Group and character', short: 'Character' },
    tasks: { title: 'Tasks', short: 'Tasks' },
    reservations: { title: 'Reserving for the next round', short: 'Reservations' },
    currentRound: { title: 'A task for the current round', short: 'Current round' },
    teams: { title: 'Pairs and group tasks', short: 'Pairs and groups' },
    auction: { title: 'Reward auction', short: 'Auction' },
    punishments: { title: 'Punishments', short: 'Punishments' },
    evaluation: { title: 'Round evaluation', short: 'Evaluation' },
    coins: { title: 'Coins', short: 'Coins' },
    visibility: { title: 'What is public and what is secret', short: 'Who sees what' },
    settings: { title: 'Group settings', short: 'Settings' },
  },
  rules: {
    goal: {
      summary:
        'You complete tasks, earn coins and spend them in an auction on rewards, or on punishments for the others.',
      detail: {
        title: 'What the game is about',
        blocks: [
          'KWEST is played by a group of people spending a few days together, on a trip or at a camp. Everyone plays as their own character. Completed tasks earn coins, failed ones cost a penalty. You spend the coins in an auction: on a reward for yourself, or on a punishment for someone else.',
          'Tasks, rewards and punishments all happen in the real world. The app keeps the rules, counts the coins and remembers who has what.',
        ],
      },
    },
    rounds: {
      summary:
        'The game runs in rounds. In each round you work on one task and line up your task for the next round.',
      detail: {
        title: 'Rounds',
        blocks: [
          'A round lasts from one evaluation to the next. It does not have to be a day, but a day is recommended, because the tasks in the catalogue are made to take a whole day. The organizer can still evaluate several times a day or once every few days, whatever you agree on.',
          'During a round you:',
          [
            'work on your task for the current round,',
            'reserve a task for the next round,',
            'bid on rewards in the auction.',
          ],
          'At the end of the round the organizer marks who completed their task. The app pays out the coins, hands out the tasks for the next round, settles the auction and starts a new round.',
        ],
      },
    },
    joinGroup: {
      summary:
        'You join a group with a code from the organizer. The app remembers it and takes you straight in next time.',
      detail: {
        title: 'Joining a group',
        blocks: [
          'On the Groups tab, tap your group and enter the code. You only do this once, next time the app takes you straight in. The icon on the left of the header leaves the group, and you can come back without the code.',
          'Tip: Install the app on your home screen before you join. On an iPhone the installed app keeps its own storage, separate from Safari. If you join in Safari and install afterwards, you have to enter the code and your character’s PIN again in the app.',
        ],
      },
    },
    newCharacter: {
      summary:
        'Create a character with a name and a four-digit PIN. You can play once the organizer approves it.',
      detail: {
        title: 'A new character',
        blocks: [
          'On the Players tab, tap +, enter a name and a PIN. Until the organizer approves the character, it waits greyed out under “Waiting for approval” and nobody can claim it. Once approved, it receives the starting coins.',
          'Remember your PIN. Without it you can’t reach your character from another device.',
        ],
      },
    },
    claimCharacter: {
      summary:
        'You claim your character with its PIN. One device holds one character, one character can be on several devices.',
      detail: {
        title: 'Your character',
        blocks: [
          'Tap your character in the Players list and claim it by entering its PIN. You need the PIN only once, so nobody picks someone else’s character by mistake. Your device then remembers that you are signed in as this character.',
          [
            'Claiming a different character on a device releases the previous one.',
            'You can have your character on several devices at once, say your phone and a tablet.',
            'To sign out, use “Sign out of this character” on its card.',
          ],
        ],
      },
    },
    taskCoins: {
      summary:
        'In every round you should have a task. A completed task earns coins, a failed one costs a penalty. So does a round without a task.',
      detail: {
        title: 'Coins for tasks',
        blocks: [
          'Every task has a difficulty (the dots on its card) and a reward based on it. The easiest task pays 100 coins, the hardest 200. The task card shows what it pays.',
          [
            'A failed task costs the failed-task penalty. It is the same for everyone, whether the task was easy or hard.',
            'A round without a task costs the no-task penalty.',
          ],
          'The organizer decides at the evaluation who completed their task. Coins are added and taken away only then.',
        ],
      },
    },
    taskTypes: {
      summary: 'Tasks are for one player, for pairs, or for groups.',
      detail: {
        title: 'Task types',
        blocks: [
          [
            'Solo: you do the task on your own.',
            'Pairs (the “Pair” chip): exactly two players. You invite your partner yourself.',
            'Groups (the “Group” chip with the number of players, for example “Group (3–4)”): everyone signs up on their own and the group is put together at the evaluation.',
          ],
          'Every member of a pair or group who completes the task gets its full reward. The organizer judges each member separately.',
        ],
      },
    },
    categories: {
      summary: 'You can only take a task from a category the organizer has opened for that round.',
      detail: {
        title: 'Open categories',
        blocks: [
          'Tasks have categories (the tags on the card). The organizer opens categories separately for the current round and for the next round. Task types work as categories too: opening “Pairs” opens every pair task. A task is open when at least one of its categories, or its type, is open.',
          'At the evaluation, the next round’s categories become the new round’s categories. The offer for the round after stays empty until the organizer opens it again.',
          'Tip: The “Current round only” and “Next round only” filters show what you can take right now.',
        ],
      },
    },
    onceOnly: {
      summary: 'You do each task at most once in the whole game, even one you failed.',
      detail: {
        title: 'Each task only once',
        blocks: [
          'You can’t reserve or take a task you have already done, whether you completed it or not. The app says “You have already had this task.” You also can’t reserve the task you hold right now. Other players can still do it.',
          'Nobody can invite you into a pair for a task you have already done. A task you switched away from during a round doesn’t count, because you never did it.',
        ],
      },
    },
    reserve: {
      summary:
        'You reserve your task for the next round. You can hold only one reservation, a new one replaces the old.',
      detail: {
        title: 'Reservations',
        blocks: [
          'Open a task and tap “Reserve for the next round”. Until the round is locked you can cancel your reservation or swap it for another. Your Profile shows your reservation. An accepted pair invite counts as your reservation too.',
          'A reservation doesn’t guarantee the task yet. That is decided at the evaluation.',
          'Reservations are secret. The others only see that you have one (“Has a reservation”) and, on the task, the number of interested players (“Wanted (2)”). A pair counts as one. Everyone sees who got the task once the round is evaluated.',
        ],
      },
    },
    poorerRule: {
      summary: 'When several players want the same task, the poorer one gets it.',
      detail: {
        title: 'The poorer-player rule',
        blocks: [
          'When several players reserve the same task for the next round, the one with fewer coins gets it. The game gives a hand to those who haven’t been so lucky yet.',
          'What counts is the balance after the ending round is settled, so it already includes the reward or penalty for the task in that round. Not the one you see during the round. Coins spent in the auction at the same evaluation don’t count, because the auction comes after the tasks are handed out.',
          'When two players want the task, the one with the lower balance wins.',
          {
            example:
              'Example: after settlement Bára has 380 coins and Cyril 220. Cyril gets the task.',
          },
          'A pair counts with the balance of its poorer member.',
          {
            example:
              'Example: Adam (300) and Bára (150) count as 150 as a pair. They beat Cyril (200) and Dana (250), who count as 200.',
          },
          'In group tasks, groups don’t compete with each other. Players compete for the seats in the group, and if more sign up than there are seats, the poorest get them.',
          'If both sides have the same balance, the earlier reservation wins. For a pair, what counts is when the initiator reserved it, not when the partner accepted. Cancelling a reservation and reserving again gives it a new time.',
          'If the time is the same too, a fixed order in the system decides, never chance, so the same situation always ends the same way. In practice this almost never happens.',
          'Whoever doesn’t get the task is left without one in the next round.',
        ],
      },
    },
    noTask: {
      summary:
        'If your reservation doesn’t work out, you are left without a task. Take a free task for the current round instead.',
      detail: {
        title: 'When it doesn’t work out',
        blocks: [
          'Whoever doesn’t get a task at the evaluation starts the new round with the “No task” chip. That happens when they lose to a poorer player, when their pair or group doesn’t come together, or when they reserved nothing.',
          'No replacement task is handed out automatically. Take a free task from the categories open for the current round. Whoever still has no task at the evaluation pays the no-task penalty.',
        ],
      },
    },
    takeNow: {
      summary:
        'You can take a free task straight away for the current round. First come, first served.',
      detail: {
        title: 'Take for the current round',
        blocks: [
          'Tap “Take for the current round” on a task. This works only for tasks from categories open for the current round that nobody has taken this round yet. Taken tasks show the “Taken” chip. If two of you tap at the same moment, only one gets it.',
          [
            'A solo task is yours at once.',
            'A pair starts with an invite, and you both get the task once your partner accepts. While the invite waits, the task is taken for everyone else. If the partner declines, it is free again.',
            'A group task can’t be taken for the current round, only reserved.',
          ],
          'A task taken for the current round is evaluated the same way as a reserved one.',
        ],
      },
    },
    switchTask: {
      summary:
        'You can swap your task in the current round for another free one, if the organizer allows it.',
      detail: {
        title: 'Swapping a task',
        blocks: [
          'Open another free task and tap “Switch to this”. Your original task becomes free for the others and doesn’t count as used.',
          'The organizer can turn swapping off. A player who already has a task then can’t swap it, and can’t start or accept a pair for the current round either. A player without a task can always take one.',
          'Careful: leaving a pair task takes it from your partner too.',
        ],
      },
    },
    pairInvite: {
      summary: 'You start a pair with an invite. It counts once your partner accepts.',
      detail: {
        title: 'Pair invites',
        blocks: [
          'On a pair task, choose a partner and tap “Reserve for the next round” or “Take for the current round”. Your partner sees an invite card at the top with “Accept” and “Decline”. The answer can’t be taken back. After accepting, the only way out is cancelling the pair for both.',
          [
            'You can only invite someone who hasn’t done that task yet.',
            'You can receive several invites but accept only one. Accepting another cancels the previous pair, for both of you.',
            'Accepting an invite cancels your own reservation.',
            'An invite for the next round that the partner hasn’t accepted by the evaluation expires. Neither of you gets the task.',
          ],
          'Under the poorer-player rule, a pair counts with the balance of its poorer member.',
        ],
      },
    },
    pairTogether: {
      summary: 'A pair is done together or not at all. Whoever backs out cancels it for both.',
      detail: {
        title: 'Together or not at all',
        blocks: [
          'A pair is cancelled for both of you when either of you:',
          [
            'taps “Cancel for both” or cancels the reservation,',
            'reserves a different task,',
            'accepts another pair,',
            'switches to a different task during the current round.',
          ],
          'The app always warns you before this happens. It doesn’t apply to group tasks: when one member leaves, the others keep the task.',
        ],
      },
    },
    groupTasks: {
      summary:
        'Everyone signs up for a group task on their own. The group forms at the evaluation if enough people come together.',
      detail: {
        title: 'Group tasks',
        blocks: [
          'A group task has a range of players, for example 3 to 4. You don’t invite anyone, everyone reserves the task on their own. The task card shows how many have signed up so far.',
          'At the evaluation:',
          [
            'with fewer players than the minimum, the group falls through and nobody gets the task,',
            'with a number within the range, everyone gets the task,',
            'with more players than the maximum, the poorest get the seats (on a tie, the earlier reservation) and the rest are left without a task.',
          ],
          {
            example:
              'Example: five players with 120, 90, 300, 90 and 200 coins reserve a task for 3 to 4 players. The players with 90, 90, 120 and 200 get it. The one with 300 is left without a task.',
          },
          'Your card then shows who is in your group.',
        ],
      },
    },
    blindAuction: {
      summary:
        'Rewards are auctioned blind. You bid at least the starting price and the highest bid wins.',
      detail: {
        title: 'Blind auction',
        blocks: [
          'The price on a reward card is the starting price, the lowest possible bid. You can bid more to improve your chances. Nobody sees who bid how much, a reward only shows the number of bidders.',
          'Until the round is locked you can change or withdraw your bid. Your Profile lists your bids.',
          'With equal bids, the earlier one wins. Changing a bid moves its time to the moment of the change.',
        ],
      },
    },
    paying: {
      summary:
        'You pay only at the evaluation, and only if you win. If you can’t afford your bid, the reward goes to the next bidder.',
      detail: {
        title: 'Paying',
        blocks: [
          'A bid doesn’t hold any coins. A losing bid costs you nothing. You may even bid more than you have right now, for example when you expect your task in this round to earn the difference. The winner pays their full bid.',
          'At the evaluation, though, what counts is your balance after the tasks are settled, minus any rewards you have already won at the same evaluation. If you can’t afford your bid, the reward goes to the next highest bid. If nobody can afford it, it stays unsold. Rewards are settled one after another in a fixed order.',
        ],
      },
    },
    rewardLimit: {
      summary:
        'You can bid on a limited number of rewards at a time, and you can’t win more than that in one round.',
      detail: {
        title: 'Reward limit',
        blocks: [
          'The organizer sets the limit, and by default it is 1 reward per round. Once you reach it, you can’t place another bid until you withdraw one.',
          'The limit applies to wins as well. If you would win more rewards than allowed, the extra ones go to the next highest bid. All forms count, rewards and punishments alike.',
        ],
      },
    },
    rewardWon: {
      summary: 'A reward you win applies in the next round. It happens outside the app.',
      detail: {
        title: 'A reward you won',
        blocks: [
          'Everyone sees who won what after the evaluation. The winner’s card shows “Has a reward”, and a player hit by a punishment gets the “Targeted” chip. It stays on the cards until the next evaluation and in the transaction history for good.',
          'The organizers arrange the reward or punishment itself. The app only records who won what.',
        ],
      },
    },
    rewardForms: {
      summary:
        'Rewards come in three forms: a reward for you, a punishment for someone, and a punishment for everyone.',
      detail: {
        title: 'Reward forms',
        blocks: [
          [
            'Reward: a perk for you.',
            'Punish someone: hits the players you pick.',
            'Punish everyone: hits everyone except you.',
          ],
          'All forms are auctioned the same way.',
        ],
      },
    },
    pickTargets: {
      summary:
        'For a punishment for someone, you pick the targets when you bid. You can’t pick yourself.',
      detail: {
        title: 'Picking targets',
        blocks: [
          'The reward says how many targets to pick, for example 1 to 2. You can change the targets together with your bid until the round is locked. The final targets are decided at the evaluation, so they may differ from your picks.',
        ],
      },
    },
    targetLimit: {
      summary:
        'A player can only be a target a limited number of times per round. A player who is fully booked shows as “already taken”.',
      detail: {
        title: 'Target limit',
        blocks: [
          'The organizer sets the limit, and by default each player can be the target of one punishment per round. It doesn’t apply to punishments for everyone.',
          'During the round: once as many bids aim at a player as the limit allows, new bids can’t pick them. They become free again as soon as one of those bids changes its target or is withdrawn. A bid that already has them keeps them.',
          'At the evaluation the targets are handed out again, starting with the highest winning bid:',
          [
            'the winner gets their picks, as long as those players haven’t reached the limit,',
            'picks that have reached the limit are dropped,',
            'if that leaves fewer targets than the minimum, the rest are filled from the players targeted the least. The fill order changes every round, so it doesn’t always land on the same people.',
          ],
        ],
      },
    },
    lockedRound: {
      summary:
        'Once the organizer locks the round, everything freezes. Tasks, reservations, invites and bids can’t be changed.',
      detail: {
        title: 'A locked round',
        blocks: [
          'The organizer locks the round when they start evaluating it, and it stays locked only until the evaluation is done. Meanwhile nobody can take or change tasks, reserve, cancel reservations, answer invites, bid or withdraw bids. The round stays exactly as the organizer evaluates it.',
        ],
      },
    },
    evaluationOrder: {
      summary:
        'The evaluation runs in a fixed order: tasks are settled, reservations are handed out, then the auction.',
      detail: {
        title: 'How the evaluation works',
        blocks: [
          {
            steps: [
              'Settlement: the organizer marks who completed their task. A completed task pays its reward, an unmarked one costs the failed-task penalty. Players without a task pay the no-task penalty.',
              'Reservations: tasks for the next round are handed out by the poorer-player rule, using the balances after settlement.',
              'Auction: each reward goes to the highest bid that can afford it, paid from the balance after settlement.',
              'New round: reservations become tasks and won rewards take effect.',
            ],
          },
          'Thanks to this order, spending in the auction never decides whether you get your reserved task.',
        ],
      },
    },
    newRound: {
      summary:
        'After the evaluation a new round starts. Reservations become tasks and won rewards take effect.',
      detail: {
        title: 'A new round',
        blocks: [
          [
            'Whoever won their reservation has a task for the new round, with their partners’ names for a pair or group.',
            'Whoever didn’t has “No task” and can take a free task.',
            'The next round’s categories become the new round’s categories. The organizer opens the offer for the round after again.',
            'Reservations and bids are cleared, you start the next round from scratch.',
            'Rewards and targets from the previous round disappear from the cards. They stay in the transaction history.',
          ],
        ],
      },
    },
    profile: {
      summary:
        'Your Profile shows your stats and transaction history. Only you and the organizers can see them.',
      detail: {
        title: 'Profile',
        blocks: [
          [
            'Your card: task, reservation, bids and rewards won.',
            'Stats: tasks completed, rewards won, coins earned and coins spent. Earned counts only coins from completed tasks, spent only coins paid for rewards won. Penalties and organizer adjustments are in the history.',
            'Transaction history: every task reward, penalty, reward won and organizer adjustment, with your balance after each change. The full history (“Show more”) starts with your opening balance.',
          ],
        ],
      },
    },
    adjustments: {
      summary:
        'The organizer can add or remove coins by hand. You always see the reason in your history.',
    },
    negativeBalance: {
      summary: 'Whether a balance can go below zero is up to the organizer.',
      detail: {
        title: 'Negative balance',
        blocks: [
          'When a negative balance isn’t allowed, penalties and adjustments stop at zero. When it is, you can go into debt, and under the poorer-player rule a debt counts as less than zero.',
        ],
      },
    },
    whoSeesWhat: {
      summary:
        'Everyone sees how many coins each player has, what task they have and what they won. What anyone reserves or bids on is secret.',
      detail: {
        title: 'Who sees what',
        blocks: [
          'Everyone sees:',
          [
            'every player’s coin balance,',
            'each player’s task for the current round (name, description, partners),',
            'whether a player has a reservation, but not for what,',
            'the number of interested players on tasks and rewards,',
            'which tasks are taken,',
            'rewards won and their targets.',
          ],
          'Only you and the organizers:',
          [
            'what you have reserved,',
            'what you bid on, how much, and whom you want to punish,',
            'your stats and transaction history.',
          ],
          'A pair invite is seen only by the two of you.',
        ],
      },
    },
    groupSettings: {
      summary: 'The penalties, limits and a few other details are up to the organizer.',
      detail: {
        title: 'Group settings',
        blocks: [
          'The organizer can set:',
          [
            'the starting coins a new character receives when approved,',
            'the failed-task penalty,',
            'the no-task penalty for a round without a task,',
            'how many rewards a player can bid on and win per round,',
            'how many times a player can be the target of a punishment per round,',
            'whether a balance can go below zero,',
            'whether a task can be swapped during the current round.',
          ],
        ],
      },
    },
  },
};

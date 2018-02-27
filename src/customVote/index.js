const { users, clearUserInfo } = require('../users');
const { startChoise } = require('../util');

let groups = [];
const allVotes = [
  {
    name: 'т',
    admin: 17849231322,
    questions: [
      {
        title: 'message.content;.text',
        votesCounter: [41234, 321414, 21341234],
      },
      {
        title: 'message.content.text',
        votesCounter: [41234, 321414, 21341234],
      },
    ],
  },
];

async function addVote(peer, anwserTitle, voteName) {
  const i = allVotes.findIndex(v => v.name === voteName);
  const qi = allVotes[i].questions.findIndex(q => q.title === anwserTitle);

  const voted = allVotes[i].questions.map(q => q.votesCounter.includes(peer)).includes(true);

  if (voted) {
    return false;
  }
  allVotes[i].questions[qi].votesCounter.push(peer);
  return true;
}

async function bindGroups(bot, callback) {
  const messenger = await bot.ready;
  messenger.bindDialogs((dialogs) => {
    const grps = dialogs
      .filter(dialog => dialog.info.peer.type === 'group')
      .map(dialog => dialog.info.peer.id);
    callback(grps);
  });
}

function checkName(name) {
  return allVotes.find(obj => obj.name === name);
}

function addGroupId(groupId, current) {
  allVotes[current].groupId = groupId;
}

function formatVote(current) {
  let allV = 0;
  allVotes[current].questions.map((q) => {
    allV += q.votesCounter.length;
  });

  const votes = allVotes[current].questions.map((q, index) => ({
    actions: [
      {
        id: index.toString(),
        widget: {
          type: 'button',
          label: `${index + 1}`,
          value: `vote#${allVotes[current].name}#${q.title}`,
        },
      },
    ],
  }));
  console.log(votes);
  const howManyVoted =
    allV === 1 ? `\nПроголосовал ${allV} человек.` : `\nПроголосовало ${allV} человек.`;
  const votesTitle =
    allVotes[current].questions
      .map((result, index) => {
        const percents = (allV === 0 ? 0 : result.votesCounter.length / allV * 100).toFixed(2);

        let emojiCounter = '👍'.repeat(Math.floor(percents / 20));
        if (!emojiCounter) {
          emojiCounter = '👍';
        }

        return `${index + 1} - ${result.title}\n ${
          result.votesCounter.length === 0 ? '◻' : emojiCounter
        } - ${percents}%\n`;
      })
      .join('\n') + howManyVoted;

  return { votes, votesTitle };
}

function deleteOldVote(id) {
  const i = allVotes.findIndex(v => v.admin === id);
  if (!i) {
    return false;
  }

  allVotes[i] = {};

  return true;
}

function showRes(bot, peer) {
  const current = allVotes.findIndex(v => v.admin === peer.id);
  const { votesTitle } = formatVote(current);
  const groupPeer = { type: 'group', id: allVotes[current].groupId };

  bot.sendTextMessage(groupPeer, `Голосование завершено\n${votesTitle}`);
  bot.sendTextMessage(peer, `Голосование завершено\n${votesTitle}`);

  deleteOldVote(peer.id);
  startChoise(bot, peer);
  clearUserInfo(peer);
  users[peer.id].createVote = 'init';
}

function deleteCanseledVoteIfExist(peer) {
  const v = allVotes.findIndex(vote => vote.admin === peer.id);
  if (v) {
    allVotes[v] = {};

    return true;
  }
  return false;
}

function startVote(bot, current, peer, groupId) {
  const { votes, votesTitle } = formatVote(current);
  users[peer.id].createVote = 'defined';

  bot.sendInteractiveMessage(peer, 'Вы можете в любой момент завершить опрос.', [
    {
      actions: [
        {
          id: '52893523',
          widget: {
            type: 'button',
            label: 'Завершить',
            value: 'endVote',
          },
        },
      ],
    },
  ]);

  bot.sendInteractiveMessage(
    { id: groupId, type: 'group' },
    `*${allVotes[current].name}*\n${votesTitle}`,
    votes,
  );
}

async function editVote(bot, peer, rid, groupId) {
  const current = allVotes.findIndex(v => v.groupId === groupId);
  const { votes, votesTitle } = formatVote(current);
  await bot.editInteractiveMessage(peer, rid, `*${allVotes[current].name}*\n${votesTitle}`, votes);
}

async function selectGroup(peer, bot) {
  try {
    await bindGroups(bot, (nextGroups) => {
      groups = nextGroups;
    });
  } catch (err) {
    console.log(err);
    bot.sendTextMessage(peer, 'Не получилось прогрузить группы :C');
  }

  const messenger = await bot.ready;

  await bot.sendInteractiveMessage(peer, 'Done!', [
    {
      description: 'В какой группе начать голосование?',
      actions: [
        {
          id: 'select_group',
          widget: {
            type: 'select',
            label: 'Группа...',
            options: groups
              .map(gid => messenger.getGroup(gid))
              .filter(group => group.type === 'group')
              .filter(group => group.canSendMessage !== false)
              .filter(group => peer.id === group.adminId)
              .map(group => ({
                label: group.name,
                value: String(group.id),
              })),
          },
        },
      ],
    },
  ]);
}

async function createVote(bot, peer, message) {
  const current = users[peer.id].currentWorkingVote;

  if (message === '') {
    selectGroup(peer, bot);
    return;
  }
  switch (users[peer.id].createVote) {
    case 'defined':
      bot.sendTextMessage(
        peer,
        'Вы уже запустили голосование.\n Завершите его прежде чем продолжить работу.',
      );
      break;
    case 'init':
      bot.sendTextMessage(
        peer,
        'Назовите ваше голосование. Например: "Где вам больше нравится отдыхать?"',
      );
      users[peer.id].createVote = 'addNameOfVote';
      break;

    case 'addNameOfVote':
      if (checkName(message.content.text)) {
        bot.sendTextMessage(peer, 'Голосование с таким именем уже существует. Попробуйте еще раз.');
      } else {
        users[peer.id].currentWorkingVote =
          allVotes.push({
            admin: peer.id,
            name: message.content.text,
            questions: [],
          }) - 1;
        bot.sendTextMessage(peer, 'Пришлите пункт голосования. Например: "Кипр"');
        users[peer.id].createVote = 'addQuestion';
      }
      break;

    case 'addQuestion':
      allVotes[current].questions.push({
        title: message.content.text,
        votesCounter: [],
      });
      bot.sendTextMessage(peer, 'Пришлите пункт голосования. Например: "Анталия"');
      bot.sendInteractiveMessage(peer, 'Если вы закончили добавлять ответы к данному вопросу.', [
        {
          actions: [
            {
              id: 'endS',
              widget: {
                type: 'button',
                label: 'Закончить.',
                value: `endV_${current}`,
              },
            },
          ],
        },
        {
          actions: [
            {
              id: 'endV',
              widget: {
                type: 'button',
                label: 'Отмена.',
                value: 'cancel',
              },
            },
          ],
        },
      ]);
      break;

    default:
      bot.sendTextMessage(peer, 'Что-то пошло не так.');
      break;
  }
}

module.exports = {
  createVote,
  addGroupId,
  startVote,
  addVote,
  editVote,
  showRes,
  deleteCanseledVoteIfExist,
};

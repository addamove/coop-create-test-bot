const { users, clearUserInfo } = require('../users');

const allSurveys = [
  {
    name: 'т',
    admin: 1784921322,
    questions: [
      {
        title: 'ЧТО, ПО-ТВОЕМУ, САМОЕ ВАЖНОЕ В ОТНОШЕНИЯХ?',
        anwsers: ['asdf', 'asdf', 'asdf'],
      },
      {
        title: 'ЧТО, ПО-ТВОЕМУ, САМОЕ ВАЖНОЕ В ОТНОШЕНИЯХ?',
        anwsers: ['asdf', 'asdf', 'asdf'],
      },
    ],
  },
];

async function askQuestion(peer, i, bot) {
  if (i === users[peer.id].currentTakingSurvey.questions.length) {
    // showResult(peer, bot);
    bot.sendTextMessage(peer, `Кол-во очков за тест = ${users[peer.id].si}`);
    // clearUserInfo(peer);
    // return;
  }
  const anwsers = users[peer.id].currentTakingSurvey.questions[i].anwsers.map((result, index) => ({
    actions: [
      {
        id: i,
        widget: {
          type: 'button',
          label: `${index + 1}`,
          value: `survey#${i}#${result}`,
        },
      },
    ],
  }));
  const anwsersTitle = users[peer.id].currentTakingSurvey.questions[i].anwsers
    .map((result, index) => `${index + 1} ${result}`)
    .join('\n');
  bot.sendInteractiveMessage(
    peer,
    `*${users[peer.id].currentTakingSurvey.questions[i].title}*\n${anwsersTitle}`,
    anwsers,
  );

  users[peer.id].si += 1;
}

async function createSurvey(bot, peer, message) {
  const current = users[peer.id].currentWorkingSurvey;
  console.log(`${JSON.stringify(allSurveys)}HUI ${current}`);

  if (message === '') {
    users[peer.id].createSurvey = 'addQuestion';
    bot.sendTextMessage(peer, 'Пришлите название вопроса.');
    return;
  }
  switch (users[peer.id].createSurvey) {
    case 'init':
      bot.sendTextMessage(peer, 'Назовите ваш опрос.');
      users[peer.id].createSurvey = 'addNameOfSurvey';
      break;

    case 'addNameOfSurvey':
      users[peer.id].currentWorkingSurvey =
        allSurveys.push({
          admin: peer,
          name: message.content.text,
          questions: [],
        }) - 1;
      bot.sendTextMessage(
        peer,
        'Пришлите пункт опроса. Например: "Где вам больше нравится отдыхать?"',
      );
      users[peer.id].createSurvey = 'addQuestion';
      break;

    case 'addQuestion':
      allSurveys[current].questions.push({
        title: message.content.text,
        anwsers: [],
      });
      bot.sendTextMessage(peer, 'Пришлите название ответа.');
      users[peer.id].createSurvey = 'addAnwserTitle';
      break;

    case 'addAnwserTitle': {
      const lastElementQuestions = allSurveys[current].questions.length - 1;
      allSurveys[current].questions[lastElementQuestions].anwsers.push(message.content.text);

      bot.sendInteractiveMessage(peer, 'Если вы закончили добавлять ответы к данному вопросу.', [
        {
          actions: [
            {
              id: 'nextS',
              widget: {
                type: 'button',
                label: 'Следующий вопрос.',
                value: 'nextS',
              },
            },
            {
              id: 'endS',
              widget: {
                type: 'button',
                label: 'Закончить.',
                value: `endS_${current}`,
              },
            },
          ],
        },
        {
          actions: [
            {
              id: 'endS',
              widget: {
                type: 'button',
                label: 'Отмена.',
                value: 'cancel',
              },
            },
          ],
        },
      ]);
      bot.sendTextMessage(peer, 'Пришлите название ответа.');
      users[peer.id].createSurvey = 'addAnwserTitle';

      break;
    }
    default:
      bot.sendTextMessage(peer, 'Что-то пошло не так.');
      break;
  }
}
function surveyEnds(bot, peer, current) {
  users[peer.id].createSurvey = 'init';

  bot.sendTextMessage(
    peer,
    `Ваш тест создан. Вы можете пройти его если напишите мне "@ctb опрос# ${
      allSurveys[current].name
    }"`,
  );
}

function startSurvey(bot, peer, name) {
  const survey = allSurveys.find(o => o.name.toLowerCase() === name.toLowerCase());
  if (typeof survey === 'undefined') {
    bot.sendTextMessage(
      peer,
      'К сожалению опрос не найден. Убедитесь что вы правильно написали его название. Название пишется без ковычек и дополнительных символов. Пример: @ctb опрос#Что покупаем на новый год',
    );
  } else {
    users[peer.id].currentTakingSurvey = survey;
    askQuestion(peer, users[peer.id].si, bot);
  }
}

module.exports = {
  createSurvey,
  surveyEnds,
  startSurvey,
  askQuestion,
};

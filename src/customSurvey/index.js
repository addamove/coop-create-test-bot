const { users, clearUserInfo, updateUserInDB } = require('../users');
const r = require('rethinkdbdash')({ db: 'ctb' });

let allSurveys = [
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

const showResult = (peer, bot) => {
  const name = [
    `*Название теста*: ${users[peer.id].currentTakingSurvey.name}
  Ответы пользователя: ${peer.id}`,
  ];
  const res = users[peer.id].surveyInput.map((anwser, index) => `Вопрос: ${users[peer.id].currentTakingSurvey.questions[index].title}
  Ответ пользователя: ${anwser}`);
  const results = name.concat(res);
  console.log(results);
  bot.sendTextMessage(
    {
      id: users[peer.id].currentTakingSurvey.admin,
      type: 'user',
    },
    results.join('\n'),
  );
};

function mySurveys(peer) {
  const reply = ['Ваши опросы.\n'];
  reply.push(...users[peer.id].createdSurveys.map((name, i) => `${i + 1}: @createtb опрос#${name}`));
  return reply.join('\n');
}

function checkName(name) {
  return allSurveys.find(obj => obj.name === name);
}

async function getSurveys() {
  allSurveys = await r.table('surveys').run();
}

async function askQuestion(peer, i, bot) {
  if (i === users[peer.id].currentTakingSurvey.questions.length) {
    showResult(peer, bot);
    bot.sendTextMessage(peer, 'Спасибо за прохождение опроса!');
    clearUserInfo(peer);
    bot.sendInteractiveMessage(peer, '', [
      {
        actions: [
          {
            id: '3456',
            widget: {
              type: 'button',
              label: 'Сделать тест',
              value: 'сделать тест',
            },
          },
          {
            id: '56',
            widget: {
              type: 'button',
              label: 'Сделать опрос',
              value: 'сделать опрос',
            },
          },
        ],
      },
    ]);

    console.log(JSON.stringify(users[peer.id].currentTakingSurvey));
    // clearUserInfo(peer);
    return;
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

async function addSurveyToDB(survey, bot, peer) {
  const query = await r.table('surveys').filter({
    name: survey.name,
  });
  if (typeof query[0] === 'undefined') {
    try {
      await r
        .table('surveys')
        .insert(survey)
        .run();
    } catch (err) {
      bot.sendTextMessage(peer, 'Что-то пошло не так. Ваш опрос не добавлен в нашу базу данных.');
      console.log(err);
    }
  } else {
    bot.sendTextMessage(peer, 'Ваш опрос уже был добавлен в базу данных.');
  }
}

async function createSurvey(bot, peer, message) {
  const current = users[peer.id].currentWorkingSurvey;

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
      if (checkName(message.content.text)) {
        bot.sendTextMessage(peer, 'Опрос с таким именем уже существует. Попробуйте еще раз.');
      } else {
        users[peer.id].currentWorkingSurvey =
          allSurveys.push({
            admin: peer.id,
            name: message.content.text,
            questions: [],
          }) - 1;
        bot.sendTextMessage(
          peer,
          'Пришлите пункт опроса. Например: "Где вам больше нравится отдыхать?"',
        );
        users[peer.id].createSurvey = 'addQuestion';
      }
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
                label: 'Следующий вопрос',
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

  addSurveyToDB(allSurveys[current], bot, peer);
  users[peer.id].createdSurveys.push(allSurveys[current].name);
  updateUserInDB(peer);

  bot.sendTextMessage(
    peer,
    `Ваш опрос создан. Вы можете пройти его если напишите мне "@createtb опрос#${
      allSurveys[current].name
    }"`,
  );
}

function startSurvey(bot, peer, name) {
  const survey = allSurveys.find(o => o.name.toLowerCase() === name.toLowerCase());
  if (typeof survey === 'undefined') {
    bot.sendTextMessage(
      peer,
      'К сожалению опрос не найден. Убедитесь что вы правильно написали его название. Название пишется без ковычек и дополнительных символов. Пример: @createtb опрос#Что покупаем на новый год',
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
  getSurveys,
  mySurveys,
};

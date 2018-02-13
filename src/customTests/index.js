const { users } = require('../users');

const allTests = [
  {
    name: 'т',
    questions: [
      {
        title: 'ЧТО, ПО-ТВОЕМУ, САМОЕ ВАЖНОЕ В ОТНОШЕНИЯХ?',
        anwsers: [
          {
            title: 'Притяжение.',
            score: 1,
          },
        ],
      },
    ],
  },
];

// function askFullQuestion(peer, i) {
//   if (i >= config.questions.length) {
//     bot.sendTextMessage(peer, 'Тест закончен');
//   } else {
//     const anwsers = config.questions[i].anwsers.map(result => ({
//       actions: [
//         {
//           id: i,
//           widget: {
//             type: 'button',
//             label: result.title,
//             value: `question#${i}#${result.score}`,
//           },
//         },
//       ],
//     }));
//     bot.sendInteractiveMessage(peer, config.questions[i].question, anwsers);
//   }
// }
async function askQuestion(peer, i, bot) {
  const anwsers = users[peer.id].currentTakingTest.questions[i].anwsers.map((result, index) => ({
    actions: [
      {
        id: i,
        widget: {
          type: 'button',
          label: `${index + 1}`,
          value: `question#${i}#${result.score}`,
        },
      },
    ],
  }));
  const anwsersTitle = allTests.questions[i].anwsers
    .map((result, index) => `${index + 1} ${result.title}`)
    .join('\n');
  bot.sendInteractiveMessage(
    peer,
    `*${users[peer.id].currentTakingTest.questions[i].title}*\n${anwsersTitle}`,
    anwsers,
  );

  users[peer.id].i += 1;
}

async function createTest(bot, peer, message) {
  const current = users[peer.id].currentWorkingTest;
  console.log(JSON.stringify(allTests) + 'HUI ' + current);

  if (message === '') {
    users[peer.id].createTest = 'addQuestion';
    bot.sendTextMessage(peer, 'Пришлите название вопроса.');
    return;
  }
  switch (users[peer.id].createTest) {
    case 'init':
      bot.sendTextMessage(peer, 'Назовите ваш тест.');
      users[peer.id].createTest = 'addNameOfTest';
      break;

    case 'addNameOfTest':
      users[peer.id].currentWorkingTest =
        allTests.push({
          name: message.content.text,
          questions: [],
        }) - 1;
      bot.sendTextMessage(peer, 'Пришлите название вопроса.');
      users[peer.id].createTest = 'addQuestion';
      break;

    case 'addQuestion':
      allTests[current].questions.push({
        title: message.content.text,
        anwsers: [],
      });
      bot.sendTextMessage(peer, 'Пришлите название ответа.');
      users[peer.id].createTest = 'addAnwserTitle';
      break;

    case 'addAnwserTitle': {
      const lastElementQuestions = allTests[current].questions.length - 1;
      allTests[current].questions[lastElementQuestions].anwsers.push({
        title: message.content.text,
        score: 0,
      });
      bot.sendTextMessage(peer, 'Пришлите кол-во очков за ответ.');
      users[peer.id].createTest = 'addAnwserScore';

      break;
    }
    case 'addAnwserScore': {
      const lastElementQuestions = allTests[current].questions.length - 1;
      const lastElementAnwsers =
        allTests[current].questions[lastElementQuestions].anwsers.length - 1;
      allTests[current].questions[lastElementQuestions].anwsers[lastElementAnwsers].score =
        message.content.text;
      bot.sendInteractiveMessage(peer, 'Если вы закончили добавлять ответы к данному вопросу.', [
        {
          actions: [
            {
              id: 'nextQ',
              widget: {
                type: 'button',
                label: 'Следующий вопрос.',
                value: 'nextQ',
              },
            },
            {
              id: 'allQ',
              widget: {
                type: 'button',
                label: 'Список ответов.',
                value: 'allQ',
              },
            },
          ],
        },
        {
          actions: [
            {
              id: 'end',
              widget: {
                type: 'button',
                label: 'Закончить тест.',
                value: `endTest_${current}`,
              },
            },
          ],
        },
      ]);
      bot.sendTextMessage(peer, 'Пришлите название ответа.');

      users[peer.id].createTest = 'addAnwserTitle';
      break;
    }

    default:
      bot.sendTextMessage(peer, 'Что-то пошло не так.');
      break;
  }
}

function testEnds(bot, peer, current) {
  users[peer.id].createTest = 'init';

  bot.sendTextMessage(
    peer,
    `Ваш тест создан. Вы можете пройти его если напишите мне @ctb ${allTests[current].name}`,
  );
}

function startTest(bot, peer, name) {
  const test = allTests.find(o => o.name.toLocaleLowerCase() === name.toLocaleLowerCase());
  if (test === undefined) {
    bot.sendTextMessage(
      peer,
      'К сожалению тест не найден. Убедитесь что вы правильно написали его название. Название пишется без ковычек и дополнительных символов. Пример: @ctb Тест Гоулмана',
    );
  } else {
    users[peer.id].currentTakingTest = test;
    askQuestion(peer, i);
  }
}

module.exports = {
  createTest,
  testEnds,
  startTest,
};

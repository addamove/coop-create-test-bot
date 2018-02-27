/* TODO
- сделать загрузку тестов из дб
*/
const { users, clearUserInfo, updateUserInDB } = require('../users');
const { startChoise } = require('../util');
const r = require('rethinkdbdash')({ db: 'ctb' });

let allTests = [
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
          {
            title: 'Притяжasdfasdffadsение.',
            score: 1,
          },
          {
            title: 'Притяжasdfение.',
            score: 1,
          },
          {
            title: 'Притяжasdfение.',
            score: 1,
          },
        ],
      },
      {
        title: 'ЧТО, ПО-ТВОЕМУ, САМОЕ ВАЖНОЕ В ОТНОШЕНИЯХ?',
        anwsers: [
          {
            title: 'Притяжение.',
            score: 1,
          },
          {
            title: 'Притяжasdfasdffadsение.',
            score: 1,
          },
          {
            title: 'Притяжasdfение.',
            score: 1,
          },
          {
            title: 'Притяжasdfение.',
            score: 1,
          },
        ],
      },
    ],
    results: {
      '0-10': 'блабла',
      '11-18': 'блабла2',
    },
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
function checkName(name) {
  return allTests.find(obj => obj.name === name);
}

function myTests(peer) {
  const reply = ['Ваши тесты.\n'];
  reply.push(...users[peer.id].createdTests.map((name, i) => `${i + 1}: @createtb ${name}`));
  return reply.join('\n');
}

async function addTestToDB(test, bot, peer) {
  const query = await r.table('tests').filter({
    name: test.name,
  });
  if (typeof query[0] === 'undefined') {
    try {
      await r
        .table('tests')
        .insert(test)
        .run();
    } catch (err) {
      bot.sendTextMessage(peer, 'Что-то пошло не так. Ваш тест не добавлен в нашу базу данных.');
      console.log(err);
    }
  } else {
    bot.sendTextMessage(peer, 'Ваш тест уже был добавлен в базу данных.');
  }
}

async function getTests() {
  allTests = await r.table('tests').run();
}

const showResult = (peer, bot) => {
  let succeed = false;
  function between(x, min, max) {
    return x >= min && x <= max;
  }

  Object.keys(users[peer.id].currentTakingTest.results).map((range) => {
    if (between(+users[peer.id].score, +range.split('-')[0], +range.split('-')[1])) {
      bot.sendTextMessage(peer, users[peer.id].currentTakingTest.results[range]);
      succeed = true;
    }
  });
  if (!succeed) {
    bot.sendTextMessage(peer, 'Что-то пошло не так.');
  }
};

async function askQuestion(peer, i, bot) {
  if (i === users[peer.id].currentTakingTest.questions.length) {
    showResult(peer, bot);
    bot.sendTextMessage(peer, `Кол-во очков за тест = ${users[peer.id].score}`);

    startChoise(bot, peer);

    clearUserInfo(peer);
    return;
  }
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
  const anwsersTitle = users[peer.id].currentTakingTest.questions[i].anwsers
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
      if (checkName(message.content.text)) {
        bot.sendTextMessage(peer, 'Тест с таким именем уже существует. Попробуйте еще раз.');
      } else {
        users[peer.id].currentWorkingTest =
          allTests.push({
            name: message.content.text,
            questions: [],
          }) - 1;
        bot.sendTextMessage(peer, 'Пришлите название вопроса.');
        users[peer.id].createTest = 'addQuestion';
      }
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

      if (!message.content.text.match(/^\d+$/)) {
        bot.sendTextMessage(peer, 'Пришлите кол-во очков за ответ *ОДНОЙ ЦИФРОЙ*.');
        return;
      }
      allTests[current].questions[lastElementQuestions].anwsers[lastElementAnwsers].score =
        message.content.text;

      bot.sendInteractiveMessage(peer, 'Если вы закончили добавлять ответы к данному вопросу.', [
        {
          actions: [
            {
              id: 'nextQ',
              widget: {
                type: 'button',
                label: 'Следующий вопрос',
                value: 'nextQ',
              },
            },
            {
              id: 'allQ',
              widget: {
                type: 'button',
                label: 'Закончить',
                value: 'addRes',
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
                label: 'Отмена',
                value: 'cancel',
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
function addResults(bot, peer, message) {
  const current = users[peer.id].currentWorkingTest;

  switch (users[peer.id].addResults) {
    case 'init': {
      let scores = 0;
      allTests[current].questions.map((question) => {
        const anwserScore = question.anwsers.map(anwser => anwser.score);
        scores += Math.max(...anwserScore);
      });

      bot.sendTextMessage(
        peer,
        `Пришлите результаты в форме "минимум-максимум@РЕЗУЛЬТАТ".
         Например: 1-10@Ты спокойный. *или* 11-15@Ты грубый.
          Числа не должны пересекаться. Максимальное кол-во очков в тесте = ${scores}`,
      );
      allTests[current].results = {};
      users[peer.id].addResults = 'addResults';
      break;
    }

    case 'addResults': {
      const range = message.content.text.split('@')[0];
      if (!range.match(/\d+-\d+/) || +range.split('-')[0] > +range.split('-')[1]) {
        bot.sendTextMessage(
          peer,
          'Похоже вы не правильно оформили свой ответ, попробуйте ещё раз. ',
        );
        bot.sendTextMessage(peer, 'Например: 1-10@Ты спокойный.');
        return;
      }
      allTests[current].results[range] = message.content.text.split('@')[1];
      // .users[peer.id].addResults;
      bot.sendInteractiveMessage(
        peer,
        'Если вы закончили добавлять результаты ответов к данному тесту.',
        [
          {
            actions: [
              {
                id: 'end',
                widget: {
                  type: 'button',
                  label: 'Закончить тест',
                  value: `endTest_${current}`,
                },
              },
            ],
          },
        ],
      );
      bot.sendTextMessage(
        peer,
        'Пришлите результаты в форме "минимум-максимум@РЕЗУЛЬТАТ". Например: 1-10@ты спокойный. Помните - диапазоны не должны пересекаться. ',
      );
      break;
    }
    default:
      break;
  }
}

function testEnds(bot, peer, current) {
  users[peer.id].createTest = 'init';
  users[peer.id].addResults = 'init';

  addTestToDB(allTests[current], bot, peer);
  users[peer.id].createdTests.push(allTests[current].name);
  updateUserInDB(peer);

  bot.sendTextMessage(
    peer,
    `Ваш тест создан. Вы можете пройти его если напишите мне @createtb ${allTests[current].name}`,
  );
}

function startTest(bot, peer, name) {
  const test = allTests.find(o => o.name.toLowerCase() === name.toLowerCase());
  if (typeof test === 'undefined') {
    bot.sendTextMessage(
      peer,
      'К сожалению тест не найден. Убедитесь что вы правильно написали его название. Название пишется без ковычек и дополнительных символов. Пример: @createtb Тест Гоулмана',
    );
  } else {
    users[peer.id].currentTakingTest = test;
    askQuestion(peer, users[peer.id].i, bot);
  }
}

module.exports = {
  createTest,
  testEnds,
  startTest,
  askQuestion,
  addResults,
  getTests,
  myTests,
};

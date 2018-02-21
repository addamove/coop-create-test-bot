/*
TODO

*/

const { Bot } = require('@dlghq/dialog-bot-sdk');
const utilities = require('./util');
const tests = require('./customTests');
const surveys = require('./customSurvey');
const users = require('./users');

const bot = new Bot({
  endpoints: ['wss://ws1.coopintl.com'],
  username: 'testbot',
  password: '666',
});

tests.getTests();
surveys.getSurveys();

bot.onMessage(async (peer, message) => {
  try {
    await users.defineNewUser(peer);
  } catch (err) {
    bot.sendTextMessage(peer, 'Ошибка определения юзера!');
  }
  // bot.sendTextMessage(peer, JSON.stringify(users.users[peer.id]));

  if (message.content.text.split(' ')[0] === '@createtb') {
    users.clearUserInfo(peer);
    const original = message.content.text;

    if (message.content.text.split('#')[0].search('опрос') !== -1) {
      const surveyName = message.content.text.split('#')[1];
      surveys.startSurvey(bot, peer, surveyName);
    } else {
      const testName = original.substr(original.indexOf(' ') + 1);
      tests.startTest(bot, peer, testName);
    }
  } else if (peer.type !== 'group' && users.users[peer.id].start) {
    bot.sendTextMessage(peer, 'Чтобы пройти тест напишите мне "@createtb <имя теста>"');

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
    users.users[peer.id].start = false;
  } else if (
    utilities.checkSpell(message.content.text, 'сделать тест') ||
    users.users[peer.id].createTest !== 'init'
  ) {
    tests.createTest(bot, peer, message);
  } else if (
    utilities.checkSpell(message.content.text, 'сделать опрос') ||
    users.users[peer.id].createSurvey !== 'init'
  ) {
    surveys.createSurvey(bot, peer, message);
  } else if (users.users[peer.id].addResults !== 'init') {
    tests.addResults(bot, peer, message);
  } else if (utilities.checkSpell(message.content.text, 'мои тесты')) {
    bot.sendTextMessage(peer, tests.myTests(peer));
  } else if (utilities.checkSpell(message.content.text, 'мои опросы')) {
    bot.sendTextMessage(peer, surveys.mySurveys(peer));
  } else if (utilities.checkSpell(message.content.text.split(' ')[0], '#удалить')) {
    const name = message.content.text.substr(message.content.text.indexOf(' ') + 1);
    surveys.deleteSurvey(peer, name, bot);
  } else {
    bot.sendTextMessage(peer, 'Я вас не понял :C');
    bot.sendTextMessage(peer, 'Может вы хотите создать тест?');
    bot.sendTextMessage(peer, 'Тогда напишите мне "создать тест" без ковычек.');
    bot.sendTextMessage(
      peer,
      'Если хотите увидеть ваши созданные тесты/опросы напишите "мои тесты" или "мои опросы".',
    );
  }
});

bot.onInteractiveEvent(async (event) => {
  if (event.value === 'cancel') {
    users.clearUserInfo(event.peer);
    bot.sendTextMessage(event.peer, 'Отменено.');
    bot.sendInteractiveMessage(event.peer, '', [
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
  }

  //  опросы
  if (
    event.value === 'сделать опрос' &&
    users.users[event.peer.id].createSurvey === 'init' &&
    users.users[event.peer.id].createTest === 'init'
  ) {
    surveys.createSurvey(bot, event.peer, 'start');
  }
  if (event.value.split('#')[0] === 'survey') {
    users.users[event.peer.id].surveyInput.push(event.value.split('#')[2]);
    surveys.askQuestion(event.peer, users.users[event.peer.id].si, bot);
  }
  if (event.value === 'nextS' || event.value === 'allS') {
    surveys.createSurvey(bot, event.peer, '');
  }
  if (event.value.split('_')[0] === 'endS') {
    surveys.surveyEnds(bot, event.peer, event.value.split('_')[1]);
  }

  // tests
  if (
    event.value === 'сделать тест' &&
    users.users[event.peer.id].createSurvey === 'init' &&
    users.users[event.peer.id].createTest === 'init'
  ) {
    tests.createTest(bot, event.peer, 'start');
  }
  if (event.value.split('#')[0] === 'question') {
    users.users[event.peer.id].score += +event.value.split('#')[2];
    tests.askQuestion(event.peer, users.users[event.peer.id].i, bot);
  }
  if (event.value === 'nextQ') {
    tests.createTest(bot, event.peer, '');
  }

  if (event.value === 'addRes') {
    tests.addResults(bot, event.peer, '');
    users.users[event.peer.id].createTest = 'init';
  }
  if (event.value.split('_')[0] === 'endTest') {
    tests.testEnds(bot, event.peer, event.value.split('_')[1]);
  }
});

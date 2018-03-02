/*
TODO

*/

const { Bot } = require('@dlghq/dialog-bot-sdk');
const utilities = require('./util');
const tests = require('./customTests');
const surveys = require('./customSurvey');
const vote = require('./customVote');
const users = require('./users');

// const bot = new Bot({
//   endpoints: ['wss://ws1.coopintl.com'],
//   username: 'createtb',
//   password: '666',
// });
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

  if (message.content.text.split(' ')[0] === 'начать') {
    users.clearUserInfo(peer);
    const original = message.content.text;

    if (message.content.text.split('#')[0].search('опрос') !== -1) {
      const surveyName = message.content.text.split('#')[1];
      surveys.startSurvey(bot, peer, surveyName);
    } else if (message.content.text.split('#')[0].search('тест') !== -1) {
      const testName = message.content.text.split('#')[1];
      tests.startTest(bot, peer, testName);
    }
  } else if (peer.type !== 'group' && users.users[peer.id].start) {
    bot.sendTextMessage(peer, 'Чтобы пройти тест напишите мне "@createtb <имя теста>"');
    utilities.startChoise(bot, peer);

    users.users[peer.id].start = false;
  } else if (
    utilities.checkSpell(message.content.text, 'сделать тест') ||
    users.users[peer.id].createTest !== 'init'
  ) {
    tests.createTest(bot, peer, message);
  } else if (
    utilities.checkSpell(message.content.text, 'сделать голосование') ||
    users.users[peer.id].createVote !== 'init'
  ) {
    vote.createVote(bot, peer, message);
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
  } else if (peer.type !== 'group') {
    bot.sendTextMessage(peer, 'Я вас не понял :C');
    bot.sendTextMessage(peer, 'Может вы хотите создать тест?');
    utilities.startChoise(bot, peer);
    bot.sendTextMessage(
      peer,
      'Если хотите увидеть ваши созданные тесты/опросы напишите "мои тесты" или "мои опросы".',
    );
  }
});

bot.onInteractiveEvent(async (event) => {
  if (event.value === 'cancel') {
    vote.deleteCanseledVoteIfExist(event.ref.peer);
    users.clearUserInfo(event.ref.peer);
    bot.sendTextMessage(event.ref.peer, 'Отменено.');
    utilities.startChoise(bot, event.ref.peer);
  }

  //  surveys
  if (
    event.value === 'сделать опрос' &&
    users.users[event.ref.peer.id].createSurvey === 'init' &&
    users.users[event.ref.peer.id].createTest === 'init'
  ) {
    surveys.createSurvey(bot, event.ref.peer, 'start');
  }
  if (event.value.split('#')[0] === 'survey') {
    users.users[event.ref.peer.id].surveyInput.push(event.value.split('#')[2]);
    surveys.askQuestion(event.ref.peer, users.users[event.ref.peer.id].si, bot);
  }
  if (event.value === 'nextS' || event.value === 'allS') {
    surveys.createSurvey(bot, event.ref.peer, '');
  }
  if (event.value.split('_')[0] === 'endS') {
    surveys.surveyEnds(bot, event.ref.peer, event.value.split('_')[1]);
  }

  // tests
  if (
    event.value === 'сделать тест' &&
    users.users[event.ref.peer.id].createSurvey === 'init' &&
    users.users[event.ref.peer.id].createTest === 'init'
  ) {
    tests.createTest(bot, event.ref.peer, 'start');
  }
  if (event.value.split('#')[0] === 'question') {
    users.users[event.ref.peer.id].score += +event.value.split('#')[2];
    tests.askQuestion(event.ref.peer, users.users[event.ref.peer.id].i, bot);
  }
  if (event.value === 'nextQ') {
    tests.createTest(bot, event.ref.peer, '');
  }

  if (event.value === 'addRes') {
    tests.addResults(bot, event.ref.peer, '');
    users.users[event.ref.peer.id].createTest = 'init';
  }
  if (event.value.split('_')[0] === 'endTest') {
    tests.testEnds(bot, event.ref.peer, event.value.split('_')[1]);
  }

  // votes
  if (event.value === 'сделать голосование') {
    vote.createVote(bot, event.ref.peer, 'start');
  }
  if (event.value.split('_')[0] === 'endV') {
    vote.createVote(bot, event.ref.peer, '');
  }
  if (event.id === 'select_group') {
    vote.addGroupId(+event.value, users.users[event.ref.peer.id].currentWorkingVote);
    vote.startVote(
      bot,
      users.users[event.ref.peer.id].currentWorkingVote,
      event.ref.peer,
      +event.value,
    );
  }
  if (event.value.split('#')[0] === 'vote') {
    vote.addVote(event.uid, event.value.split('#')[2], event.value.split('#')[1]);
    vote.editVote(bot, event.ref.peer, event.ref.rid, event.ref.peer.id);
  }
  if (event.value === 'endVote') {
    vote.showRes(bot, event.ref.peer);
  }
});

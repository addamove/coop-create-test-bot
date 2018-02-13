/*
TODO

*/

const { Bot } = require('@dlghq/dialog-bot-sdk');
const path = require('path');
const config = require('./config');
const utilities = require('./util');
const tests = require('./customTests');
const users = require('./users');

const bot = new Bot({
  endpoints: ['wss://ws1.coopintl.com'],
  username: 'testbot',
  password: '666',
});

bot.onMessage(async (peer, message) => {
  users.defineNewUser(peer);
  bot.sendTextMessage(peer, JSON.stringify(users.users[peer.id]));

  if (message.content.text.split(' ')[0] === '@ctb') {
    const original = message.content.text;
    const testName = original.substr(original.indexOf(' ') + 1);

    tests.startTest(bot, peer, testName);
  }

  if (peer.type !== 'group' && users.users[peer.id].start) {
    bot.sendTextMessage(
      peer,
      'Для того чтобы составить свой тест напишите "сделать тест". Чтобы пройти тест напишите мне "@ctb <имя теста>"',
    );
    users.users[peer.id].start = false;
  }
  if (
    utilities.checkSpell(message.content.text, 'сделать тест') ||
    users.users[peer.id].createTest !== 'init'
  ) {
    tests.createTest(bot, peer, message);
  }
  if (users.users[peer.id].addResults !== 'init') {
    tests.addResults(bot, peer, message);
  }
});

bot.onInteractiveEvent(async (event) => {
  if (event.value.split('#')[0] === 'question') {
    users.users[event.peer.id].score += +event.value.split('#')[2];
    tests.askQuestion(event.peer, users.users[event.peer.id].i, bot);
  }

  if (event.value === 'nextQ' || event.value === 'allQ') {
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

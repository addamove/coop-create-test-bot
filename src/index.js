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
  tests.startTest(bot, peer, 'т');
  // bot.sendTextMessage(peer, JSON.stringify(users.users));

  // if (peer.type !== 'group' && users.users[peer.id].start) {
  //   bot.sendTextMessage(
  //     peer,
  //     'Для того чтобы составить свой тест напишите "сделать тест". Чтобы пройти тест напишите мне "@testbot начать <имя теста>"',
  //   );
  //   users.users[peer.id].start = false;
  // }
  // if (
  //   utilities.checkSpell(message.content.text, 'сделать тест') ||
  //   users.users[peer.id].createTest !== 'init'
  // ) {
  //   tests.createTest(bot, peer, message, users.users[peer.id]);
  // }
});

bot.onInteractiveEvent(async (event) => {
  if (event.value.split('#')[0] === 'question') {
    users[event.peer.id].i += 1;
    users[event.peer.id].score += +event.value.split('#')[2];
    tests.askQuestion(event.peer, users[event.peer.id].i);
  }

  if (event.value === 'nextQ' || event.value === 'allQ') {
    tests.createTest(bot, event.peer, '');
  }
  if (event.value.split('_')[0] === 'endTest') {
    tests.testEnds(bot, event.peer, event.value.split('_')[1]);
  }
});

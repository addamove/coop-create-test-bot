/*
TODO

*/

const { Bot } = require('@dlghq/dialog-bot-sdk');
const path = require('path');
const config = require('./config');
const utilities = require('./util');
const createTest = require('./createTest');
const users = require('./users');

const bot = new Bot({
  endpoints: ['wss://ws1.coopintl.com'],
  username: 'testbot',
  password: '666',
});

// const sendImages = (peer) => {
//   return new Promise((resolve, reject) => {
//     bot.sendImageMessage(peer, path.join(__dirname, './img/1.jpg'));
//     bot.sendImageMessage(peer, path.join(__dirname, './img/2.jpg'));
//     bot.sendImageMessage(peer, path.join(__dirname, './img/3.jpg'));
//   })

// };
// function askQuestion(peer, i) {
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
async function askQuestion(peer, i) {
  const anwsers = config.questions[i].anwsers.map((result, index) => ({
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
  const anwsersTitle = config.questions[i].anwsers
    .map((result, index) => `${index + 1} ${result.title}`)
    .join('\n');
  bot.sendInteractiveMessage(peer, `*${config.questions[i].question}*\n${anwsersTitle}`, anwsers);
}

bot.onMessage(async (peer, message) => {
  users.defineNewUser(peer);

  bot.sendTextMessage(peer, JSON.stringify(users.users));

  if (peer.type !== 'group' && users[peer.id].start) {
    bot.sendTextMessage(
      peer,
      'Для того чтобы составить свой тест напишите "сделать тест". Чтобы пройти тест напишете мне "@testbot начать <имя теста>"',
    );
  }
  if (utilities.checkSpell(message.content.text, 'сделать тест')) {
    createTest(bot, peer, message);
  }
});

bot.onInteractiveEvent(async (event) => {
  if (event.value.split('#')[0] === 'question') {
    users[event.peer.id].i += 1;
    users[event.peer.id].score += +event.value.split('#')[2];
    askQuestion(event.peer, users[event.peer.id].i);
  }
});

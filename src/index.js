/*
TODO

*/

const { Bot } = require('@dlghq/dialog-bot-sdk');
const path = require('path');
const config = require('./config');
const utilities = require('./util');
const createTest = require('./createTest');

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
// ответы в зависимости от набранных очков
// const score = (scr) => {
//   switch (true) {
//     case scr <= 9:
//       return 'IQ123\nЭто было очень даже неплохо для первого раза, твой IQ любви уже сейчас очень высок! Если ты будешь продолжать в таком же темпе, ты сможешь стать всемирно известным/-ой „гуру любви“!';
//     case scr <= 11 && scr > 9:
//       return 'IQ145\nТвой IQ любви выше нормы! Ты знаешь несколько хитростей, которые обычно известны только небольшому числу людей. Продолжай в том же духе и ты станешь магистром любви!';
//     case scr <= 13 && scr > 11:
//       return 'IQ168\nТвои знания о любви впечатляют, видимо ты эксперт по отношениям! Ты являешься партнёром , о котором можно только мечтать!';
//     case scr <= 15 && scr > 13:
//       return 'IQ195 Ты мог/-ла бы давать советы для влюблённых, ведь ты явно эксперт! Твой высокий IQ любви свидетельствует о том, что ты главный приз для любого/-ой партнёра/-ши!';
//     case scr >= 18 && scr > 15:
//       return 'IQ210\nТвой результат действительно сногсшибательный! Ты точно разбираешься в любви – от тебя даже эксперты смогут чему-то научиться!';
//     default:
//       return 'Что-то пошло не так';
//   }
// };

const users = {};

bot.onMessage(async (peer, message) => {
  createTest(bot, peer);

  // bot.sendTextMessage(peer, JSON.stringify(users));
  // if (typeof users[peer.id] === 'undefined') {
  //   users[peer.id] = {
  //     start: true,
  //     score: 0,
  //     i: 0,
  //   };
  // }
  // if (peer.type !== 'group' && users[peer.id].start) {
  //   bot.sendTextMessage(
  //     peer,
  //     'Для того чтобы составить свой тест напишите "сделать тест". Чтобы пройти тест напишете мне "@testbot начать"',
  //   );
  // }
  if (utilities.checkSpell(message.content.text, 'сделать тест')) {
    createTest(bot, peer);
  }
});

bot.onInteractiveEvent(async (event) => {
  if (event.value.split('#')[0] === 'question') {
    users[event.peer.id].i += 1;
    users[event.peer.id].score += +event.value.split('#')[2];
    askQuestion(event.peer, users[event.peer.id].i);
  }
  if (
    event.value.split('#')[0] === 'question' &&
    users[event.peer.id].i >= config.questions.length
  ) {
    bot.sendTextMessage(event.peer, score(users[event.peer.id].score));
    bot.sendTextMessage(event.peer, 'Чтобы пройти тест ещё раз напиши мне начать');
    users[event.peer.id].start = true;
  }
});

// function addQuestion() {}

// function addAnwser() {}
async function createTest(bot, peer, message) {
  const start = true;

  if (start) {
    bot.sendTextMessage(peer, 'Назовите ваш тест.');
    const testName = await bot.onMessage(async (message) => message.content.text);
  } else {
    const next = true;

    while (next) {
      bot.sendTextMessage(peer, 'Пришлите название вопроса.');
      const question = await bot.onMessage(async (message) => message.content.text);
      const nextanwser = true;
      while (nextanwser) {
        bot.sendTextMessage(peer, 'Пришлите название ответа.');
        const anwser = [];
        const awr = await bot.onMessage(async (message) => message.content.text);
        anwser.push(awr);
      }
    }
  }

  bot.sendTextMessage(peer, testName);
}

module.exports = {
  createTest,
};

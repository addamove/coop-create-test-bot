const users = {};
const r = require('rethinkdbdash')({ db: 'ctb' });

async function defineNewUser(peer) {
  if (typeof users[peer.id] === 'undefined') {
    try {
      const query = await r
        .table('state')
        .filter({
          peer: {
            id: peer.id,
            type: 'user',
          },
        })
        .run();
      if (typeof query[0] === 'undefined') {
        console.log(users);
        users[peer.id] = {
          id: peer.id,
          start: true,
          // Создание опроса,
          createSurvey: 'init',
          surveyInput: [],
          // Создание теста
          createTest: 'init',
          currentWorkingTest: undefined,
          // для боавления результатов в тесты
          addResults: 'init',
          // храним что-нибудь что надо помнить между вызовами фун-ций
          cached: '',
          // все что относится к прохождения теста пока можно только один за раз пройти
          // currentTakingTest -> здесь будет объект со всеми данным теста
          currentTakingTest: undefined,
          score: 0,
          i: 0,
          si: 0,
        };
        await r
          .table('state')
          .insert(users[peer.id])
          .run();
      } else {
        users[peer.id] = query[0];
      }
    } catch (err) {
      console.log(err);
    }
  }
}
function clearUserInfo(peer) {
  users[peer.id].currentTakingTest = undefined;
  users[peer.id].currentWorkingTest = undefined;
  users[peer.id].currentTakingSurvey = undefined;
  users[peer.id].currentWorkingSurvey = undefined;
  users[peer.id].score = 0;
  users[peer.id].i = 0;
  users[peer.id].si = 0;
}

async function updateUserInDB(peer) {
  await r
    .table('state')
    .filter({
      peer: {
        id: peer.id,
        key: `u${peer.id}`,
        type: 'user',
      },
    })
    .replace(users[peer.id])
    .run();
}

module.exports = {
  defineNewUser,
  users,
  clearUserInfo,
  updateUserInDB,
};

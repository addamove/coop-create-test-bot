const users = {};

function defineNewUser(peer) {
  if (typeof users[peer.id] === 'undefined') {
    users[peer.id] = {
      start: true,
      // Создание теста
      createTest: 'init',
      currentWorkingTest: undefined,
      addResults: 'init',
      // храним что-нибудь что надо помнить между вызовами фун-ций
      cached: '',
      // все что относится к прохождения теста пока можно только один за раз пройти
      // currentTakingTest -> здесь будет объект со всеми данным теста
      currentTakingTest: undefined,
      score: 0,
      i: 0,
    };
  }
}
function clearUserInfo(peer) {
  users[peer.id].currentTakingTest = undefined;
  users[peer.id].currentWorkingTest = undefined;
  users[peer.id].score = 0;
  users[peer.id].i = 0;
}

module.exports = {
  defineNewUser,
  users,
  clearUserInfo,
};

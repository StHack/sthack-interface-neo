const { ScoreInfoService, SolvedStateEnum } = require('../src/ScoreInfoService');

// Mock data
function generateDefaultScoreInfoService() {
  return new ScoreInfoService({
    closedTaskDelay: 1000 * 60 * 10,
    ctfOpen: true
  });
}

function neverSolvedTask() {
  return {
    title: 'First task',
    difficulty: 'easy',
    flags: ['807d0fbcae7c4b20518d4d85664f6820aafdf936104122c5073e7744c46c4b87'],
    solved: []
  };
}

function solvedBySomeoneTask() {
  return {
    title: 'Second task',
    difficulty: 'easy',
    flags: ['807d0fbcae7c4b20518d4d85664f6820aafdf936104122c5073e7744c46c4b87'],
    solved: [
      { teamName: 'otherTeam', timestamp: 1410792226000 }
    ]
  };
}

function solvedAndActuallyClosedTask() {
  return {
    title: 'Third task',
    difficulty: 'easy',
    flags: ['807d0fbcae7c4b20518d4d85664f6820aafdf936104122c5073e7744c46c4b87'],
    solved: [
      { teamName: 'myTeam', timestamp: 1410792224000 },
      { teamName: 'otherTeam', timestamp: Date.now() - (1000 * 60 * 2) }
    ]
  };
}

function solvedByMyTeamTask() {
  return {
    title: 'Third task',
    difficulty: 'easy',
    flags: ['807d0fbcae7c4b20518d4d85664f6820aafdf936104122c5073e7744c46c4b87'],
    solved: [
      { teamName: 'otherTeam', timestamp: 1410792226000 },
      { teamName: 'myTeam', timestamp: 1410792228000 }
    ]
  };
}

function firstSolvedByMyTeamTask() {
  return {
    title: 'Third task',
    difficulty: 'easy',
    flags: ['807d0fbcae7c4b20518d4d85664f6820aafdf936104122c5073e7744c46c4b87'],
    solved: [
      { teamName: 'myTeam', timestamp: 1410792224000 },
      { teamName: 'otherTeam', timestamp: 1410792226000 }
    ]
  };
}


// Generic test
function TestSolvability(task, state, expected) {
  const service = generateDefaultScoreInfoService();

  const isSolved = service.expectedState(task, state, 'myTeam');

  expect(isSolved).toBe(expected);
}


describe("Tasks never solved", () => {

  it("is 'never solved by anybody'", () =>
    TestSolvability(
      neverSolvedTask(),
      SolvedStateEnum.NotSolved,
      true));

  it("is 'solved by someone'", () =>
    TestSolvability(
      neverSolvedTask(),
      SolvedStateEnum.SolvedBySomeone,
      false));

  it("is not 'solved by your team'", () =>
    TestSolvability(
      neverSolvedTask(),
      SolvedStateEnum.SolvedByCurrentTeam,
      false));

  it("is not 'solved by your team in first'", () =>
    TestSolvability(
      neverSolvedTask(),
      SolvedStateEnum.FirstSolvedByCurrentTeam,
      false));


  it("is 'opened'", () => {
    const task = neverSolvedTask();
    const service = generateDefaultScoreInfoService();

    const isOpenState = service.isOpen(task);

    expect(isOpenState).toBe(true);
  });

  it('should be solvable by your team', () => {
    const task = neverSolvedTask();
    const service = generateDefaultScoreInfoService();

    const isSolvable = service.isSolvableByTeam(task, 'myTeam');

    expect(isSolvable).toBe(true);
  });

});

describe("Tasks solved by other team", () => {

  it("is not 'never solved by anybody'", () =>
    TestSolvability(
      solvedBySomeoneTask(),
      SolvedStateEnum.NotSolved,
      false));

  it("is 'solved by someone'", () =>
    TestSolvability(
      solvedBySomeoneTask(),
      SolvedStateEnum.SolvedBySomeone,
      true));

  it("is not 'solved by your team'", () =>
    TestSolvability(
      solvedBySomeoneTask(),
      SolvedStateEnum.SolvedByCurrentTeam,
      false));

  it("is not 'solved by your team in first'", () =>
    TestSolvability(
      solvedBySomeoneTask(),
      SolvedStateEnum.FirstSolvedByCurrentTeam,
      false));


  it("is 'opened'", () => {
    const task = solvedBySomeoneTask();
    const service = generateDefaultScoreInfoService();

    const isOpenState = service.isOpen(task);

    expect(isOpenState).toBe(true);
  });

  it('should be solvable by your team', () => {
    const task = solvedBySomeoneTask();
    const service = generateDefaultScoreInfoService();

    const isSolvable = service.isSolvableByTeam(task, 'myTeam');

    expect(isSolvable).toBe(true);
  });

});

describe("Tasks solved by someone with 'closedTaskDelay' not finished", () => {

  it("is not 'opened'", () => {
    const task = solvedAndActuallyClosedTask();
    const service = generateDefaultScoreInfoService();

    const isOpenState = service.isOpen(task);

    expect(isOpenState).toBe(false);
  });

  it(`shouldn't be solvable by your team`, () => {
    let task = solvedAndActuallyClosedTask();
    const service = generateDefaultScoreInfoService();

    const isSolvable = service.isSolvableByTeam(task, 'myTeam');

    expect(isSolvable).toBe(false);
  });

});

describe("Tasks solved by my team", () => {

  it("is not 'never solved by anybody'", () =>
    TestSolvability(
      solvedByMyTeamTask(),
      SolvedStateEnum.NotSolved,
      false));

  it("is 'solved by someone'", () =>
    TestSolvability(
      solvedByMyTeamTask(),
      SolvedStateEnum.SolvedBySomeone,
      true));

  it("is 'solved by your team'", () =>
    TestSolvability(
      solvedByMyTeamTask(),
      SolvedStateEnum.SolvedByCurrentTeam,
      true));

  it("is not 'solved by your team in first'", () =>
    TestSolvability(
      solvedByMyTeamTask(),
      SolvedStateEnum.FirstSolvedByCurrentTeam,
      false));


  it("is 'opened'", () => {
    const task = solvedByMyTeamTask();
    const service = generateDefaultScoreInfoService();

    const isOpenState = service.isOpen(task);

    expect(isOpenState).toBe(true);
  });

  it(`shouldn't be solvable by your team again`, () => {
    const task = solvedByMyTeamTask();
    const service = generateDefaultScoreInfoService();

    const isSolvable = service.isSolvableByTeam(task, 'myTeam');

    expect(isSolvable).toBe(false);
  });

});

describe("Tasks solved by my team first", () => {

  it("is not 'never solved by anybody'", () =>
    TestSolvability(
      firstSolvedByMyTeamTask(),
      SolvedStateEnum.NotSolved,
      false));

  it("is 'solved by someone'", () =>
    TestSolvability(
      firstSolvedByMyTeamTask(),
      SolvedStateEnum.SolvedBySomeone,
      true));

  it("is 'solved by your team'", () =>
    TestSolvability(
      firstSolvedByMyTeamTask(),
      SolvedStateEnum.SolvedByCurrentTeam,
      true));

  it("is 'solved by your team in first'", () =>
    TestSolvability(
      firstSolvedByMyTeamTask(),
      SolvedStateEnum.FirstSolvedByCurrentTeam,
      true));

  it("is 'opened'", () => {
    const task = firstSolvedByMyTeamTask();
    const service = generateDefaultScoreInfoService();

    const isOpenState = service.isOpen(task);

    expect(isOpenState).toBe(true);
  });

  it(`shouldn't be solvable by your team again`, () => {
    const task = firstSolvedByMyTeamTask();
    const service = generateDefaultScoreInfoService();

    const isSolvable = service.isSolvableByTeam(task, 'myTeam');

    expect(isSolvable).toBe(false);
  });

});

describe('Team can solve task', () => {

  it(`only if ctf is open`, () => {
    const service = new ScoreInfoService({ ctfOpen: false });
    const task = neverSolvedTask();

    const isSolvable = service.isSolvableByTeam(task, 'myTeam');

    expect(isSolvable).toBe(false);
  });

  it(`only if team hasn't solved it`, () => {
    const service = generateDefaultScoreInfoService();
    const task = solvedByMyTeamTask();

    const isSolvable = service.isSolvableByTeam(task, 'myTeam');

    expect(isSolvable).toBe(false);
  });

  it(`only if nobody have closed it (closedTaskDelay)`, () => {
    const service = generateDefaultScoreInfoService();
    const task = solvedAndActuallyClosedTask();

    const isSolvable = service.isSolvableByTeam(task, 'myTeam');

    expect(isSolvable).toBe(false);
  });

});

  // it("can't be solved with good flag", function (done) {
  //   const promise = new Task(DB, config).solveTask('Fourth task', 'flag', 'myTeam');
  //   promise.then(function (result) {
  //     expect(true).toBe(false);
  //   }, function (error) {
  //     expect(error.toString()).toEqual("Error: You can't solve this task");
  //   }).finally(done);
  // });

  // it("can't be solved with bad flag", function (done) {
  //   const promise = new Task(DB, config).solveTask('Fourth task', 'bad flag', 'myTeam');
  //   promise.then(function (result) {
  //     expect(true).toBe(false);
  //   }, function (error) {
  //     expect(error.toString()).toEqual("Error: You can't solve this task");
  //   }).finally(done);
  // });

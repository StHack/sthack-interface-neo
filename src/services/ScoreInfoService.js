var { sortBy } = require('lodash');

const solvedStateEnum = Object.freeze({
  NotSolved: 0,
  SolvedBySomeone: 1,
  SolvedByCurrentTeam: 2,
  FirstSolvedByCurrentTeam: 3
});

class ScoreInfoService {
  constructor(config) {
    this.config = config;
  }

  getOrderedSolvation(task) {
    return sortBy(task.solved, ['timestamp']);
  }

  getScore(task, countTeam) {
    var solved = this.getOrderedSolvation(task);

    switch (task.difficulty) {
      case 'easy':
        return this.config.baseScore * (countTeam - solved.length);
      case 'medium':
        return this.config.baseScore * 2 * (countTeam - solved.length);
      default:
        return this.config.baseScore * 3 * (countTeam - solved.length);
    }
  }

  getTaskSolvedState(task, teamName) {
    var solved = this.getOrderedSolvation(task);

    if (solved.length === 0) {
      //nobody solved
      return { state: solvedStateEnum.NotSolved, time: 0 };
    }

    const teamSolved = solved.find(s => s.teamName === teamName);

    if (teamSolved) {
      if (solved[0] === teamSolved) {
        // solved first
        return { state: solvedStateEnum.FirstSolvedByCurrentTeam, time: teamSolved.timestamp };
      }

      // you solved
      return { state: solvedStateEnum.SolvedByCurrentTeam, time: teamSolved.timestamp };
    }

    //someone else solved
    return { state: solvedStateEnum.SolvedBySomeone, time: 0 };
  }

  expectedState(task, desiredState, teamName) {
    var solved = this.getTaskSolvedState(task, teamName);

    return desiredState === 0
      ? solved.state === desiredState
      : solved.state >= desiredState;
  }

  teamSolved(task, teamName) {
    return this.expectedState(task, solvedStateEnum.SolvedByCurrentTeam, teamName);
  }

  isSolvableByTeam(task, teamName) {
    return this.config.ctfOpen
      && this.teamSolved(task, teamName) === false
      && this.isOpen(task);
  }

  isOpen(task) {
    var solved = this.getOrderedSolvation(task);
    if (solved.length === 0) {
      return true;
    }

    const nextSolvationAllowedTime = parseInt(solved[solved.length - 1].timestamp) + parseInt(this.config.closedTaskDelay);
    return nextSolvationAllowedTime < new Date().getTime();
  }

}

exports.ScoreInfoService = ScoreInfoService;
exports.SolvedStateEnum = solvedStateEnum;

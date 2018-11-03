const { SolvedStateEnum } = require('./ScoreInfoService');
const { orderBy } = require('lodash')

class ScoreService {
  constructor(
    teamDB,
    taskDB,
    scoreInfoService
  ) {
    this.teamDB = teamDB;
    this.taskDB = taskDB;
    this.scoreInfoService = scoreInfoService;
  }

  async getScoreBoard() {
    const teams = await this.teamDB.list();
    const tasks = await this.taskDB.getAllTasks();

    var scoreboard = [];

    for (const team of teams) {
      var score = this._getTeamScore(tasks, team.name);
      scoreboard.push({
        team: team.name,
        score: score.value,
        lastTask: score.lastTask,
        time: -score.last,
        breakthrough: score.breakthrough,
        solved: score.solved
      });
    }

    return orderBy(scoreboard, ['score', 'time'], ['desc', 'desc']);
  }

  async getScoreOfTeam(teamName) {
    const tasks = await this.taskDB.getAllTasks();
    return this._getTeamScore(tasks, teamName);
  }

  _getTeamScore(tasks, teamName) {
    var score = 0;
    var bt = [];
    var last = 0;
    var lastTask = '';
    var taskSolved = {};

    for (const task of tasks) {
      var solvedState = this.scoreInfoService.getTaskSolvedState(task, teamName);

      if (solvedState.state < SolvedStateEnum.SolvedByCurrentTeam) {
        continue;
      }

      if (solvedState.state === SolvedStateEnum.FirstSolvedByCurrentTeam) {
        bt.push(task.title);
      }

      score += task.score;
      if (last < solvedState.time) {
        last = solvedState.time;
        lastTask = task.title;
      }

      taskSolved[task.title] = solvedState.time;
    }

    return {
      value: score,
      breakthrough: bt,
      lastTask: lastTask,
      last: last,
      solved: taskSolved
    };
  }

}

exports.ScoreService = ScoreService;

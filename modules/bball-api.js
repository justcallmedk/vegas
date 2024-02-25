module.exports = class BBallAPI{
  constructor(apiKey) {
    this.host = 'https://api.b365api.com/';
    this.apiKey = apiKey;
    this.SPORTS_ID = 18;
    this.EVENT_STATUS = {
      'inplay': 1,
      'upcoming': 1,
      'ended': 1
    }
  }

  async getLeague(name) {
    const data = await fetch(this.host + '/v1/league' +
    '?sport_id=' + this.SPORTS_ID + '&cc=us' +
    '&token=' + this.apiKey, {
    }).catch(err => {
      throw err;
    });
    const json = await data.json();
    if(json.error) {
      throw json.error;
    }

    for(const result of json.results) {
      if(result.name === name) {
        return result;
      }
    }
  }

  async getLeagueTable(leagueId) {
    const data = await fetch(this.host + '/v3/league/table' +
      '?league_id=' + leagueId +
      '&token=' + this.apiKey, {
    }).catch(err => {
      throw err;
    });
    const json = await data.json();
    if(json.error) {
      throw json.error;
    }
    return json.results;
  }

  async getD1Teams(leagueId) {
    let ret = {}
    const data = await this.getLeagueTable(leagueId);
    for(const row of data[0].overall.tables) {
      if(row.groupname === 'Division I Overall') {
        for(const team of row.rows) {
          ret[team.team.id] = true;
        }
      }
    }
    return ret;
  }

  async getInplayEvents(leagueId,page=1,ret=[]) {
    const data = await fetch(this.host + '/v3/events/inplay' +
      '?sport_id=' + this.SPORTS_ID + '&league_id=' + leagueId +
      '&page=' + page +
      '&token=' + this.apiKey, {
    }).catch(err => {
      throw err;
    });
    const json = await data.json();
    if(json.error) {
      throw json.error;
    }
    ret = json.results;
    if(json.pager && json.pager.page * json.pager.per_page < json.pager.total) {
      //recurse
      ret = ret.concat(await this.getInplayEvents(leagueId, ++page, ret));
    }
    return ret;
  }

  async getTodaysEvents(leagueId) {
    const today = new Date();
    const options = {
      timeZone: "America/Los_Angeles",
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    };
    const date1 = today.toLocaleDateString("en-US", options)
    const dateSplit1 = date1.split('/');
    const day1 = dateSplit1[2] + dateSplit1[0] + dateSplit1[1];

    today.setDate(today.getDate() + 1);
    const dateSplit2 = today.toLocaleDateString("en-US", options).split('/');
    const day2 = dateSplit2[2] + dateSplit2[0] + dateSplit2[1];

    let ret = await this.getUpcomingEvents(leagueId,day1);
    let ret2 = await this.getUpcomingEvents(leagueId,day2);
    for(const row of ret2) {
      const gameTime = new Date(parseInt(row.time) * 1000).toLocaleDateString("en-US", options);
      if(gameTime !== date1) {
        continue;
      }
      ret.push(row);
    }
    return ret;
  }

  async getUpcomingEvents(leagueId,day,page=1,ret=[]) {
    const data = await fetch(this.host + '/v3/events/upcoming' +
      '?sport_id=' + this.SPORTS_ID + '&league_id=' + leagueId +
      '&day=' + day +
      '&page=' + page + '&skip_esports=&' +
      '&token=' + this.apiKey, {
    }).catch(err => {
      throw err;
    });
    const json = await data.json();
    if(json.error) {
      throw json.error;
    }
    ret = json.results;
    if(json.pager && json.pager.page * json.pager.per_page < json.pager.total) {
      ret = ret.concat(await this.getUpcomingEvents(leagueId, day, ++page, ret));
    }
    return ret;
  }

  async getOdds(eventId) {
    const sinceTime =  Date.now() - (5 * 60 * 1000) //5 mins ago
    const data = await fetch(this.host + '/v2/event/odds' +
      '?event_id=' + eventId + '&odds_market=3&since_time' + sinceTime +
      '&token=' + this.apiKey, {
    }).catch(err => {
      throw err;
    });
    const json = await data.json();
    if(json.error) {
      throw json.error;
    }
    if(!json.results ||
       !json.results.odds ||
       !json.results.odds['18_3']
    ) {
      return [];
    }
    return json.results.odds['18_3'].slice(0,5);
  }
}
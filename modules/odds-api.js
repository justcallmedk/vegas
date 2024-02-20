module.exports = class OddsAPI{
  constructor(apiKey) {
    this.host = 'https://api.the-odds-api.com';
    this.apiKey = apiKey;
  }
  printApiKey() {
    console.info(this.apiKey);
  }

  async getSportsKey(keyword) {
    const response = await fetch(this.host +
      '/v4/sports/?apiKey=' +
      this.apiKey,{
    });
    const sportsData = await response.json();
    for(const data of sportsData) {
      if(data.title === keyword) {
        return data.key;
      }
    }
  }

  async getEvents(sportsId) {
    const response = await fetch(this.host +
      '/v4/sports/' + sportsId + '/events?apiKey=' +
      this.apiKey,{
    });
    const data = await response.json();
    return data;
  }

  async getOdds(sportsId,markets) {
    const response = await fetch(this.host +
      '/v4/sports/' + sportsId + '/odds?apiKey=' +
      this.apiKey +
      '&regions=us&markets=' + markets,{
    });
    const data = await response.json();
    return data;
  }

  async getScores(sportsKey) {
    const response = await fetch(this.host +
      '/v4/sports/' + sportsKey + '/scores?apiKey=' +
      this.apiKey,{
    });
    const data = await response.json();
    return data;
  }
}
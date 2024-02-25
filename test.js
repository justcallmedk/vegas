const BBallAPI = require('./modules/bball-api.js');
const apiKEY = require("./modules/api-key");

const apiKey = apiKEY.BetsAPI;
const myBBallAPI = new BBallAPI(apiKey);

const run = async () => {
  //console.info(Object.keys(DIV1CONF).length);
  const leagueId = (await myBBallAPI.getLeague('NCAAB')).id;
  const data = await myBBallAPI.getInplayEvents(leagueId);
  for(const row of data) {
    console.info(row);
  }
  console.info(data.length);
};
run();
import fetch from 'node-fetch';
import OddsAPI from './modules/odds-api.js'
import APIKey from './modules/api-key.js';
const run = async () => {
  const apiKey = APIKEY.OddsAPI;
  const myOddsAPI = new OddsAPI(apiKey);
  myOddsAPI.printApiKey();
  //get NCAB sports key
  const sportsId = await myOddsAPI.getSportsKey('NCAAB');
  //console.info(sportsId);
  //get events
  const eventsData = await myOddsAPI.getEvents(sportsId);
  //console.info(eventsData[0]);
  //get scores
  const scoresData = await myOddsAPI.getScores(sportsId);
  console.info(scoresData[0]);
  //get odds
  const oddsData = await myOddsAPI.getOdds(sportsId,scoresData[0].id,'totals');
  console.info(oddsData.bookmakers[0].markets[0].outcomes);
};
run();
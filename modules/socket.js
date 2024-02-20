const express = require('express'); // using express
const socketIO = require('socket.io');
const http = require('http')
const cors = require('cors');

const OddsAPI = require('../modules/odds-api');
const apiKEY = require('../modules/api-key');
const apiKey = apiKEY.OddsAPI;
const myOddsAPI = new OddsAPI(apiKey);

const PORT = 7011;
const REFRESH_INTERVAL = 30000;
const MARKETS = 'totals';

const run = async() => {
  let userCount = 0;
  let apiCallCount = 0;
  let cache = {};

  const sportsId = await myOddsAPI.getSportsKey('NCAAB');
  apiCallCount++;

  let app = express();
  app.use(cors());

  const server = http.createServer(app);
  const io = socketIO(server, {
    cors: {
      origin: ['http://localhost:7010'],
      methods: ['GET', 'POST']
    },
    path: '/socket/io'
  });


  //cache logic
  const generateCache = async () => {
    //don't fetch anything until one hour before the game
    if(cache.scores && cache.scores.firstCommenceTime &&
       cache.scores.firstCommenceTime > Date.now() - (60 * 60 * 1000)) {
      return;
    }

    let oddsData = await myOddsAPI.getOdds(sportsId,MARKETS);
    oddsData = new Map(oddsData.map(obj => [obj.id, obj.bookmakers]));
    let dataTemp = await myOddsAPI.getScores(sportsId);
    apiCallCount = apiCallCount + 2;

    let data = [];
    //if error
    if(dataTemp.message) {
      console.error(dataTemp.message);
      io.emit('message',dataTemp.message);
      return;
    }
    //if empty data, flush cache
    if(!dataTemp || dataTemp.length === 0){
      cache = {};
      return;
    }

    if(!cache.scores || !cache.scores.firstCommenceTime) {
      //sort by commence time for the first time, in case data doesn't come in sorted
      data = data.sort((a,b) => {
        const keyA = Date.parse(a.commence_time);
        const keyB = Date.parse(b.commence_time);
        if (keyA < keyB) return -1;
        if (keyA > keyB) return 1;
        return 0;
      });
    }

    //filter out future events
    for(const datum of dataTemp) {
      //only get today's game
      const commenceTime = new Date(datum.commence_time);
      const commenceTimeWest = new Date(datum.commence_time);
      commenceTimeWest.setHours(commenceTime.getHours()-8); //convert to west coast time
      const todaysDate = new Date();
      //if the game starts today before OR after time conversion
      if( commenceTime.setHours(0,0,0,0) === todaysDate.setHours(0,0,0,0) ||
        commenceTimeWest.setHours(0,0,0,0) === todaysDate.setHours(0,0,0,0)) {
        if(oddsData.has(datum.id)) {
          datum.odds = oddsData.get(datum.id);
        }
        data.push(datum);
      }
    }

    cache.scores = {
      data: data,
      timestamp : Date.now(),
      stats: {
        apiCallCount: apiCallCount,
        cacheSize: Object.keys(cache).length * data.length
      }
    };
  };
  const refreshCache = () => {
    setInterval(async () => {
      await generateCache();
      io.emit('scores', cache.scores);
    },REFRESH_INTERVAL);
  };
  await generateCache();
  refreshCache();

  server.listen(PORT);
  console.log('server running on ' + PORT);

  io.on('connection', (socket) => {
    userCount++;
    io.emit('userCount',userCount);

    socket.on('disconnect', () => {
      userCount--;
      io.emit('userCount',userCount);
    });

    socket.on('scores', async (test) => {
      io.emit('scores', cache.scores);
    });
  });
};

return run();

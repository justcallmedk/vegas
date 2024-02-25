const express = require('express'); // using express
const socketIO = require('socket.io');
const http = require('http')
const cors = require('cors');

const BBallAPI = require('../modules/bball-api');
const apiKEY = require('../modules/api-key');
const apiKey = apiKEY.BetsAPI;
const myBBallAPI = new BBallAPI(apiKey);

const PORT = 7011;
const REFRESH_INTERVAL = 30000; //TODO move to config.js

const run = async() => {
  let userCount = 0;
  let apiCallCount = 0;
  let cache = {};
  const leagueId = (await myBBallAPI.getLeague('NCAAB')).id;
  apiCallCount++;

  console.log('Generating D1 teams');
  const div1Teams = await myBBallAPI.getD1Teams(leagueId);
  console.log(Object.keys(div1Teams).length + ' teams found');
  if(Object.keys(div1Teams).length === 0) {
    throw 'Error in getting D1 teams';
  }

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


  //cache helper
  const updateCache = async (mode,games) => {
    if(!cache.odds) {
      cache.odds = {};
    }
    let ret = []
    for(const game of games) {
      if(!div1Teams[game.home.id]) {// not div 1 game, skip
        continue;
      }
      const gameTime = parseInt(game.time)*1000;
      const gameTimeObj = new Date(gameTime);

      if( mode === 'live' || //always get fresh odds for live games
         (mode === 'upcoming' && // get and store odds for games starting in an <hour
          !cache.odds[game.id] &&
          gameTimeObj - Date.now() <= 3600 * 1000)) {
        const odds = await myBBallAPI.getOdds(game.id);
        apiCallCount++;
        cache.odds[game.id]  = odds;
      }

      cache[mode][game.id] = true;
      const retObj = {
        id : game.id,
        time : gameTime,
        time_status : game.time_status,
        home : game.away, // there is a bug in api home/away flipped
        away : game.home,
        live : mode === 'live',
        odds : cache.odds[game.id]
      }
      if(retObj.live) {
        retObj.scores = game.scores;
        retObj.timer = game.timer;
      }
      ret.push(retObj);
    }
    return ret;
  };

  //cache logic
  const generateCache = async() => {
    //TODO try catch error

    //don't fetch anything until one hour before the game
    if(cache.firstCommenceTime &&
       cache.firstCommenceTime > Date.now() - (60 * 60 * 1000)) {
      return;
    }

    cache.live = {};
    const liveGames = await myBBallAPI.getInplayEvents(leagueId);
    let ret = await updateCache('live',liveGames);
    apiCallCount += Math.ceil(liveGames.length/50);
    if(!cache.firstCommenceTime) { //first time execution
      const upcomingGames =  await myBBallAPI.getTodaysEvents(leagueId);
      apiCallCount += Math.ceil(upcomingGames.length/50);

      if(upcomingGames.length === 0) { //if no more games for the day
        cache = {}; //flush cache
        return;
      }

      cache.firstCommenceTime = parseInt(liveGames.length > 0 ? liveGames[0].time : upcomingGames[0].time)*1000;
      cache.upcoming = {};
      ret = ret.concat(await updateCache('upcoming',upcomingGames));
    } else { // get new data
      for(const row of cache.data) {
        if(cache.live[row.id] || row.time_status === '3') {
          continue; //ret already contains live games, only add upcoming
        }
        ret.push(row);
      }
    }

    cache.data = ret;
    cache.timestamp = Date.now();
    cache.stats = {
      apiCallCount: apiCallCount,
      cacheSize: ret.length
    };
  };

  const refreshCache = () => {
    setInterval(async () => {
      await generateCache();
      io.emit('scores', cache);
    },REFRESH_INTERVAL);
  };

  console.info('generating initial cache ...');
  await generateCache();
  console.info('generated cache size ' + cache.data.length);
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
      io.emit('scores', cache);
    });
  });
};

return run();

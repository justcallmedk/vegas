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

const run = async() => {
  const sportsId = await myOddsAPI.getSportsKey('NCAAB');
  let app = express();
  app.use(cors());

  let usersCount = 0;
  let cacheCount = 0;
  let cache = {};

  const server = http.createServer(app);
  const io = socketIO(server, {
    cors: {
      origin: ['http://localhost:7010'],
      methods: ['GET', 'POST']
    },
    path: '/socket/io'
  });


  //cache logic
  let refreshCounter = 0;
  const generateCache = async () => {
    if(cache.scores && cache.scores.firstCommenceTime &&
       cache.scores.firstCommenceTime > Date.now()) {
      console.info('no game commenced, skipping');
      return;
    }

    console.log('getting cache');
    const data = await myOddsAPI.getScores(sportsId);
    if(!data || data.length === 0){
      return;
    }
    cacheCount++;
    cache.scores = {
      data : data,
      count : cacheCount,
      firstCommenceTime : Date.parse(data[0].commence_time)
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
    usersCount++;
    io.emit('usersCount',usersCount);

    socket.on('disconnect', () => {
      usersCount--;
      io.emit('usersCount',usersCount);
    });

    //TODO may not be used
    socket.on('list', async (test) => {
      const eventsData = await myOddsAPI.getEvents(sportsId);
      io.to(socket.id).emit('list', eventsData);
    });

    socket.on('scores', async (test) => {
      io.emit('scores', cache.scores);
    });
  });
};

return run();

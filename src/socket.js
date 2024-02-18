const express = require('express'); // using express
const socketIO = require('socket.io');
const http = require('http')
const cors = require('cors');

const OddsAPI = require('../modules/odds-api');
const apiKEY = require('../modules/api-key');
const apiKey = apiKEY.OddsAPI;
const myOddsAPI = new OddsAPI(apiKey);

const port = 7011;

const run = async() => {
  const sportsId = await myOddsAPI.getSportsKey('NCAAB');
  let app = express();
  app.use(cors());

  let server = http.createServer(app)
  let io = socketIO(server, {
    cors: {
      origin: ['http://localhost:7010'],
      methods: ['GET', 'POST']
    },
    path: '/socket/io'
  });

  server.listen(port);
  console.log('server running on ' + port);

  io.on('connection', async (socket) => {
    socket.on('list', async (test) => {
      const eventsData = await myOddsAPI.getEvents(sportsId);
      io.to(socket.id).emit('list', eventsData);
    });
    socket.on('scores', async (test) => {
      const eventsData = await myOddsAPI.getScores(sportsId);
      io.to(socket.id).emit('scores', eventsData);
    });
  });
};

return run();

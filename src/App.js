import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import './App.css';
import Score from './components/score/Score.js'

const UPDATE_INTERVAL = 30;
function App() {
  const [socket, setSocket] = useState(null);
  const [sports, setSports] = useState(null);
  const [message, setMessage] = useState(null);
  const [userCount, setUserCount] = useState(null);
  const [stats, setStats] = useState({});
  const [counter, setCounter] = useState(UPDATE_INTERVAL);

  useEffect(() => {
    if(!socket) {

      const port = window.location.hostname === 'localhost' ? ':' + 7011 : '';
      const newSocket = io(`//${window.location.hostname}` + port, {path:'/socket/io'});
      setSocket(newSocket);
    }
  }, []);


  let interval;
  useEffect(() => {
    if(!socket) { //this will always run first time, return if socket not rdy
      return;
    }

    socket.on('scores', (data) => {
      clearInterval(interval);
      setCounter(UPDATE_INTERVAL);
      setSports(data);
      setStats({
        api: data.stats.apiCallCount,
        cache: data.stats.cacheSize
      });
      //show next update count down
      interval = setInterval(() => {
        setCounter((prevCounter) => prevCounter <= 0 ? 0 : prevCounter - 1);
      }, 1000);
      return () => clearInterval(interval);
    });

    socket.on('connect_error', (data) => {
      setMessage('Unable to connect to the backed :(');
    });
    socket.on('userCount', (data) => {
      setUserCount(data);
    });

    socket.on('message', (data) => {
      setMessage(data);
    });

    //load initial scores
    socket.emit('scores');
  }, [socket]);

  const listSports = (data) => {
    if(!data)
      return;

    let sports = [];
    for(const datum of data.data) {
      sports.push(
        <Score key={datum.id}
               data={datum}
        />
      );
    }
    return sports;
  };

  const today = new Date().toLocaleDateString('en-US', {month: "numeric", day: "numeric"});

  return (
    <div className="App">
      <div className="header">
        NCAAB {today}
      </div>
      <div className="message">
        {message}
      </div>
      <div className="sports">
        {listSports(sports)}
      </div>
      <div className="footer">
        <div className="contact-me">
          <a href="mailto:innate.worship-0r@icloud.com">Contact</a>
        </div>
        <div className="stats">
          Next update in {counter} seconds / Cache size: {stats.cache} / API calls: {stats.api} /online: {userCount}
        </div>
      </div>
    </div>
  );
}

export default App;

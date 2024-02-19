import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import './App.css';
import Score from './components/score/Score.js'

function App() {
  const [socket, setSocket] = useState(null);
  const [sports, setSports] = useState(null);
  const [usersCount, setUsersCount] = useState(0);

  useEffect(() => {
    if(!socket) {
      const port = window.location.hostname === 'localhost' ? ':' + 7011 : '';
      const newSocket = io(`//${window.location.hostname}` + port, {path:'/socket/io'});
      setSocket(newSocket);
    }
  }, []);

  useEffect(() => {
    if(!socket) { //this will always run first time, return if socket not rdy
      return;
    }

    socket.on('scores', (data) => {
      console.info('got scores');
      setSports(data);
    });

    socket.on('usersCount', (data) => {
      setUsersCount(data);
    });


    //load initial scores
    socket.emit('scores');
  }, [socket]);

  const listSports = (data) => {
    if(!data)
      return;

    let sports = [];
    console.info(data.data[0]);
    //console.info(data[0]);
    for(const datum of data.data) {
      //console.info(datum.home_team);
      sports.push(
        <Score key={datum.id}
               home={datum.home_team}
               away={datum.away_team}
               count={data.count}
               commenceTime={datum.commence_time}
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
      <div className="sports">
        {listSports(sports)}
      </div>
      <div className="footer">
        <div className="contact-me">
          <a href="mailto:innate.worship-0r@icloud.com">Contact</a>
        </div>
        <div className="online-counter">
          {usersCount} online
        </div>
      </div>
    </div>
  );
}

export default App;

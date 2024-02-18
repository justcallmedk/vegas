import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import './App.css';

function App() {
  const [socket, setSocket] = useState(null);
  const [sports, setSports] = useState(null);

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
      setSports(data);
    });
    socket.emit('scores');
  }, [socket]);

  const listSports = (data) => {
    if(!data)
      return;

    let sports = [];
    console.info(data[0]);
    for(const datum of data) {
      //console.info(datum.home_team);
      sports.push(
        <div key={datum.id}>
          {datum.away_team} @ {datum.home_team}
        </div>
      );
    }
    return sports;
  };
  return (
    <div className="App">
      { listSports(sports) }
    </div>
  );
}

export default App;

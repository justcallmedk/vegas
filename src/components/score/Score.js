import React, {Fragment, useEffect} from 'react';
import './Score.css';
import io from "socket.io-client";

function Score(props) {

  const TOTAL_SECONDS = 2400;
  const MAX_BAR_WIDTH = 798;
  useEffect(() => {
  }, [props.data]);

  const dateObj = new Date(props.data.time);
  const dateParsed = dateObj.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
  const isLive = props.data.live;

  /*
  //truncate long team names
  let homeTeamName = props.data.home_team.length > 30 ?
    props.data.home_team.split(' ').slice(0,-1).join(' ') : props.data.home_team;
  let awayTeamName = props.data.away_team.length > 30 ?
    props.data.away_team.split(' ').slice(0,-1).join(' ') : props.data.away_team;
   */

  const homeScore = isLive && props.data.scores && props.data.scores[7] ? parseInt( props.data.scores[7].home) : -1;
  const awayScore = isLive && props.data.scores && props.data.scores[7] ? parseInt( props.data.scores[7].away) : -1;
  const totalScore = (homeScore < 0 ? 0 : homeScore) + (awayScore < 0 ? 0 : awayScore);

  const odds = parseFloat(props.data.odds && props.data.odds.length > 0 ? props.data.odds[0].handicap : 0);
  let timer = '';
  let projection = 0;
  let progression = 0;
  let totalBar = 0;
  let projectionBar = 0;
  let oddsBar = 0;

  if(props.data.timer) {
    if (Object.keys(props.data.timer).length === 0) {
      timer = '1H ??:??';
    } else if(props.data.timer.q === '1' &&
              props.data.timer.tm === '0' &&
              props.data.timer.ts === '0') {
      timer = 'halftime';
      projection = totalScore*2;
      progression = 50;
    }
    else {
      timer = props.data.timer.q + 'H ' + props.data.timer.tm.padStart(2, '0') + ':' + props.data.timer.ts.padStart(2, '0');
      if(isLive && totalScore > 0) {
        const elapsed = ((20-parseInt(props.data.timer.tm)) * 60) + (60-parseInt(props.data.timer.ts)) + (props.data.timer.q === '2' ? 1200 : 0);
        const pps = totalScore / elapsed;
        projection = Math.floor(pps * TOTAL_SECONDS);
        progression = (elapsed / TOTAL_SECONDS) * 100;
        if(progression >= 100) {
          progression = 100;
        }
      }
    }
  } else if(props.data.time_status === '3') {
    timer = 'finished';
    projection = totalScore;
    progression = 100;
  }
  if(progression > 0) {
    totalBar = (MAX_BAR_WIDTH * (progression/100));
    if(totalBar >= MAX_BAR_WIDTH) {
      totalBar = MAX_BAR_WIDTH;
    }
    projectionBar = (((projection - totalScore) / projection)+1) * totalBar;
    oddsBar = (((odds- totalScore) / odds)+1) * totalBar;
    if(oddsBar > MAX_BAR_WIDTH) {
      oddsBar = MAX_BAR_WIDTH;
    }
  }

  return (
    <div className="sport">
      <div className="away">
        {props.data.away.name}
        {awayScore >= 0 &&
          <span> ({awayScore})</span>
        }
      </div>
      <div className="at">
        @
      </div>
      <div className="home">
        {props.data.home.name}
        {homeScore >= 0 &&
          <span> ({homeScore})</span>
        }
      </div>
      <div className="commence-time">
        { !isLive &&
          <Fragment>
            {dateParsed}
          </Fragment>
        }
        { isLive &&
          <span>
            {timer}
          </span>
        }
      </div>
      { isLive &&
        <div className="live">LIVE</div>
      }
      { !isLive &&
        <div className="pregame-odds">{odds}</div>
      }
      { isLive &&
        <Fragment>
          <div className="bar">
            <div style={{
              width: progression + '%'
            }} className="progress"></div>
          </div>
          <div style={{
            marginLeft : totalBar + 'px'
          }} className="indicator score"></div>
          <div style={{
            marginLeft: projectionBar + 'px'
          }} className="indicator projection"></div>
          <div style={{
            marginLeft: oddsBar + 'px'
          }} className="indicator odds-line"></div>
          <div className="data">
            <div className="score">total : {totalScore}</div>
            <div className="projection">projection : {projection}</div>
            <div className="odds-line">odds : {odds}</div>
          </div>
        </Fragment>
      }
    </div>
  );
}

export default Score;

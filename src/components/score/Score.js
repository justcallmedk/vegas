import React from 'react';
import './Score.css';

function Score(props) {
  const dateObj = new Date(props.commenceTime);
  const dateParsed = dateObj.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })
  return (
    <div className="sport">
      <div className="home">
        {props.home}
      </div>
      <div className="at">
        @
      </div>
      <div className="away">
        {props.away}
      </div>
      <div className="commence-time">
        {dateParsed}
      </div>
      <div className="bar">
        <div className="progress"></div>
      </div>
      <div className="indicator score"></div>
      <div className="indicator projection"></div>
      <div className="indicator odds-line"></div>
      <div className="data">
        <div className="score">total : 45</div>
        <div className="projection">projection : 105</div>
        <div className="odds-line">Odd : 125</div>
      </div>
    </div>
  );
}

export default Score;

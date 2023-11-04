import React, { useEffect, useState } from 'react';
import { render, useNetTableKey } from 'react-panorama-x';

function Counter() {
  const { time } = useNetTableKey("GamingTable", "timeOprt") ?? { time: 0 }
  const { nRound } = useNetTableKey("GamingTable", "round") ?? { nRound: 0 }

  return (
    <Panel style={{ flowChildren: 'down' }}>
      <Label className='Countdown' text={`Count: ${time ?? 0}`} />

      <TextButton className="ButtonBevel" text="Roll" onactivate={() => {
        GameEvents.SendCustomGameEventToServer("GM_Operator", {
          nPlayerID: Players.GetLocalPlayer(),
          typeOprt: 1
        })
      }} />

      <TextButton className="ButtonBevel" text="攻城略地" onactivate={() => {
        GameEvents.SendCustomGameEventToServer("GM_Operator", {
          nPlayerID: Players.GetLocalPlayer(),
          typeOprt: 3,
          nRequest: 1
        })
      }} />

      <TextButton className="ButtonBevel" text="Finish" onactivate={() => {
        GameEvents.SendCustomGameEventToServer("GM_Operator", {
          nPlayerID: Players.GetLocalPlayer(),
          typeOprt: 0
        })
      }} />

      <Label className='Countdown' text={`Round: ${nRound ?? 0}`} />
    </Panel>
  );
}



render(<Counter />, $.GetContextPanel());
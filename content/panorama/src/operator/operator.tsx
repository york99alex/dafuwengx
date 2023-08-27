import React, { useEffect, useState } from 'react';
import { render, useNetTableKey } from 'react-panorama-x';

function Counter() {
  const timeOprt = useNetTableKey("GamingTable", "timeOprt") ?? 0


  return (
    <Panel style={{ flowChildren: 'down' }}>
      <Label className='Countdown' text={`Count: ${timeOprt.time ?? 0}`} />
      <TextButton className="ButtonBevel" text="Roll" onactivate={() => {
        GameEvents.SendCustomGameEventToServer("S2C_GM_Operator", {
          nPlayerID: Players.GetLocalPlayer(),
          typeOprt: 1
        })
      }} />

      <TextButton className="ButtonBevel" text="AYZZ" onactivate={() => {
        GameEvents.SendCustomGameEventToServer("S2C_GM_Operator", {
          nPlayerID: Players.GetLocalPlayer(),
          typeOprt: 2
        })
      }} />

    </Panel>
  );
}



function setOprtCountdown(data: number) {

}

render(<Counter />, $.GetContextPanel());
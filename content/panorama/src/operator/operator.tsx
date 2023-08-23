import React, { useEffect, useState } from 'react';
import { render, useNetTableKey } from 'react-panorama-x';





function Counter() {
  const timeOprt = useNetTableKey("GamingTable", "timeOprt") ?? 0


  return (
    <Panel style={{ flowChildren: 'down' }}>
      <Label className='Countdown' text={`Count: ${timeOprt.time ?? 0}`} />
      <TextButton className="ButtonBevel" text="Roll" onactivate={() => {
        GameEvents.SendCustomGameEventToServer("GM_Operator", {
          nPlayerID: 0,
          typeOprt: 1,
          nRequest: 0,
          typePath: 0,
          nPathID: 0,
          nGold: 0,
          jPlayerTrade: {
            nPlayerTrade: {
              nPlayerTradeID: 0,
              nGold: 0,
              arrPath: []
            },
            nPlayerBeTrade: {
              nPlayerBeTradeID: 0,
              nGold: 0,
              arrPath: []
            }
          }
        })
      }} />

      <TextButton className="ButtonBevel" text="AYZZ" onactivate={() => {
        GameEvents.SendCustomGameEventToServer("GM_Operator", {
          nPlayerID: 0,
          typeOprt: 2,
          nRequest: 1,
          typePath: 0,
          nPathID: 0,
          nGold: 0,
          jPlayerTrade: {
            nPlayerTrade: {
              nPlayerTradeID: 0,
              nGold: 0,
              arrPath: []
            },
            nPlayerBeTrade: {
              nPlayerBeTradeID: 0,
              nGold: 0,
              arrPath: []
            }
          }
        })
      }} />

    </Panel>
  );
}



function setOprtCountdown(data: number) {

}

render(<Counter />, $.GetContextPanel());
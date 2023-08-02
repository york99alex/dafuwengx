import React, { useState } from 'react';
import { render } from 'react-panorama-x';





function Counter() {
  const [count, setCount] = useState(0);

  return (
    <Panel style={{ flowChildren: 'down' }}>
      <Label text={`Count: ${count}`} />
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

render(<Counter />, $.GetContextPanel());
import React from "react"
import { render } from "react-panorama-x"
import { Main } from "./component/main"

GameEvents.Subscribe("S2C_GM_ShowGold", (event) => {
    // TODO:飘金
    $.Msg("玩家ID", event.nPlayerID, "飘金", event.nGold)
})

// render(<Main />, $.GetContextPanel())
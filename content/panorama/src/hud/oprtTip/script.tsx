import { useRef, useState } from "react"
import { render, useGameEvent } from "react-panorama-x"

export const OprtTip = () => {

    const [isPannelOpen, setIsPanelOpen] = useState(false)

    useGameEvent("GM_Operator", (event) => {
        if (event.typeOprt != 2) return
        setIsPanelOpen(true)
        $.Msg("GM_Operator", event)
    })

    return <Panel className={`oprtTip ${isPannelOpen ? "open" : "close"}`}>
        <TextButton className="ButtonBevel AYZZ" text="AYZZ" onactivate={() => {
            GameEvents.SendCustomGameEventToServer("GM_Operator", {
                nPlayerID: Players.GetLocalPlayer(),
                typeOprt: 2,
                nRequest: 1
            })
            setIsPanelOpen(false)
        }} />
        <TextButton className="ButtonBevel Cannel" text="取消" onactivate={() => {
            GameEvents.SendCustomGameEventToServer("GM_Operator", {
                nPlayerID: Players.GetLocalPlayer(),
                typeOprt: 2,
                nRequest: 0
            })
            setIsPanelOpen(false)
        }} />
    </Panel>
}

render(<OprtTip />, $.GetContextPanel())
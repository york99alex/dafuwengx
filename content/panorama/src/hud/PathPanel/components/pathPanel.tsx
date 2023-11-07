import { useState } from "react"
import { useGameEvent } from "react-panorama-x"

export const PathPanel = () => {

    const [isPannelOpen, setIsPanelOpen] = useState(false)

    useGameEvent("GM_Operator", (event) => {
        if (event.nPlayerID != Players.GetLocalPlayer() || event.typeOprt != 2) return
        setIsPanelOpen(true)
        $.Msg("GM_Operator_PathDomain", event)
    })

    return <>
        <Panel className={`oprtTip ${isPannelOpen ? "open" : "close"}`}>
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
    </>
}
export const Main = () => {
    GameEvents.Subscribe("S2C_GM_ShowGold", (event) => {
        // TODO:飘金
        $.Msg("玩家ID", event.nPlayerID, "飘金", event.nGold)
    })
    return <></>
}
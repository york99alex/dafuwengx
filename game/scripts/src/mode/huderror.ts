export class HudError {

    /**发送到玩家ID, -1为所有人 */
    static FireDefaultError(nPlayerID: number, message: string) {
        const data: {
            type: number,
            message: string,
            nPlayerID?: number
        } = {
            type: 0,
            message: message
        }
        if (nPlayerID == -1) {
            this.SendToAllPlayer(data)
        } else {
            data.nPlayerID = nPlayerID
            this.SendToPlayer(data)
        }
    }

    static SendToAllPlayer(data: {
        type: number,
        message: string
    }) {
        GameRules.PlayerManager.broadcastMsg("S2C_GM_HUDErrorMessage", data)
    }

    static SendToPlayer(data: {
        type: number,
        message: string,
        nPlayerID?: number
    }) {
        GameRules.PlayerManager.sendMsg("S2C_GM_HUDErrorMessage", data, data.nPlayerID)
    }

}
export class HudError {
    /**发送到玩家ID, -1为所有人 */
    static FireDefaultError(nPlayerID: number, message: string) {
        const data: {
            type: number;
            message: string;
        } = {
            type: 0,
            message: message,
        };
        if (nPlayerID == -1) {
            this.SendToAllPlayer(data);
        } else {
            this.SendToPlayer(data, nPlayerID);
        }
    }

    /**
     * 发送错误提示信息
     * @param nPlayerID 玩家ID，-1为所有人
     * @param message 消息文本
     */
    static FireLocalizeError(nPlayerID: number, message: string) {
        const data = {
            type: 1,
            message: message,
        };
        if (nPlayerID == -1) {
            this.SendToAllPlayer(data);
        } else {
            this.SendToPlayer(data, nPlayerID);
        }
    }

    static SendToAllPlayer(data: { type: number; message: string }) {
        GameRules.PlayerManager.broadcastMsg('S2C_GM_HUDErrorMessage', data);
    }

    static SendToPlayer(data: { type: number; message: string }, nPlayerID: number) {
        GameRules.PlayerManager.sendMsg('S2C_GM_HUDErrorMessage', data, nPlayerID);
    }
}

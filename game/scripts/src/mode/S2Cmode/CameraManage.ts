export class CameraManage {
    m_tCameraFollow: {};

    constructor() {
        this.m_tCameraFollow = {};
    }

    static LookAt(nPlayerID: number, Pos: Vector, Lerp) {
        print('nPlayerID:', nPlayerID);
        if (nPlayerID == -1) {
            this.SendToAllPlayer({
                pos: Pos,
                lerp: Lerp,
            });
        } else {
            this.SendToPlayer({
                pos: Pos,
                lerp: Lerp,
                nPlayerID: nPlayerID,
            });
        }
    }

    static SendToPlayer(data) {
        GameRules.PlayerManager.sendMsg('GM_CameraCtrl', data, data.nPlayerID);
    }

    static SendToAllPlayer(data) {
        GameRules.PlayerManager.broadcastMsg('GM_CameraCtrl', data);
    }
}

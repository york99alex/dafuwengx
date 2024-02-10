export class GameManager {
    constructor() {
        GameEvents.Subscribe('GM_CameraCtrl', this.CameraPosMsg);
    }

    /**发送操作到服务器，并console */
    SendOperatorToServer(data: any) {
        console.log('[Game SendOperator]: send data is ->>>');
        console.log(data);
        if (data) GameEvents.SendCustomGameEventToServer('GM_Operator', data);
    }

    CameraPosMsg(data: any) {
        console.log(data);
        GameUI.SetCameraTargetPosition(data.pos, data.lerp);
        $.Schedule(0.5, () => GameUI.SetCameraTarget(-1 as EntityIndex));
    }
}

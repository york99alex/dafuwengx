export class GameManager {
    /**发送操作到服务器，并console */
    SendOperatorToServer(data: any) {
        console.log('[Game SendOperator]: send data is ->>>');
        console.log(data);
        if (data) GameEvents.SendCustomGameEventToServer('GM_Operator', data);
    }
}

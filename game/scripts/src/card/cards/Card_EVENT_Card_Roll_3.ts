import { TypeOprt } from '../../constants/gamemessage';
import { Card } from '../card';

/**骰子-3 30012 */
export class Card_EVENT_Card_Roll_3 extends Card {
    m_sName: string = '骰子-3';
    OnSpellStart(): void {
        // 有tp和攻城跳过
        GameRules.GameConfig.autoOprt(TypeOprt.TO_TP);
        GameRules.GameConfig.autoOprt(TypeOprt.TO_GCLD);
        GameRules.GameConfig.autoOprt(TypeOprt.TO_AtkMonster);

        let nNum1 = RandomInt(1, 6),
            nNum2 = RandomInt(1, 6);

        // 广播玩家roll点操作
        GameRules.PlayerManager.broadcastMsg('GM_OperatorFinished', {
            nPlayerID: this.GetOwner().m_nPlayerID,
            nNum1: nNum1,
            nNum2: nNum2,
            typeOprt: TypeOprt.TO_Roll,
            nRequest: 1,
        });
        print('playerID', this.GetOwner().m_nPlayerID, 'roll final: ', nNum1, nNum2);

        // 音效
        EmitGlobalSound('Custom.Roll.Ing');

        GameRules.GameLoop.GameStateService.send('towait');

        Timers.CreateTimer(1.5, () => {
            // 设置roll点记录
            // TODO: GameRecord.setGameRecord()

            if (nNum1 == nNum2) {
                EmitGlobalSound('coins_wager.x1');
            }
            GameRules.GameLoop.GameStateService.send('towaitoprt');
            // 触发roll事件
            GameRules.EventManager.FireEvent('Event_Roll', {
                bIgnore: 0,
                nNum1: nNum1,
                nNum2: nNum2,
                player: this.GetOwner(),
            });
        });
    }
}

import { TIME_SUPPLY_READY } from '../../constants/constant';
import { Card } from '../card';

/**刀刀兄弟 30001 */
export class Card_EVENT_DoDoBrother extends Card {
    OnSpellStart(): void {
        // 记录当前回合剩余操作时间
        GameRules.GameConfig.m_timeTemp = GameRules.GameConfig.m_timeOprt;

        const tData: {
            tabSupplyInfo: any[];
            tabPlayerID: PlayerID[];
            nPlayerIDOprt: PlayerID;
        } = {
            tabSupplyInfo: [],
            tabPlayerID: GameRules.Supply.getOrders(),
            nPlayerIDOprt: -1,
        };
        GameRules.Supply.setSupplyList(tData);
        if (tData.tabSupplyInfo.length > 0) {
            // 设置数据到网表
            print('supply data:====================');
            DeepPrintTable(tData);
            CustomNetTables.SetTableValue('GamingTable', 'supply', tData);

            // 设置游戏状态和操作时间
            GameRules.GameLoop.GameStateService.send('tosupply');
            GameRules.GameConfig.m_timeOprt = TIME_SUPPLY_READY;
            GameRules.Supply.m_nGMOrder = GameRules.GameConfig.m_nOrderID;
            GameRules.GameConfig.setOrder(-1);
        }
    }
}

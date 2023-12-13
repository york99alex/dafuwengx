import { Constant } from '../mode/constant';
import { BuyState_None, BuyState_Secret, BuyState_Side, TP_SHOP_SIDE } from '../mode/gamemessage';
import { Player } from '../player/player';
import { Path } from './Path';

/**商店 */
export class PathShop extends Path {
    constructor(entity: CBaseEntity) {
        super(entity);
        GameRules.EventManager.Register('Event_JoinPath', (event: { player: Player }) => this.onEvent_JoinPath(event), this);
        GameRules.EventManager.Register('Event_LeavePath', (event: { player: Player; path: Path }) => this.onEvent_LeavePath(event), this);
    }

    onPath(player: Player): void {
        super.onPath(player);
        print('===PathShop===onPath===this.m_nID:', this.m_nID);
    }

    /**设置玩家购物状态 */
    setCanBuy(player: Player) {
        if (this.m_typePath == TP_SHOP_SIDE) {
            player.setBuyState(BuyState_Side, 1);
        } else {
            player.setBuyState(BuyState_Secret, 1);
        }
    }

    /**玩家当前路径改变 */
    onEvent_JoinPath(event: { player: Player }) {
        print('===PathShop===onEvent_JoinPath===this.m_nID:', this.m_nID);
        if (event.player.m_pathCur.m_nID != this.m_nID) return;
        if (event.player.m_pathLast.m_nID == this.m_nID) return;
        if (GameRules.GameConfig.m_nRound >= Constant.GLOBAL_SHOP_ROUND) return;
        this.setCanBuy(event.player);
    }

    /**玩家离开路径 */
    onEvent_LeavePath(event: { player: Player; path: Path }) {
        print('===PathShop===onEvent_LeavePath===this.m_nID:', this.m_nID);
        if (event.path != this) return;
        if (GameRules.GameConfig.m_nRound >= Constant.GLOBAL_SHOP_ROUND) return;
        event.player.setBuyState(BuyState_None, 0);
    }
}

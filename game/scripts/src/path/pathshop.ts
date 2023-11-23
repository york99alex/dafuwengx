import { Constant } from "../mode/constant";
import { BuyState_None, BuyState_Secret, BuyState_Side, TP_SHOP_SIDE } from "../mode/gamemessage";
import { Player } from "../player/player";
import { Path } from "./Path";

/**商店 */
export class PathShop extends Path {

    constructor(entity: CBaseEntity) {
        super(entity)
        GameRules.EventManager.Register("Event_JoinPath", (event: { player: Player }) => this.onEvent_JoinPath(event), this)
        GameRules.EventManager.Register("Event_LeavePath", (event: { player: Player, path: Path }) => this.onEvent_LeavePath(event), this)

    }

    onPath(player: Player): void {
        super.onPath(player)
    }

    /**设置玩家购物状态 */
    setCanBuy(player: Player) {
        if (this.m_typePath == TP_SHOP_SIDE) {
            player.setBuyState(BuyState_Side, 1)
        } else {
            player.setBuyState(BuyState_Secret, 1)
        }
    }

    /**玩家当前路径改变 */
    onEvent_JoinPath(event: { player: Player }) {
        if (event.player.m_pathCur != this) return
        if (event.player.m_pathLast != this) return
        if (GameRules.GameConfig.m_nRound >= Constant.GLOBAL_SHOP_ROUND) return
        this.setCanBuy(event.player)
    }

    /**玩家离开路径 */
    onEvent_LeavePath(event: { player: Player; path: Path; }) {
        if (event.path != this) return
        if (GameRules.GameConfig.m_nRound >= Constant.GLOBAL_SHOP_ROUND) return
        event.player.setBuyState(BuyState_None, 0)
    }
}
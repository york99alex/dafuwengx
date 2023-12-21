import { WAGE_GOLD, WAGE_GOLD_REDUCE } from "../mode/constant";
import { Player } from "../player/player";
import { Path } from "./Path";

export class PathStart extends Path {
    m_tPlayerGetCount: number[]

    constructor(entity: CBaseEntity) {
        super(entity)
        this.m_tPlayerGetCount = []
        // 监听玩家到起点发工资
        GameRules.EventManager.Register("Event_CurPathChange", (event: { player: Player }) => {
            print("===PathStart===Event_CurPathChange===this.m_nID:", this.m_nID)
            if (this.m_nID != event.player.m_pathCur.m_nID || GameRules.GameConfig.m_nRound <= 0) {
                return
            }
            const player = event.player
            let nGet = this.m_tPlayerGetCount[player.m_nPlayerID]
            if (!nGet) {
                this.m_tPlayerGetCount[player.m_nPlayerID] = 0
                nGet = 0
            }
            const tEvent = {
                player: player,
                bIgonre: false
            }
            GameRules.EventManager.FireEvent("Event_WageGold", tEvent)
            if (tEvent.bIgonre) {
                return
            }

            let nGold = WAGE_GOLD - nGet * WAGE_GOLD_REDUCE
            nGold < 0 ? 0 : nGold
            player.setGold(nGold)
            GameRules.GameConfig.showGold(player, nGold)

            this.m_tPlayerGetCount[player.m_nPlayerID] = nGet + 1

        }, this, 0)
    }
}
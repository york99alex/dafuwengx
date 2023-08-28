import { GameMessage } from "../mode/gamemessage";
import { Player } from "../player/player";
import { Path } from "./Path";

export class PathMonster extends Path {
    m_eCity = null				    // 建筑点实体

    m_tabEHero = null				// 野区打野英雄实体
    m_tabEMonster: [] = null		    // 野区生物实体
    m_tabMonsterInfo = null	    // 可刷新的野怪信息
    m_tabAtker = null              // 野怪可攻击的单位
    m_tabTrophy = null             // 打野英雄获取的战利品统计<etab>

    m_typeMonsterCur = null        // 当前野怪类型
    m_typeMonsterLast = null       // 上次野怪类型

    constructor(entity: CBaseEntity) {
        super(entity)
    }

    // 触发路径
    onPath(oPlayer: Player) {
        super.onPath(oPlayer)

        if (this.m_tabEMonster.length == 0) return

        // 操作前处理上一个(如果有的话)
        GameRules.GameConfig.autoOprt(GameMessage.TypeOprt.TO_AtkMonster, oPlayer)
        GameRules.GameConfig.sendOprt({
            nPlayerID: oPlayer.m_nPlayerID,
            typeOprt: GameMessage.TypeOprt.TO_AtkMonster,
            typePath: this.m_typePath,
            nPathID: this.m_nID
        })
        GameRules.EventManager.Register("Event_CurPathChange",(event)=>{
            if(event.player == oPlayer && this != oPlayer.m_pathCur){
                GameRules.GameConfig.autoOprt(GameMessage.TypeOprt.TO_AtkMonster, oPlayer)
            }
        })
    }
}
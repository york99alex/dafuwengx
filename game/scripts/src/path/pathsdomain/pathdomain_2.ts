import { Player } from "../../player/player";
import { AHMC } from "../../utils/amhc";
import { ParaAdjuster } from "../../utils/paraadjuster";
import { PathDomain } from "./pathdomain";

/**领土路径-河道 */
export class PathDomain_2 extends PathDomain {

    /**计算玩家领地buff等级 */
    getPathBuffLevel(oPlayer: Player): number {
        // 兵卒几级就几级
        if (this.m_nOwnerID == oPlayer.m_nPlayerID) {
            return oPlayer.getBzStarLevel(this.m_tabENPC[0])
        }
    }

    /**获取领地BUFFName */
    getBuffName(nLevel?: number): string {
        const tPathSelfType = GameRules.PathManager.getPathByType(this.m_typePath)
        if (tPathSelfType[0] == this) {
            return "path_" + this.m_typePath + "_hujia"
        } else {
            return "path_" + this.m_typePath + "_mokang"
        }
    }

    /**设置领地BUFF */
    setBuff(oPlayer: Player): void {
        print("ability=setBuff")
        this.delBuff(oPlayer)
        // 获取路径等级
        const nLevel = this.getPathBuffLevel(oPlayer)
        if (!nLevel || nLevel <= 0)
            return

        // 添加
        const ability = AHMC.AddAbilityAndSetLevel(oPlayer.m_eHero, this.getBuffName(nLevel), nLevel)
        ability.SetLevel(nLevel)
        ParaAdjuster.ModifyMana(oPlayer.m_eHero, oPlayer.m_nManaMaxBase)

        // TODO: 3级双河道buff


    }

    /**移除领地BUFF */
    delBuff(oPlayer: Player): void {
        print("ability=delBuff")
        const strBuffName = this.getBuffName()
        if (oPlayer.m_eHero.HasAbility(strBuffName)) {
            // 触发事件：领地技能移除
            GameRules.EventManager.FireEvent("Event_PathBuffDel", { oPlayer: oPlayer, path: this, sBuffName: strBuffName })
            // 移除英雄buff技能
            AHMC.RemoveAbilityAndModifier(oPlayer.m_eHero, strBuffName)
            // TODO: 移除3级双河道buff
        }
    }
}
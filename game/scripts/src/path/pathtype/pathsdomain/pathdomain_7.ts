import { Player } from "../../../player/player";
import { PathDomain } from "./pathdomain";

/**领土路径-圣所 */
export class PathDomain_7 extends PathDomain {

    constructor(entity: CBaseEntity) {
        super(entity)
    }

    getPathBuffLevel(oPlayer: Player) {
        // 根据全部兵卒等级
        let nLevel = 100
        const tabPath = GameRules.PathManager.getPathByType(this.m_typePath) as PathDomain[]
        for (const v of tabPath) {
            if (v.m_tabENPC[0] && v.m_nOwnerID == oPlayer.m_nPlayerID) {
                const nLevelTemp = oPlayer.getBzStarLevel(v.m_tabENPC[0])
                if (nLevel > nLevelTemp) {
                    nLevel = nLevelTemp
                }
            } else {
                return
            }
        }
        return nLevel
    }
}
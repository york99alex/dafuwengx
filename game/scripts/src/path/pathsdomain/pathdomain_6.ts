import { AHMC, IsValid } from "../../utils/amhc";
import { PathDomain } from "./pathdomain";

/**领土路径-鵰巢 */
export class PathDomain_6 extends PathDomain {

    m_eDiao: CDOTA_BaseNPC     // 雕哥

    constructor(entity: CBaseEntity) {
        super(entity)
        let tabPath = GameRules.PathManager.getPathByType(this.m_typePath) as PathDomain_6[]
        if (tabPath.length != 1) return
        // 创建雕哥
        print("======创建雕哥===PathDomain_6===constructor===")
        GameRules.EventManager.Register("Event_GameStart", () => {
            tabPath = GameRules.PathManager.getPathByType(this.m_typePath) as PathDomain_6[]
            AHMC.CreateUnitAsync("path_17_diao",
                this.m_eCity.GetOrigin() - (this.m_eCity.GetForwardVector() * 200) as Vector,
                this.m_eCity.GetAnglesAsVector().y, this.m_tabENPC[0], DotaTeam.BADGUYS, (entity) => {
                    this.m_eDiao = entity
                    for (let i = 0; i <= 23; i++) {
                        const oAbltDiao = this.m_eDiao.GetAbilityByIndex(i)
                        if (oAbltDiao != null) oAbltDiao.SetLevel(1)
                    }
                    for (const v of tabPath) {
                        v.m_eDiao = this.m_eDiao
                    }
                    // 控制动作
                    this.m_eDiao["bIdle"] = true // 是否闲置状态
                    Timers.CreateTimer(() => {
                        this.setDiaoGesture(GameActivity.DOTA_IDLE)
                        return 3
                    })
                })
            return true
        })
    }

    setDiaoGesture(typeACT: GameActivity) {
        if (!IsValid(this.m_eDiao)) return

        if (!this.m_eDiao["bIdle"]) {
            if (typeACT == GameActivity.DOTA_IDLE)
                return
            else if (typeACT == GameActivity.DOTA_CAST_ABILITY_1) {
                this.m_eDiao.RemoveGesture(GameActivity.DOTA_CAST_ABILITY_1)
                this.m_eDiao["bIdle"] = true
            }
        }
        if (typeACT == GameActivity.DOTA_CAST_ABILITY_1) {
            this.m_eDiao["bIdle"] = false
            this.m_eDiao.RemoveGesture(GameActivity.DOTA_IDLE)
        }
        this.m_eDiao.StartGesture(typeACT)
    }
}
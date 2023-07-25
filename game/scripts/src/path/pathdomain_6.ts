import { AHMC } from "../utils/amhc";
import { PathManager } from "./PathManager";
import { PathDomain } from "./pathdomain";

/**领土路径-鵰巢 */
export class PathDomain_6 extends PathDomain {

    m_eDiao     // 雕哥

    constructor(entity: CBaseEntity) {
        super(entity)
        let tabPath = GameRules.PathManager.getPathByType(this.m_typePath)
        if (tabPath.length != 1) return
        // 创建雕哥
        CustomGameEventManager.RegisterListener("Event_GameStart", () => {
            tabPath = GameRules.PathManager.getPathByType(this.m_typePath)
            AHMC.CreateUnitAsync("path_17_diao",
                (this.m_eCity.GetOrigin() - (this.m_eCity.GetForwardVector() * 200)) as Vector,
                this.m_eCity.GetAnglesAsVector().y, this.m_tabENPC[0], DotaTeam.BADGUYS, (entity) => {
                    this.m_eDiao = entity
                    for (let i = 0; i < 23; i++) {
                        const oAbltDiao = this.m_eDiao.GetAbilityByIndex(i)
                        if (oAbltDiao != null) oAbltDiao.SetLevel(1)
                    }
                    for (const key in tabPath as any) {
                        tabPath[key].m_eDiao = this.m_eDiao
                    }
                    // 控制动作
                    this.m_eDiao.bIdle = true // 是否闲置状态
                    Timers.CreateTimer(() => {
                        this.setDiaoGesture(GameActivity.DOTA_IDLE)
                        return 3
                    })
                })
            return true
        })
    }

    setDiaoGesture(typeACT: GameActivity) {
        if (!AHMC.IsValid(this.m_eDiao)) return

        if (!this.m_eDiao.bIdle) {
            if (typeACT == GameActivity.DOTA_IDLE) return
            else if (typeACT == GameActivity.DOTA_CAST_ABILITY_1) {
                this.m_eDiao.RemoveGesture(GameActivity.DOTA_CAST_ABILITY_1)
                this.m_eDiao.bIdle = true
            }
        }
        if (typeACT == GameActivity.DOTA_CAST_ABILITY_1) {
            this.m_eDiao.bIdle = false
            this.m_eDiao.RemoveGesture(GameActivity.DOTA_IDLE)
        }
        this.m_eDiao.StartGesture(typeACT)
    }
}
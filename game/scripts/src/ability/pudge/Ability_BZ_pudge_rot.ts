import { GameMessage } from "../../mode/gamemessage";
import { CDOTA_BaseNPC_BZ } from "../../player/CDOTA_BaseNPC_BZ";
import { AHMC } from "../../utils/amhc";
import { registerAbility } from "../../utils/dota_ts_adapter";
import { TSBaseAbility } from "../tsBaseAbilty";
import { modifier_Ability_pudge_rot_debuff } from "./Ability_pudge_rot";


/**
 * 	"DOTA_Tooltip_ability_Ability_BZ_pudge_rot"					"腐烂"
    "DOTA_Tooltip_ability_Ability_BZ_pudge_rot_Description"		"<font color='#00FF00'>自动</font> 魔法至100%时，对经过的英雄造成持续伤害的毒性云雾，并使其移速减缓。"
    "DOTA_Tooltip_ability_Ability_BZ_pudge_rot_Lore"				"从屠夫腐烂肿胀的肉体中放出的有毒气体，气体恶心的令人窒息。"
    "DOTA_Tooltip_ability_Ability_BZ_pudge_rot_range"			"作用范围 :"
    "DOTA_Tooltip_ability_Ability_BZ_pudge_rot_damage"			"伤害 :"
    "DOTA_Tooltip_ability_Ability_BZ_pudge_rot_rot_slow"			"%减速 :"
*/
@registerAbility()
export class Ability_BZ_pudge_rot extends TSBaseAbility {

    m_bDamageCheck: boolean
    m_eTarget: CDOTA_BaseNPC
    m_nPctlID: ParticleID

    constructor() {
        super()
        this.ai()
    }

    GetCaster(): CDOTA_BaseNPC_BZ {
        return this.GetCaster() as CDOTA_BaseNPC_BZ
    }

    /**施法距离 */
    GetCastRange(location: Vector, target: CDOTA_BaseNPC): number {
        return this.GetSpecialValueFor("range")
    }

    /**选择无目标时 */
    CastFilterResult(): UnitFilterResult {
        if (IsServer()) {
            if (this.m_bDamageCheck) {
                // 已经开启
                return UnitFilterResult.FAIL_CUSTOM
            }

            if (IsValidEntity(this.GetCaster().m_eAtkTarget)) {
                this.m_eTarget = this.GetCaster().m_eAtkTarget
                const playerTarget = GameRules.PlayerManager.getPlayer(this.m_eTarget.GetPlayerOwnerID())
                if (playerTarget && 0 < bit.band(playerTarget.m_nPlayerState, GameMessage.PS_AbilityImmune)) {
                    return UnitFilterResult.FAIL_CUSTOM // 技能免疫
                }
                const event = {
                    ablt: this,
                    bIgnore: true
                }
                GameRules.EventManager.FireEvent("Event_BZCastAblt", event)
                if (!event.bIgnore) {
                    return UnitFilterResult.SUCCESS
                }
            }
        }
        this.m_strCastError = "AbilityError_BZ"
        return UnitFilterResult.FAIL_CUSTOM
    }

    /**开始技能效果 */
    OnSpellStart(): void {
        for (const v of this.GetCaster().m_tabAtker) {
            if (this.checkTarget(v)) {
                const nDis = (v.GetAbsOrigin() - this.GetCaster().GetAbsOrigin() as Vector).Length()
                if (nDis <= this.GetSpecialValueFor("range")) {
                    // 开启腐烂
                    this.switchPctl(true)
                    // 开伤害检测
                    this.switchDamageCheck(true)
                    break
                }
            }
        }

        // 触发放技能事件
        GameRules.EventManager.FireEvent("dota_player_used_ability", {
            caster_entindex: this.GetCaster().GetEntityIndex(),
            abilityname: this.GetAbilityName()
        })
    }

    /**开启腐烂特效 */
    switchPctl(bOn: boolean) {
        if (bOn) {
            // 开启
            if (!this.m_nPctlID) {
                this.m_nPctlID = AHMC.CreateParticle("particles/units/heroes/hero_pudge/pudge_rot.vpcf"
                    , ParticleAttachment.POINT_FOLLOW, false, this.GetCaster())
                ParticleManager.SetParticleControl(this.m_nPctlID, 1, Vector(this.GetSpecialValueFor("range"), 0, 0))
            }
        } else if (this.m_nPctlID != null) {
            // 关闭
            ParticleManager.DestroyParticle(this.m_nPctlID, false)
            this.m_nPctlID = null
        }
    }

    /**开关伤害检测 */
    switchDamageCheck(bOn: boolean) {
        if (bOn) {
            // 开启
            this.m_bDamageCheck = true
            const tabDamageCD = []
            Timers.CreateTimer(() => {
                if (!this.m_bDamageCheck) {
                    return
                }
                if (!this.IsNull() && !this.GetCaster().IsNull()) {
                    for (const v of this.GetCaster().m_tabAtker) {
                        if (!tabDamageCD[v.GetEntityIndex()]) {
                            const nDis = (v.GetAbsOrigin() - this.GetCaster().GetAbsOrigin() as Vector).Length()
                            if (nDis <= this.GetSpecialValueFor("range")) {
                                // 造成伤害
                                AHMC.Damage(this.GetCaster(), v, this.GetSpecialValueFor("damage"), this.GetAbilityDamageType()
                                    , this, 1, { bIgnoreBZHuiMo: true })
                                const nTime = this.GetSpecialValueFor("time_damage")
                                v.AddNewModifier(this.GetCaster(), this, modifier_Ability_pudge_rot_debuff.name
                                    , { duration: nTime })
                                tabDamageCD[v.GetEntityIndex()] = true
                                Timers.CreateTimer(nTime, () => {
                                    tabDamageCD[v.GetEntityIndex()] = null
                                })
                            }
                        }
                    }
                } else {
                    this.switchPctl(false)
                }
                if (tabDamageCD.filter(v => v != null).length == 0) {
                    // 关闭
                    this.switchPctl(false)
                    this.m_bDamageCheck = null
                } else {
                    return 0.1
                }
            })
        } else {
            this.m_bDamageCheck = null
        }
    }

    isCanCDSub(): boolean {
        return false
    }

    isCanManaSub(): boolean {
        return false
    }
}
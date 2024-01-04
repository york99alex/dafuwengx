import { PS_AbilityImmune } from "../../constants/gamemessage";
import { CDOTA_BaseNPC_BZ } from "../../player/CDOTA_BaseNPC_BZ";
import { AMHC, IsValid } from "../../utils/amhc";
import { BaseModifier, registerAbility, registerModifier } from "../../utils/dota_ts_adapter";
import { ParaAdjuster } from "../../utils/paraadjuster";
import { TSBaseAbility } from "../tsBaseAbilty";


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

    /**施法距离 */
    GetCastRange(location: Vector, target: CDOTA_BaseNPC): number {
        return this.GetSpecialValueFor("range")
    }

    /**选择无目标时 */
    CastFilterResult(): UnitFilterResult {
        if (IsServer()) {
            // print("===Ability_BZ_pudge_rot_IsRealHero:", this.GetCaster().IsRealHero())
            // print("===Ability_BZ_pudge_rot_GetUnitName:", this.GetCaster().GetUnitName())
            // print("===Ability_BZ_pudge_rot_GetClassname:", this.GetCaster().GetClassname())
            // print("===Ability_BZ_pudge_rot_m_eAtkTarget:", (this.GetCaster() as CDOTA_BaseNPC_BZ).m_eAtkTarget.GetUnitName())
            if (this.m_bDamageCheck) {
                // print("===Ability_BZ_pudge_rot_m_bDamageCheck:", this.m_bDamageCheck)
                // 已经开启
                return UnitFilterResult.FAIL_CUSTOM
            }

            if (IsValid(this.GetCaster())) {
                this.m_eTarget = this.GetCaster()["m_eAtkTarget"]
                const playerTarget = GameRules.PlayerManager.getPlayer(this.m_eTarget.GetPlayerOwnerID())
                if (playerTarget && 0 < bit.band(playerTarget.m_nPlayerState, PS_AbilityImmune)) {
                    return UnitFilterResult.FAIL_CUSTOM // 技能免疫
                }
                const event = {
                    ablt: this,
                    bIgnore: true
                }
                GameRules.EventManager.FireEvent("Event_BZCastAblt", event)
                if (!event.bIgnore) {
                    // print("===Ability_BZ_pudge_rot_CastResult: success")
                    return UnitFilterResult.SUCCESS
                }
            }
        }
        this.m_strCastError = "AbilityError_BZ"
        return UnitFilterResult.FAIL_CUSTOM
    }

    /**开始技能效果 */
    OnSpellStart(): void {
        // print("===Ability_BZ_pudge_rot_OnSpellStart")
        for (const v of this.GetCaster()["m_tabAtker"]) {
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
        // print("===Ability_BZ_pudge_rot_switchPctl:", bOn, this.m_nPctlID)
        if (bOn) {
            // 开启
            if (!this.m_nPctlID) {
                this.m_nPctlID = AMHC.CreateParticle("particles/units/heroes/hero_pudge/pudge_rot.vpcf"
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
        // print("===Ability_BZ_pudge_rot_switchDamageCheck:", bOn)
        if (bOn) {
            // 开启
            // print("===Ability_BZ_pudge_rot_switchDamageCheck:", 1)
            this.m_bDamageCheck = true
            const tabDamageCD: number[] = []
            Timers.CreateTimer(() => {
                if (!this.m_bDamageCheck) {
                    return
                }
                if (!this.IsNull() && !this.GetCaster().IsNull()) {
                    for (const v of this.GetCaster()["m_tabAtker"]) {
                        if (tabDamageCD.indexOf(v.GetEntityIndex()) == -1) {
                            const nDis = (v.GetAbsOrigin() - this.GetCaster().GetAbsOrigin() as Vector).Length()
                            if (nDis <= this.GetSpecialValueFor("range")) {
                                // 造成伤害
                                AMHC.Damage(this.GetCaster(), v, this.GetSpecialValueFor("damage"), this.GetAbilityDamageType()
                                    , this, 1, { bIgnoreBZHuiMo: true })
                                const nTime = this.GetSpecialValueFor("time_damage")
                                // print("===Ability_BZ_pudge_rot_switchDamageCheck_nTime:", nTime)
                                AMHC.AddNewModifier(v, this.GetCaster(), this, modifier_ability_BZ_pudge_rot_debuff.name, {})
                                // print("===Ability_BZ_pudge_rot_switchDamageCheck:", 2)
                                tabDamageCD.push(v.GetEntityIndex())
                                Timers.CreateTimer(nTime, () => {
                                    AMHC.RemoveModifierByName(modifier_ability_BZ_pudge_rot_debuff.name, v)
                                    tabDamageCD.splice(tabDamageCD.indexOf(v.GetEntityIndex()), 1)
                                    // print("===Ability_BZ_pudge_rot_switchDamageCheck_length:", tabDamageCD.length)
                                })
                            }
                        }
                    }
                } else {
                    this.switchPctl(false)
                    return
                }
                if (tabDamageCD.length == 0) {
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

/**腐烂减速 */
@registerModifier()
export class modifier_ability_BZ_pudge_rot_debuff extends BaseModifier {
    rot_slow: number
    IsDebuff(): boolean {
        return true
    }
    IsPurgable(): boolean {
        return false
    }
    OnCreated(params: object): void {
        this.rot_slow = this.GetAbility().GetSpecialValueFor("rot_slow")
    }
    OnRefresh(params: object): void {
        this.rot_slow = this.GetAbility().GetSpecialValueFor("rot_slow")
    }
    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.MOVESPEED_BONUS_PERCENTAGE]
    }
    GetModifierMoveSpeedBonus_Percentage(): number {
        return this.rot_slow
    }
}
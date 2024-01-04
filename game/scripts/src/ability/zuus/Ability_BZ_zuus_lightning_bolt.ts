import { PS_AbilityImmune } from "../../constants/gamemessage";
import { CDOTA_BaseNPC_BZ } from "../../player/CDOTA_BaseNPC_BZ";
import { AMHC, IsValid } from "../../utils/amhc";
import { registerAbility } from "../../utils/dota_ts_adapter";
import { TSBaseAbility } from "../tsBaseAbilty";

/**
 * 	"DOTA_Tooltip_ability_Ability_BZ_zuus_lightning_bolt"					"雷击"
    "DOTA_Tooltip_ability_Ability_BZ_zuus_lightning_bolt_Description"		"<font color='#00FF00'>自动</font> 召唤一道闪电打击经过的敌人。"
    "DOTA_Tooltip_ability_Ability_BZ_zuus_lightning_bolt_Lore"				"对那些反叛的异教徒最震慑的天罚。"
    "DOTA_Tooltip_ability_Ability_BZ_zuus_lightning_bolt_damage"				"伤害 :"
 */
@registerAbility()
export class Ability_BZ_zuus_lightning_bolt extends TSBaseAbility {

    m_eTarget: CDOTA_BaseNPC

    constructor() {
        super()
        this.ai()
    }

    GetCastRange(location: Vector, target: CDOTA_BaseNPC): number {
        return 0
    }

    /**选择目标时 */
    CastFilterResultTarget(target: CDOTA_BaseNPC): UnitFilterResult {
        if (IsValid((this.GetCaster() as CDOTA_BaseNPC_BZ).m_eAtkTarget)) {
            this.m_eTarget = (this.GetCaster() as CDOTA_BaseNPC_BZ).m_eAtkTarget
            const playerTarget = GameRules.PlayerManager.getPlayer(this.m_eTarget.GetPlayerOwnerID())
            if (playerTarget && 0 < bit.band(PS_AbilityImmune, playerTarget.m_nPlayerState)) {
                return UnitFilterResult.FAIL_CUSTOM     // 技能免疫
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
        this.m_strCastError = "AbilityError_BZ"
        return UnitFilterResult.FAIL_CUSTOM
    }

    /**开始技能效果 */
    OnSpellStart(): void {
        const eTarget = this.m_eTarget
        if (!IsValid(eTarget)) {
            return
        }
        const oPlayer = GameRules.PlayerManager.getPlayer(this.GetCaster().GetPlayerOwnerID())
        if (!oPlayer) {
            return
        }
        // 特效
        let nPtclID = AMHC.CreateParticle("particles/units/heroes/hero_zuus/zuus_thundergods_wrath.vpcf"
            , ParticleAttachment.POINT_FOLLOW, false, eTarget, 2)
        ParticleManager.SetParticleControl(nPtclID, 0, eTarget.GetAbsOrigin() + Vector(0, 0, 2000) as Vector)
        ParticleManager.SetParticleControl(nPtclID, 1, eTarget.GetAbsOrigin())
        nPtclID = AMHC.CreateParticle("particles/econ/items/zeus/lightning_weapon_fx/zuus_lb_cfx_il.vpcf"
            , ParticleAttachment.POINT, false, eTarget, 2)
        EmitGlobalSound("Hero_Zuus.LightningBolt")

        // 对玩家造成伤害
        AMHC.Damage(this.GetCaster(), eTarget, this.GetSpecialValueFor("damage"), this.GetAbilityDamageType(), this, 1, { bIgnoreBZHuiMo: true })
        // 触发放技能事件
        GameRules.EventManager.FireEvent("dota_player_used_ability", {
            caster_entindex: this.GetCaster().GetEntityIndex(),
            abilityname: this.GetAbilityName()
        })
    }

    isCanCDSub(): boolean {
        return false
    }

    isCanManaSub(): boolean {
        return false
    }
}
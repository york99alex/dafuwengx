import { AHMC } from "../../utils/amhc";
import { registerAbility } from "../../utils/dota_ts_adapter";
import { AbilityManager } from "../abilitymanager";
import { TSBaseAbility } from "../tsBaseAbilty";

/**
 * 	"DOTA_Tooltip_ability_Ability_zuus_lightning_bolt"					"雷击"
    "DOTA_Tooltip_ability_Ability_zuus_lightning_bolt_Description"		"召唤一道闪电打击一个敌方英雄。"
    "DOTA_Tooltip_ability_Ability_zuus_lightning_bolt_Lore"				"对那些反叛的异教徒最震慑的天罚。"
    "DOTA_Tooltip_ability_Ability_zuus_lightning_bolt_damage"		"伤害 :"
 */
@registerAbility()
export class Ability_zuus_lightning_bolt extends TSBaseAbility {

    GetCastRange(location: Vector, target: CDOTA_BaseNPC): number {
        return 0
    }

    /**选择目标时 */
    CastFilterResultTarget(target: CDOTA_BaseNPC): UnitFilterResult {
        if (!this.isCanCast(target)) {
            return UnitFilterResult.FAIL_CUSTOM
        }
        // 不能是自己
        if (target.GetPlayerOwnerID() == this.GetCaster().GetPlayerOwnerID()) {
            this.m_strCastError = "AbilityError_SelfCant"
            return UnitFilterResult.FAIL_CUSTOM
        }
        return UnitFilterResult.SUCCESS
    }

    /**开始技能效果 */
    OnSpellStart(): void {
        const oPlayer = GameRules.PlayerManager.getPlayer(this.GetCaster().GetPlayerOwnerID())
        const target = this.GetCursorTarget()
        const nDamage = this.GetSpecialValueFor("damage")

        // 特效
        let nPtclID = AHMC.CreateParticle("particles/units/heroes/hero_zuus/zuus_thundergods_wrath.vpcf"
            , ParticleAttachment.POINT, false, target, 2)
        ParticleManager.SetParticleControl(nPtclID, 0, target.GetAbsOrigin() + Vector(0, 0, 2000) as Vector)
        ParticleManager.SetParticleControl(nPtclID, 1, target.GetAbsOrigin())
        nPtclID = AHMC.CreateParticle("particles/econ/items/zeus/lightning_weapon_fx/zuus_lb_cfx_il.vpcf"
            , ParticleAttachment.POINT, false, target, 2)
        EmitGlobalSound("Hero_Zuus.LightningBolt")

        // 伤害
        AHMC.Damage(this.GetCaster(), target, nDamage, this.GetAbilityDamageType(), this)
        // 触发耗蓝
        GameRules.EventManager.FireEvent("Event_HeroManaChange", { player: oPlayer, oAblt: this })
        // 设置冷却
        AbilityManager.setRoundCD(oPlayer, this)
    }

}
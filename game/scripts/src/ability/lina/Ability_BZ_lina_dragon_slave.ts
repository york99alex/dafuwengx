import { PS_AbilityImmune } from "../../mode/gamemessage";
import { CDOTA_BaseNPC_BZ } from "../../player/CDOTA_BaseNPC_BZ";
import { AHMC, IsValid } from "../../utils/amhc";
import { registerAbility } from "../../utils/dota_ts_adapter";
import { TSBaseAbility } from "../tsBaseAbilty";

/**
 * 	"DOTA_Tooltip_ability_LuaAbility_BZ_lina_dragon_slave"					"龙破斩"
    "DOTA_Tooltip_ability_LuaAbility_BZ_lina_dragon_slave_Description"		"<font color='#00FF00'>自动</font> 莉娜引导龙的吐息，放出一波火焰，烧焦经过的敌人。"
    "DOTA_Tooltip_ability_LuaAbility_BZ_lina_dragon_slave_Lore"				"在纷争之国的荒焦之地，为了娱乐，莉娜学会了操控沙漠龙的火焰吐息。"
    "DOTA_Tooltip_ability_LuaAbility_BZ_lina_dragon_slave_dragon_slave_damage"			"伤害 :"
 */
@registerAbility()
export class Ability_BZ_lina_dragon_slave extends TSBaseAbility {

    m_eTarget: CDOTA_BaseNPC

    constructor() {
        super()
        this.ai()
    }

    GetCastRange(location: Vector, target: CDOTA_BaseNPC): number {
        return 0
    }

    /**选择无目标时 */
    CastFilterResult(): UnitFilterResult {
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

    OnSpellStart(): void {
        const eTarget = this.m_eTarget
        if (!IsValid(eTarget)) {
            return
        }
        const oPlayer = GameRules.PlayerManager.getPlayer(this.GetCaster().GetPlayerOwnerID())
        if (!oPlayer) {
            return
        }
        const nCasterEntID = this.GetCaster().GetEntityIndex()
        const strAbltName = this.GetAbilityName()

        // 特效
        const nPtclID = AHMC.CreateParticle("particles/units/heroes/hero_lina/lina_spell_dragon_slave.vpcf"
            , ParticleAttachment.POINT, false, this.GetCaster(), 0.4)
        const v3 = (eTarget.GetAbsOrigin() - this.GetCaster().GetAbsOrigin() as Vector).Normalized()
        const nSpeed = this.GetSpecialValueFor("dragon_slave_speed")
        ParticleManager.SetParticleControl(nPtclID, 1, v3 * nSpeed as Vector)
        EmitGlobalSound("Hero_Lina.DragonSlave")

        // 造成伤害
        AHMC.Damage(this.GetCaster(), eTarget, this.GetSpecialValueFor("dragon_slave_damage"), this.GetAbilityDamageType(), this, 1, { bIgnoreBZHuiMo: true })
        // 触发放技能事件
        GameRules.EventManager.FireEvent("dota_player_used_ability", {
            caster_entindex: nCasterEntID,
            abilityname: strAbltName
        })
    }

    isCanCDSub(): boolean {
        return false
    }

    isCanManaSub(): boolean {
        return false
    }
}
import { PS_AtkHero, PS_AtkMonster } from "../../mode/gamemessage";
import { PathDomain } from "../../path/pathsdomain/pathdomain";
import { AHMC } from "../../utils/amhc";
import { BaseModifier, registerAbility, registerModifier } from "../../utils/dota_ts_adapter";
import { TSBaseAbility } from "../tsBaseAbilty";

/**
 * 	"DOTA_Tooltip_ability_Ability_axe_helix_counter"					"反击螺旋"
    "DOTA_Tooltip_ability_Ability_axe_helix_counter_Description"		"受到攻击时，斧王有几率做出反击螺旋，对范围内的所有敌方单位造成纯粹伤害。如果受到一定次数攻击后，斧王还没做出反击螺旋，会愤怒地释放一次。"
    "DOTA_Tooltip_ability_Ability_axe_helix_counter_Lore"				"我买了个小风车~呼呼呼"
    "DOTA_Tooltip_ability_Ability_axe_helix_counter_chance"				"%触发概率 :"
    "DOTA_Tooltip_ability_Ability_axe_helix_counter_radius"					"半径 :"
    "DOTA_Tooltip_ability_Ability_axe_helix_counter_trigger_attacks"					"触发次数 :"
    "DOTA_Tooltip_ability_Ability_axe_helix_counter_damage"					"伤害 :"
 */
@registerAbility()
export class Ability_axe_helix_counter extends TSBaseAbility {

    IsPassive(): boolean {
        return true
    }

    GetIntrinsicModifierName(): string {
        return "modifier_Ability_axe_helix_counter"
    }
}

@registerModifier()
export class modifier_Ability_axe_helix_counter extends BaseModifier {


    IsHidden(): boolean {
        return false
    }

    IsPurgable(): boolean {
        return false
    }

    DeclareFunctions(): ModifierFunction[] {
        return [
            ModifierFunction.ON_ATTACK_LANDED
        ]
    }

    OnAttackLanded(event: ModifierAttackEvent): void {
        if (event.target != this.GetParent()) {
            return
        }
        const ability = this.GetAbility()
        if (!ability.IsCooldownReady()) {
            return
        }
        const nChance = ability.GetSpecialValueFor("chance")
        if (nChance < RandomInt(1, 100)) {
            // 概率不足, 检查保底
            const trigger_attacks = ability.GetSpecialValueFor("trigger_attacks")
            const oldCount = this.GetStackCount()
            if (oldCount + 1 < trigger_attacks) {
                this.SetStackCount(oldCount + 1)
                return
            } else {
                // 触发保底
                this.SetStackCount(0)
            }
        }
        // 开始技能效果
        ability.StartCooldown(ability.GetCooldown(ability.GetLevel() - 1))
        const caster = this.GetCaster()
        EmitSoundOn("Hero_Axe.CounterHelix", caster)
        caster.RemoveGesture(GameActivity.DOTA_CAST_ABILITY_3)
        caster.StartGesture(GameActivity.DOTA_CAST_ABILITY_3)
        // 获取范围中的敌人
        const nRadius = ability.GetSpecialValueFor("radius")
        let tab = []
        if (caster.IsRealHero()) {
            // 施法者英雄
            const oPlayer = GameRules.PlayerManager.getPlayer(caster.GetPlayerOwnerID())
            if (oPlayer) {
                if (0 < bit.band(PS_AtkMonster, oPlayer.m_nPlayerState)) {
                    // 施法者打野只伤害野怪
                    tab = FindUnitsInRadius(
                        DotaTeam.NEUTRALS,
                        caster.GetAbsOrigin(),
                        null,
                        nRadius,
                        UnitTargetTeam.FRIENDLY,
                        UnitTargetType.ALL,
                        UnitTargetFlags.NONE,
                        FindOrder.ANY,
                        false)
                } else if (0 < bit.band(PS_AtkHero, oPlayer.m_nPlayerState)) {
                    // 施法者攻城只伤害攻城兵卒,和攻击者
                    if ((oPlayer.m_pathCur as PathDomain).m_tabENPC) {
                        tab = [event.attacker]
                        for (const v of (oPlayer.m_pathCur as PathDomain).m_tabENPC) {
                            if (v != event.attacker) {
                                tab.push(v)
                            }
                        }
                    }
                } else {
                    // 伤害范围内的兵卒
                    tab = FindUnitsInRadius(
                        DotaTeam.BADGUYS,
                        caster.GetAbsOrigin(),
                        null,
                        nRadius,
                        UnitTargetTeam.FRIENDLY,
                        UnitTargetType.ALL,
                        UnitTargetFlags.NONE,
                        FindOrder.ANY,
                        false)
                    for (const v of tab) {
                        if (v.IsRealHero()) {
                            tab.splice(tab.indexOf(v), 1)
                        }
                    }
                }
            }
        } else {
            // 施法者兵卒 仅伤害攻击者
            tab = [event.attacker]
        }

        // 伤害
        const nDamage = ability.GetSpecialValueFor("damage")
        if (tab) {
            for (const v of tab) {
                if (v && !v.IsNull() && v.IsAlive()) {
                    AHMC.Damage(caster, v, nDamage, ability.GetAbilityDamageType(), ability)
                }
            }
        }
    }
}
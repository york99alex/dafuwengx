
import { BaseModifier, registerAbility, registerModifier } from "../../utils/dota_ts_adapter";
import { TSBaseAbility } from "../tsBaseAbilty";

/**
    "DOTA_Tooltip_ability_Ability_meepo_ransack"					    "洗劫"
    "DOTA_Tooltip_ability_Ability_meepo_ransack_Description"			"每次攻击从敌人身体汲取神秘的能量，以永久提升忽悠伤害。"
    "DOTA_Tooltip_ability_Ability_meepo_ransack_addsh"					"伤害提升 :"
    "DOTA_Tooltip_Modifier_Ability_meepo_ransack"						"洗劫"
    "DOTA_Tooltip_Modifier_Ability_meepo_ransack_Description"			"伤害提升"
    "AbilityValues" {
        "addsh" "1 2 3"
    }
 */
@registerAbility()
export class Ability_meepo_ransack extends TSBaseAbility {
    GetIntrinsicModifierName() {
        return modifier_ability_meepo_ransack.name
    }
}

@registerModifier()
export class modifier_ability_meepo_ransack extends BaseModifier {
    IsPassive(): boolean {
        return true
    }
    IsHidden(): boolean {
        if (this.GetParent().IsRealHero()) {
            return false
        } else {
            return true
        }
    }
    IsPurgable(): boolean {
        return false
    }
    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.ON_ATTACK_LANDED]
    }
    OnAttackLanded(event: ModifierAttackEvent): void {
        const oPlayer = GameRules.PlayerManager.getPlayerByHeroName("npc_dota_hero_meepo")
        if (!oPlayer) return
        if (event.attacker.GetModelName() != "models/heroes/meepo/meepo.vmdl") return

        print("===meepo_ransack===modifier_stackcount:", this.GetStackCount())
        const addsh = this.GetAbility().GetSpecialValueFor("addsh")
        this.SetStackCount(this.GetStackCount() + addsh)
    }
}


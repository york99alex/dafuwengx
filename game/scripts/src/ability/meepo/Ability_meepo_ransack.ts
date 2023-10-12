
import { BaseModifier, registerAbility, registerModifier } from "../../utils/dota_ts_adapter";
import { TSBaseAbility } from "../tsBaseAbilty";

/**
    "DOTA_Tooltip_ability_Ability_meepo_ransack"					    "洗劫"
    "DOTA_Tooltip_ability_Ability_meepo_ransack_Description"			"每次攻击从敌人身体汲取神秘的能量，以永久提升忽悠伤害"
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
        return "modifier_meepo_ransack"
    }
}

@registerModifier()
export class modifier_meepo_ransack extends BaseModifier {

    IsPassive(): boolean {
        return true
    }

    IsHidden(): boolean {
        return false
    }

    IsPurgable(): boolean {
        return false
    }

    OnAttackLanded(event: ModifierAttackEvent): void {
        const oPlayer = GameRules.PlayerManager.getPlayer(event.attacker.GetPlayerOwnerID())
        if (!oPlayer) return

        const addsh = this.GetAbility().GetSpecialValueFor("addsh")
        this.SetStackCount(this.GetStackCount() + addsh)
    }
}


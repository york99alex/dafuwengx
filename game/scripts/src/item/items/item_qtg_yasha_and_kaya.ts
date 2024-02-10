import { BaseModifier, registerAbility, registerModifier } from '../../utils/dota_ts_adapter';
import { TSBaseItem } from '../tsBaseItem';

/**
 * 慧夜对剑，3000
 * bonus_intellect 16	spell_amp 16	spell_lifesteal_amp 30
 * bonus_agility 16	bonus_attack_speed 12	movement_speed_percent_bonus 10
 */
@registerAbility()
export class item_qtg_yasha_and_kaya extends TSBaseItem {
    GetIntrinsicModifierName() {
        return this.GetAbilityName() + '_modifier';
    }
}

@registerModifier()
export class item_qtg_yasha_and_kaya_modifier extends BaseModifier {
    IsHidden(): boolean {
        return true;
    }
    IsPurgable(): boolean {
        return false;
    }
    GetAttributes(): ModifierAttribute {
        return ModifierAttribute.MULTIPLE;
    }
    DeclareFunctions(): ModifierFunction[] {
        return [
            ModifierFunction.STATS_INTELLECT_BONUS,
            ModifierFunction.SPELL_AMPLIFY_PERCENTAGE_UNIQUE,
            ModifierFunction.SPELL_LIFESTEAL_AMPLIFY_PERCENTAGE,
            ModifierFunction.STATS_AGILITY_BONUS,
            ModifierFunction.ATTACKSPEED_BONUS_CONSTANT,
            ModifierFunction.MOVESPEED_BONUS_PERCENTAGE_UNIQUE,
        ];
    }
    GetModifierBonusStats_Intellect(): number {
        return this.GetAbility().GetSpecialValueFor('bonus_intellect');
    }
    GetModifierSpellAmplify_PercentageUnique(): number {
        return this.GetAbility().GetSpecialValueFor('spell_amp');
    }
    GetModifierSpellLifestealRegenAmplify_Percentage(): number {
        return this.GetAbility().GetSpecialValueFor('spell_lifesteal_amp');
    }
    GetModifierBonusStats_Agility(): number {
        return this.GetAbility().GetSpecialValueFor('bonus_agility');
    }
    GetModifierAttackSpeedBonus_Constant(): number {
        return this.GetAbility().GetSpecialValueFor('bonus_attack_speed');
    }
    GetModifierMoveSpeedBonus_Percentage_Unique(): number {
        return this.GetAbility().GetSpecialValueFor('movement_speed_percent_bonus');
    }
}

import { BaseModifier, registerAbility, registerModifier } from '../../utils/dota_ts_adapter';
import { TSBaseItem } from '../tsBaseItem';

/**
 * 慧光，1500，16智力，10%技能增强，24%技能吸血增强
 * bonus_intellect 16	spell_amp 10	spell_lifesteal_amp 24
 */
@registerAbility()
export class item_qtg_kaya extends TSBaseItem {
    GetIntrinsicModifierName() {
        return this.GetAbilityName() + '_modifier';
    }
}

@registerModifier()
export class item_qtg_kaya_modifier extends BaseModifier {
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
}

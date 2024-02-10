import { IsValid } from '../../utils/amhc';
import { BaseModifier, registerAbility, registerModifier } from '../../utils/dota_ts_adapter';
import { TSBaseItem } from '../tsBaseItem';

/**
 * 散慧对剑，3000
 * bonus_intellect 16	spell_amp 16	spell_lifesteal_amp 30
 * bonus_strength 16	slow_resistance 20	regen_amp 20
 */
@registerAbility()
export class item_qtg_kaya_and_sange extends TSBaseItem {
    GetIntrinsicModifierName() {
        return this.GetAbilityName() + '_modifier';
    }
}

@registerModifier()
export class item_qtg_kaya_and_sange_modifier extends BaseModifier {
    regen_amp: number;
    eventID: number;
    IsHidden(): boolean {
        return true;
    }
    IsPurgable(): boolean {
        return false;
    }
    OnCreated(params: object): void {
        this.regen_amp = this.GetAbility().GetSpecialValueFor('regen_amp');

        if (!IsServer()) return;
        this.eventID = GameRules.EventManager.Register(
            'Event_ItemHuiXueByRound',
            (event: { entity: CDOTA_BaseNPC; nHuiXue: number }) => {
                if (event.entity == this.GetCaster()) {
                    if (!this.GetAbility() || !IsValid(this) || !IsValid(this.GetAbility())) return true;
                    const item = event.entity.FindItemInInventory('item_qtg_sange_and_yasha');
                    if (item && !item.IsNull() && item.IsActivated()) return;
                    event.nHuiXue *= (100 + this.regen_amp) / 100;
                }
            },
            this,
            EventOrder.REGEN_AMP_SANGE_YASHA
        );
    }
    OnDestroy(): void {
        if (!IsServer()) return;
        GameRules.EventManager.UnRegisterByID(this.eventID);
        this.eventID = null;
    }
    GetAttributes(): ModifierAttribute {
        return ModifierAttribute.MULTIPLE;
    }
    DeclareFunctions(): ModifierFunction[] {
        return [
            ModifierFunction.STATS_INTELLECT_BONUS,
            ModifierFunction.SPELL_AMPLIFY_PERCENTAGE_UNIQUE,
            ModifierFunction.SPELL_LIFESTEAL_AMPLIFY_PERCENTAGE,
            ModifierFunction.STATS_STRENGTH_BONUS,
            ModifierFunction.SLOW_RESISTANCE,
            ModifierFunction.HEAL_AMPLIFY_PERCENTAGE_SOURCE,
            ModifierFunction.HP_REGEN_AMPLIFY_PERCENTAGE,
            ModifierFunction.LIFESTEAL_AMPLIFY_PERCENTAGE,
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
    GetModifierBonusStats_Strength(): number {
        return this.GetAbility().GetSpecialValueFor('bonus_strength');
    }
    GetModifierSlowResistance(): number {
        return this.GetAbility().GetSpecialValueFor('slow_resistance');
    }
    GetModifierHealAmplify_PercentageSource(): number {
        return this.regen_amp;
    }
    GetModifierHPRegenAmplify_Percentage(): number {
        return this.regen_amp;
    }
    GetModifierLifestealRegenAmplify_Percentage(): number {
        return this.regen_amp;
    }
}

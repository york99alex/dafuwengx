import { IsValid } from '../../utils/amhc';
import { BaseModifier, registerAbility, registerModifier } from '../../utils/dota_ts_adapter';
import { TSBaseItem } from '../tsBaseItem';

/**
 * 散华，1500，16力量，15%减速抗性，15%回复增强
 * bonus_strength 16	slow_resistance 15	regen_amp 15
 */
@registerAbility()
export class item_qtg_sange extends TSBaseItem {
    GetIntrinsicModifierName() {
        return this.GetAbilityName() + '_modifier';
    }
}

@registerModifier()
export class item_qtg_sange_modifier extends BaseModifier {
    bonus_strength: number;
    slow_resistance: number;
    regen_amp: number;
    eventID: number;
    IsHidden(): boolean {
        return true;
    }
    IsPurgable(): boolean {
        return false;
    }
    OnCreated(params: object): void {
        if (!IsValid(this)) return;
        if (!IsValid(this.GetAbility())) return;
        this.bonus_strength = this.GetAbility().GetSpecialValueFor('bonus_strength');
        this.slow_resistance = this.GetAbility().GetSpecialValueFor('slow_resistance');
        this.regen_amp = this.GetAbility().GetSpecialValueFor('regen_amp');

        if (!IsServer()) return;
        this.eventID = GameRules.EventManager.Register(
            'Event_ItemHuiXueByRound',
            (event: { entity: CDOTA_BaseNPC; nHuiXue: number }) => {
                if (event.entity == this.GetCaster()) {
                    if (!this.GetAbility() || !IsValid(this) || !IsValid(this.GetAbility())) return true;
                    let item = event.entity.FindItemInInventory('item_qtg_kaya_and_sange');
                    if (item && !item.IsNull() && item.IsActivated()) return;
                    item = event.entity.FindItemInInventory('item_qtg_sange_and_yasha');
                    if (item && !item.IsNull() && item.IsActivated()) return;
                    event.nHuiXue *= (100 + this.regen_amp) / 100;
                }
            },
            this,
            EventOrder.REGEN_AMP_SANGE
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
            ModifierFunction.STATS_STRENGTH_BONUS,
            ModifierFunction.SLOW_RESISTANCE,
            ModifierFunction.HEAL_AMPLIFY_PERCENTAGE_SOURCE,
            ModifierFunction.HP_REGEN_AMPLIFY_PERCENTAGE,
            ModifierFunction.LIFESTEAL_AMPLIFY_PERCENTAGE,
            ModifierFunction.SPELL_LIFESTEAL_AMPLIFY_PERCENTAGE,
        ];
    }
    GetModifierBonusStats_Strength(): number {
        return this.bonus_strength;
    }
    GetModifierSlowResistance(): number {
        return this.slow_resistance;
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
    GetModifierSpellLifestealRegenAmplify_Percentage(): number {
        return this.regen_amp;
    }
}

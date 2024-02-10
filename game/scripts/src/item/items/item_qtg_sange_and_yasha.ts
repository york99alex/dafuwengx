import { IsValid } from '../../utils/amhc';
import { BaseModifier, registerAbility, registerModifier } from '../../utils/dota_ts_adapter';
import { TSBaseItem } from '../tsBaseItem';

/**
 * 散夜对剑
 * bonus_strength 16	slow_resistance 20	regen_amp 20
 * bonus_agility 16	bonus_attack_speed 12	movement_speed_percent_bonus 10
 */
@registerAbility()
export class item_qtg_sange_and_yasha extends TSBaseItem {
    GetIntrinsicModifierName() {
        return this.GetAbilityName() + '_modifier';
    }
}

@registerModifier()
export class item_qtg_sange_and_yasha_modifier extends BaseModifier {
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
        this.regen_amp = this.GetAbility().GetSpecialValueFor('regen_amp');

        if (!IsServer()) return;
        this.eventID = GameRules.EventManager.Register(
            'Event_ItemHuiXueByRound',
            (event: { entity: CDOTA_BaseNPC; nHuiXue: number }) => {
                if (event.entity == this.GetCaster()) {
                    if (!this.GetAbility() || !IsValid(this) || !IsValid(this.GetAbility())) return true;
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
            ModifierFunction.STATS_STRENGTH_BONUS,
            ModifierFunction.SLOW_RESISTANCE,
            ModifierFunction.HEAL_AMPLIFY_PERCENTAGE_SOURCE,
            ModifierFunction.HP_REGEN_AMPLIFY_PERCENTAGE,
            ModifierFunction.LIFESTEAL_AMPLIFY_PERCENTAGE,
            ModifierFunction.SPELL_LIFESTEAL_AMPLIFY_PERCENTAGE,
            ModifierFunction.STATS_AGILITY_BONUS,
            ModifierFunction.ATTACKSPEED_BONUS_CONSTANT,
            ModifierFunction.MOVESPEED_BONUS_PERCENTAGE_UNIQUE,
        ];
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
    GetModifierSpellLifestealRegenAmplify_Percentage(): number {
        return this.regen_amp;
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

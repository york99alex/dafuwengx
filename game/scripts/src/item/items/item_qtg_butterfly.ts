import { TSBaseItem } from '../tsBaseItem';
import { IsValid } from '../../utils/amhc';
import { BaseModifier, registerAbility, registerModifier } from '../../utils/dota_ts_adapter';
import { ParaAdjuster } from '../../utils/paraadjuster';

/**
 * 蝴蝶，3500，2500+1000，10%移速，30%减速抗性
 * bonus_agility 25	attack_speed_pct 20	bonus_damage 20
 * bonus_movespeed_pct 10	slow_resistance 30
 */
@registerAbility()
export class item_qtg_butterfly extends TSBaseItem {
    IsPassive(): boolean {
        return true;
    }
    GetIntrinsicModifierName() {
        return this.GetAbilityName() + '_modifier';
    }
}

@registerModifier()
export class item_qtg_butterfly_modifier extends BaseModifier {
    bonus_agility: number;
    attack_speed_pct: number;
    bonus_damage: number;
    bonus_movespeed_pct: number;
    slow_resistance: number;
    IsHidden(): boolean {
        return true;
    }
    IsPurgable(): boolean {
        return false;
    }
    OnCreated(params: object): void {
        if (!IsValid(this)) return;
        if (!IsValid(this.GetAbility())) return;

        this.bonus_agility = this.GetAbility().GetSpecialValueFor('bonus_agility');
        this.attack_speed_pct = this.GetAbility().GetSpecialValueFor('attack_speed_pct');
        this.bonus_damage = this.GetAbility().GetSpecialValueFor('bonus_damage');
        this.bonus_movespeed_pct = this.GetAbility().GetSpecialValueFor('bonus_movespeed_pct');
        this.slow_resistance = this.GetAbility().GetSpecialValueFor('slow_resistance');

        const parent = this.GetParent();
        if (parent.IsRealHero()) ParaAdjuster.ModifyMana(parent);
    }
    OnDestroy(): void {
        const parent = this.GetParent();
        if (parent.IsRealHero()) ParaAdjuster.ModifyMana(parent);
    }
    GetAttributes(): ModifierAttribute {
        return ModifierAttribute.MULTIPLE;
    }
    DeclareFunctions(): ModifierFunction[] {
        return [
            ModifierFunction.STATS_AGILITY_BONUS,
            ModifierFunction.ATTACKSPEED_PERCENTAGE,
            ModifierFunction.PREATTACK_BONUS_DAMAGE,
            ModifierFunction.MOVESPEED_BONUS_PERCENTAGE,
            ModifierFunction.SLOW_RESISTANCE,
        ];
    }
    GetModifierBonusStats_Agility(): number {
        return this.bonus_agility;
    }
    GetModifierAttackSpeedPercentage(): number {
        return this.attack_speed_pct;
    }
    GetModifierPreAttack_BonusDamage(): number {
        return this.bonus_damage;
    }
    GetModifierMoveSpeedBonus_Percentage(): number {
        return this.bonus_movespeed_pct;
    }
    GetModifierSlowResistance(): number {
        return this.slow_resistance;
    }
}

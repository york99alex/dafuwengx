import { IsValid } from '../../utils/amhc';
import { BaseModifier, registerAbility, registerModifier } from '../../utils/dota_ts_adapter';
import { TSBaseItem } from '../tsBaseItem';

/**
 * 夜叉，1500，16敏捷，10攻速，7%移速
 * bonus_agility 16	bonus_attack_speed 10	movement_speed_percent_bonus 7
 */
@registerAbility()
export class item_qtg_yasha extends TSBaseItem {
    GetIntrinsicModifierName() {
        return this.GetAbilityName() + '_modifier';
    }
}

@registerModifier()
export class item_qtg_yasha_modifier extends BaseModifier {
    bonus_agility: number;
    bonus_attack_speed: number;
    movement_speed_percent_bonus: number;
    IsHidden(): boolean {
        return true;
    }
    OnCreated(params: object): void {
        if (!IsValid(this)) return;
        if (!IsValid(this.GetAbility())) return;
        this.bonus_agility = this.GetAbility().GetSpecialValueFor('bonus_agility');
        this.bonus_attack_speed = this.GetAbility().GetSpecialValueFor('bonus_attack_speed');
        this.movement_speed_percent_bonus = this.GetAbility().GetSpecialValueFor('movement_speed_percent_bonus');
    }
    GetAttributes(): ModifierAttribute {
        return ModifierAttribute.MULTIPLE;
    }
    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.STATS_AGILITY_BONUS, ModifierFunction.ATTACKSPEED_BONUS_CONSTANT, ModifierFunction.MOVESPEED_BONUS_PERCENTAGE_UNIQUE];
    }
    GetModifierBonusStats_Agility(): number {
        return this.bonus_agility;
    }
    GetModifierAttackSpeedBonus_Constant(): number {
        return this.bonus_attack_speed;
    }
    GetModifierMoveSpeedBonus_Percentage_Unique(): number {
        return this.movement_speed_percent_bonus;
    }
}

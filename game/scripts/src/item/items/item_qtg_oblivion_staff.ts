import { TSBaseItem } from '../tsBaseItem';
import { IsValid } from '../../utils/amhc';
import { BaseModifier, registerAbility, registerModifier } from '../../utils/dota_ts_adapter';
import { ParaAdjuster } from '../../utils/paraadjuster';

/**
 * 空明杖，1500，1000短棍+500法师长袍，10攻速，15攻击力，10智力
 * bonus_damage 15	bonus_intellect 10	bonus_attack_speed 10
 */
@registerAbility()
export class item_qtg_oblivion_staff extends TSBaseItem {
    IsPassive(): boolean {
        return true;
    }
    GetIntrinsicModifierName() {
        return this.GetAbilityName() + '_modifier';
    }
}

@registerModifier()
export class item_qtg_oblivion_staff_modifier extends BaseModifier {
    bonus_damage: number;
    bonus_intellect: number;
    bonus_attack_speed: number;
    IsHidden(): boolean {
        return true;
    }
    IsPurgable(): boolean {
        return false;
    }
    OnCreated(params: object): void {
        if (!IsValid(this)) return;
        if (!IsValid(this.GetAbility())) return;

        this.bonus_damage = this.GetAbility().GetSpecialValueFor('bonus_damage');
        this.bonus_intellect = this.GetAbility().GetSpecialValueFor('bonus_intellect');
        this.bonus_attack_speed = this.GetAbility().GetSpecialValueFor('bonus_attack_speed');

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
        return [ModifierFunction.PREATTACK_BONUS_DAMAGE, ModifierFunction.STATS_INTELLECT_BONUS, ModifierFunction.ATTACKSPEED_BONUS_CONSTANT];
    }
    GetModifierPreAttack_BonusDamage(): number {
        return this.bonus_damage;
    }
    GetModifierBonusStats_Intellect(): number {
        return this.bonus_intellect;
    }
    GetModifierAttackSpeedBonus_Constant(): number {
        return this.bonus_attack_speed;
    }
}

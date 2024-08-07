import { TSBaseItem } from '../tsBaseItem';
import { AMHC, IsValid } from '../../utils/amhc';
import { BaseModifier, registerAbility, registerModifier } from '../../utils/dota_ts_adapter';
import { ParaAdjuster } from '../../utils/paraadjuster';

/**
 * 英灵胸针，5500，3000巫师之刃+2500神秘法杖
 * bonus_attack_speed 40	bonus_intellect 45	bonus_armor 8	bonus_damage 10	bonus_project_speed 300
 * 每次攻击附带造成70%的智力值
 * attack_intell 70
 */
@registerAbility()
export class item_qtg_revenants_brooch extends TSBaseItem {
    IsPassive(): boolean {
        return true;
    }
    GetIntrinsicModifierName() {
        return this.GetAbilityName() + '_modifier';
    }
}

@registerModifier()
export class item_qtg_revenants_brooch_modifier extends BaseModifier {
    bonus_attack_speed: number;
    bonus_intellect: number;
    bonus_armor: number;
    bonus_damage: number;
    bonus_project_speed: number;
    attack_intell: number;
    IsHidden(): boolean {
        return true;
    }
    IsPurgable(): boolean {
        return false;
    }
    OnCreated(params: object): void {
        if (!IsValid(this)) return;
        if (!IsValid(this.GetAbility())) return;

        this.bonus_attack_speed = this.GetAbility().GetSpecialValueFor('bonus_attack_speed');
        this.bonus_intellect = this.GetAbility().GetSpecialValueFor('bonus_intellect');
        this.bonus_armor = this.GetAbility().GetSpecialValueFor('bonus_armor');
        this.bonus_damage = this.GetAbility().GetSpecialValueFor('bonus_damage');
        this.bonus_project_speed = this.GetAbility().GetSpecialValueFor('bonus_project_speed');
        this.attack_intell = this.GetAbility().GetSpecialValueFor('attack_intell');

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
            ModifierFunction.ATTACKSPEED_BONUS_CONSTANT,
            ModifierFunction.STATS_INTELLECT_BONUS,
            ModifierFunction.PHYSICAL_ARMOR_BONUS,
            ModifierFunction.PREATTACK_BONUS_DAMAGE,
            ModifierFunction.PROJECTILE_SPEED_BONUS,
            ModifierFunction.ON_ATTACK_LANDED,
        ];
    }
    GetModifierAttackSpeedBonus_Constant(): number {
        return this.bonus_attack_speed;
    }
    GetModifierBonusStats_Intellect(): number {
        return this.bonus_intellect;
    }
    GetModifierPhysicalArmorBonus(event: ModifierAttackEvent): number {
        return this.bonus_armor;
    }
    GetModifierPreAttack_BonusDamage(): number {
        return this.bonus_damage;
    }
    GetModifierProjectileSpeedBonus(): number {
        return this.bonus_project_speed;
    }
    OnAttackLanded(event: ModifierAttackEvent): void {
        // 命中后产生回血，无视折光，但是受闪避影响
        if (event.attacker != this.GetParent()) return;
        if (event.attacker.IsRealHero()) {
            AMHC.Damage(
                event.attacker,
                event.target,
                (event.attacker.GetIntellect() * this.attack_intell) / 100,
                DamageTypes.MAGICAL,
                this.GetAbility()
            );
        } else {
        }
    }
}

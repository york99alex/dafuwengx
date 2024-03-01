import { TSBaseItem } from '../tsBaseItem';
import { AMHC } from '../../utils/amhc';
import { BaseModifier, registerAbility, registerModifier } from '../../utils/dota_ts_adapter';
import { ParaAdjuster } from '../../utils/paraadjuster';

/**
 * 黯灭，2500，大剑1500+攻击之爪500+枯萎之石500，30攻击力
 * bonus_damage 30  corruption_armor -6	corruption_duration 2.0
 */
@registerAbility()
export class item_qtg_desolator extends TSBaseItem {
    GetIntrinsicModifierName() {
        return this.GetAbilityName() + '_modifier';
    }
}

@registerModifier()
export class item_qtg_desolator_modifier extends BaseModifier {
    corruption_duration: number;
    IsHidden(): boolean {
        return true;
    }
    IsPurgable(): boolean {
        return false;
    }
    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.PREATTACK_BONUS_DAMAGE, ModifierFunction.ON_ATTACK_LANDED];
    }
    GetModifierPreAttack_BonusDamage(): number {
        return this.GetAbility().GetSpecialValueFor('bonus_damage');
    }
    OnAttackLanded(event: ModifierAttackEvent): void {
        if (IsServer()) {
            if (event.attacker == this.GetParent()) {
                this.corruption_duration = this.GetAbility().GetSpecialValueFor('corruption_duration');
                AMHC.AddNewModifier(event.target, event.attacker, this.GetAbility(), modifier_item_qtg_desolator_buff.name, {
                    duration: this.corruption_duration,
                });
            }
        }
    }
}

/**枯萎之石debuff */
@registerModifier()
export class modifier_item_qtg_desolator_buff extends BaseModifier {
    IsHidden(): boolean {
        return false;
    }
    IsDebuff(): boolean {
        return true;
    }
    IsPurgable(): boolean {
        return true;
    }
    OnCreated(params: object): void {
        if (this.GetParent().IsRealHero()) ParaAdjuster.ModifyMana(this.GetParent() as CDOTA_BaseNPC_Hero);
    }
    OnRefresh(params: object): void {
        if (this.GetParent().IsRealHero()) ParaAdjuster.ModifyMana(this.GetParent() as CDOTA_BaseNPC_Hero);
    }
    OnDestroy(): void {
        if (this.GetParent().IsRealHero()) ParaAdjuster.ModifyMana(this.GetParent() as CDOTA_BaseNPC_Hero);
    }
    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.PHYSICAL_ARMOR_BONUS];
    }
    GetModifierPhysicalArmorBonus(): number {
        return this.GetAbility().GetSpecialValueFor('corruption_armor');
    }
}

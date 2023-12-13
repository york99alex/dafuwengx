import { TSBaseItem } from '../tsBaseItem';
import { AMHC } from '../../utils/amhc';
import { BaseModifier, registerAbility, registerModifier } from '../../utils/dota_ts_adapter';
import { ParaAdjuster } from '../../utils/paraadjuster';

/**
 * 枯萎之石，500，debuff-3甲，持续2秒
 * corruption_armor -3	corruption_duration 2.0
 */
@registerAbility()
export class item_qtg_blight_stone extends TSBaseItem {
    GetIntrinsicModifierName() {
        return this.GetAbilityName() + '_modifier';
    }
}

@registerModifier()
export class item_qtg_blight_stone_modifier extends BaseModifier {
    corruption_duration: number;
    IsHidden(): boolean {
        return true;
    }
    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.ON_ATTACK_LANDED];
    }
    OnAttackLanded(event: ModifierAttackEvent): void {
        if (IsServer()) {
            if (event.attacker == this.GetParent()) {
                this.corruption_duration = this.GetAbility().GetSpecialValueFor('corruption_duration');
                AMHC.AddNewModifier(event.target, event.attacker, this.GetAbility(), modifier_item_qtg_blight_stone_buff.name, {
                    duration: this.corruption_duration,
                });
            }
        }
    }
}

/**枯萎之石debuff */
@registerModifier()
export class modifier_item_qtg_blight_stone_buff extends BaseModifier {
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

import { TSBaseItem } from '../tsBaseItem';
import { IsValid } from '../../utils/amhc';
import { BaseModifier, registerAbility, registerModifier } from '../../utils/dota_ts_adapter';

/**
 * 圣剑，6000，3500+2500，350攻击力，25%技能增强
 * bonus_damage 350	bonus_spell_amp 25
 */
@registerAbility()
export class item_qtg_rapier extends TSBaseItem {
    IsPassive(): boolean {
        return true;
    }
    GetIntrinsicModifierName() {
        return this.GetAbilityName() + '_modifier';
    }
}

@registerModifier()
export class item_qtg_rapier_modifier extends BaseModifier {
    bonus_damage: number;
    bonus_spell_amp: number;

    IsHidden(): boolean {
        return true;
    }
    OnCreated(params: object): void {
        if (!IsValid(this)) return;
        if (!IsValid(this.GetAbility())) return;

        this.bonus_damage = this.GetAbility().GetSpecialValueFor('bonus_damage');
        this.bonus_spell_amp = this.GetAbility().GetSpecialValueFor('bonus_spell_amp');

        // 圣剑掉落和捡起事件写在Player.onEvent_PlayerDie
    }
    GetAttributes(): ModifierAttribute {
        return ModifierAttribute.MULTIPLE;
    }
    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.PREATTACK_BONUS_DAMAGE, ModifierFunction.SPELL_AMPLIFY_PERCENTAGE];
    }
    GetModifierPreAttack_BonusDamage(): number {
        return this.bonus_damage;
    }
    GetModifierSpellAmplify_Percentage(event: ModifierAttackEvent): number {
        return this.bonus_spell_amp;
    }
}

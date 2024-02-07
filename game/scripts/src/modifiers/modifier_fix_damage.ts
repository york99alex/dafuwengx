import { GetIgnoreMagicResistanceValue } from '../ability/common';
import { BaseModifier, registerModifier } from '../utils/dota_ts_adapter';

@registerModifier()
export class modifier_fix_damage extends BaseModifier {
    IsHidden(): boolean {
        return true;
    }
    IsDebuff(): boolean {
        return false;
    }
    IsPurgable(): boolean {
        return false;
    }
    IsPurgeException(): boolean {
        return false;
    }
    AllowIllusionDuplicate(): boolean {
        return false;
    }
    RemoveOnDeath(): boolean {
        return false;
    }
    DestroyOnExpire(): boolean {
        return false;
    }
    IsPermanent(): boolean {
        return true;
    }
    DeclareFunctions(): ModifierFunction[] {
        return [
            // ModifierFunction.INCOMING_DAMAGE_PERCENTAGE,
            ModifierFunction.INCOMING_SPELL_DAMAGE_CONSTANT,
            // ModifierFunction.TOTALDAMAGEOUTGOING_PERCENTAGE
            // ModifierFunction.PHYSICAL_CONSTANT_BLOCK
        ];
    }
    // GetModifierIncomingDamage_Percentage(event: ModifierAttackEvent): number {
    //     let percent = 100
    //     if (event.damage_type = DamageTypes.PHYSICAL) {
    //         if (event.attacker) {
    //             // percent *=
    //         }
    //     }
    //     return 100
    // }
    GetModifierIncomingSpellDamageConstant(event: ModifierAttackEvent): number {
        // 无视魔法抗性效果
        if (event.attacker && event.damage_type == DamageTypes.MAGICAL) {
            const magicalArmor = this.GetParent().Script_GetMagicalArmorValue(false, null);
            print('INCOMING_SPELL_DAMAGE_CONSTANT===magicalArmor:', magicalArmor);
            const value = GetIgnoreMagicResistanceValue(event.attacker);
            print('INCOMING_SPELL_DAMAGE_CONSTANT===value:', value);
            const ignore = math.max(magicalArmor, 0) - math.max(magicalArmor - value, 0);
            print('INCOMING_SPELL_DAMAGE_CONSTANT===ignore:', ignore);
            const actualMagicalArmor = magicalArmor - ignore;
            print('INCOMING_SPELL_DAMAGE_CONSTANT===actualMagicalArmor:', actualMagicalArmor);
            const factor = (1 - actualMagicalArmor) / (1 - magicalArmor);
            print('INCOMING_SPELL_DAMAGE_CONSTANT===factor:', factor);
            print('INCOMING_SPELL_DAMAGE_CONSTANT===result:', event.original_damage * (factor - 1));
            return event.original_damage * (factor - 1);
        }
    }
    // GetModifierPhysical_ConstantBlock(event: ModifierAttackEvent): number {
    //     return 0
    // }
}

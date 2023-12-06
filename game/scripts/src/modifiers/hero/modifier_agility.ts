import { Constant } from '../../mode/constant';
import { CDOTA_BaseNPC_BZ } from '../../player/CDOTA_BaseNPC_BZ';
import { BaseModifier, registerModifier } from '../../utils/dota_ts_adapter';

@registerModifier()
export class modifier_agility extends BaseModifier {
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

    DestroyOnExpire(): boolean {
        return false;
    }

    OnStackCountChanged(stackCount: number): void {
        if (IsServer()) {
            const hParent = this.GetParent() as CDOTA_BaseNPC_BZ;
            const nNewStackCount = this.GetStackCount();
            const nChanged = nNewStackCount - stackCount;

            if (hParent.GetPrimaryAttribute() == Attributes.AGILITY) {
                const nValue = nChanged * Constant.ATTRIBUTE.PRIMARY_ATTACK_DAMAGE;
                hParent.SetBaseDamageMax(hParent.GetBaseDamageMax() + nValue);
                hParent.SetBaseDamageMin(hParent.GetBaseDamageMin() + nValue);
            }
        }
    }

    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.ATTACKSPEED_BONUS_CONSTANT, ModifierFunction.PHYSICAL_ARMOR_BONUS];
    }

    GetModifierAttackSpeedBonus_Constant(): number {
        return Constant.ATTRIBUTE.AGILITY_ATTACK_SPEED * this.GetStackCount();
    }

    GetModifierPhysicalArmorBonus(event: ModifierAttackEvent): number {
        return Constant.ATTRIBUTE.AGILITY_PHYSICAL_ARMOR * this.GetStackCount();
    }
}

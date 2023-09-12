import { Constant } from "../../mode/constant";
import { BaseModifier, registerModifier } from "../../utils/dota_ts_adapter";

@registerModifier()
class modifier_intellect extends BaseModifier {

    IsHidden(): boolean {
        return true
    }

    IsDebuff(): boolean {
        return false
    }

    IsPurgable(): boolean {
        return false
    }

    IsPurgeException(): boolean {
        return false
    }

    AllowIllusionDuplicate(): boolean {
        return false
    }

    DestroyOnExpire(): boolean {
        return false
    }

    OnStackCountChanged(stackCount: number): void {
        if (IsServer()) {
            const hParent = this.GetParent() as CDOTA_BaseNPC_Hero
            const nNewStackCount = this.GetStackCount()
            const nChanged = nNewStackCount - stackCount

            if (hParent.GetPrimaryAttribute() == Attributes.INTELLECT) {
                const nValue = nChanged * Constant.ATTRIBUTE.PRIMARY_ATTACK_DAMAGE
                hParent.SetBaseDamageMax(hParent.GetBaseDamageMax() + nValue)
                hParent.SetBaseDamageMin(hParent.GetBaseDamageMin() + nValue)
            }
        }
    }

    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.MAGICAL_RESISTANCE_BONUS]
    }
    GetModifierMagicalResistanceBonus(event: ModifierAttackEvent): number {
        return Constant.ATTRIBUTE.INTELLIGENCE_MAGICAL_RESISTANCE * this.GetStackCount()
    }
}
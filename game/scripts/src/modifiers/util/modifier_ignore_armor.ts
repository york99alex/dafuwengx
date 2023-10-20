import { AddModifierEvents } from "../../ability/common";
import { BaseModifier, registerModifier } from "../../utils/dota_ts_adapter";

@registerModifier()
export class modifier_ignore_armor_debuff extends BaseModifier {
    ignore_armor: number
    ignore_armor_base: number
    ignore_armor_bonus: number
    armor_reduction: number
    IsHidden(): boolean {
        return true
    }
    IsDebuff(): boolean {
        return true
    }
    IsPurgable(): boolean {
        return false
    }
    IsPurgeException(): boolean {
        return false
    }
    IsStunDebuff(): boolean {
        return false
    }
    AllowIllusionDuplicate(): boolean {
        return false
    }
    RemoveOnDeath(): boolean {
        return false
    }
    OnCreated(params: object): void {
        this.ignore_armor = this.GetAbility().GetSpecialValueFor("ignore_armor") * 0.01
        this.ignore_armor_base = this.GetAbility().GetSpecialValueFor("ignore_armor_base") * 0.01
        this.ignore_armor_bonus = this.GetAbility().GetSpecialValueFor("ignore_armor_bonus") * 0.01
        if (this.ignore_armor) {
            this.armor_reduction = -math.max(this.GetParent().GetPhysicalArmorValue(false) * this.ignore_armor, 0)
        } else {
            this.armor_reduction = -math.max(this.GetParent().GetPhysicalArmorBaseValue() * this.ignore_armor_base
                + this.GetParent().GetPhysicalArmorValue(true) * this.ignore_armor_bonus, 0)
        }
    }
    DeclareFunctions(): ModifierFunction[] {
        return [
            ModifierFunction.PHYSICAL_ARMOR_BONUS,
            ModifierFunction.ON_TAKEDAMAGE
        ]
    }
    GetModifierPhysicalArmorBonus(event: ModifierAttackEvent): number {
        return this.armor_reduction
    }
    OnTakeDamage(event: ModifierInstanceEvent): void {
        if (event.unit == this.GetParent() && event.damage_category == DamageCategory.ATTACK) {
            this.Destroy
        }
    }
}

@registerModifier()
export class modifier_ignore_armor extends BaseModifier {
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
    IsStunDebuff(): boolean {
        return false
    }
    AllowIllusionDuplicate(): boolean {
        return false
    }
    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.ON_ATTACK_LANDED]
    }
    OnAttackLanded(event: ModifierAttackEvent): void {
        if (event.target == null) return
        if (event.attacker == this.GetParent()) {
            event.target.AddNewModifier(event.attacker, this.GetAbility(), modifier_ignore_armor_debuff.name, { duration: 1 / 30 })
        }
    }
}
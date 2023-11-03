import { AHMC } from "../../utils/amhc";
import { BaseModifier, registerModifier } from "../../utils/dota_ts_adapter";
import { ParaAdjuster } from "../../utils/paraadjuster";

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
        print("modifier_ignore_armor_debuff===OnCreated")
        this.ignore_armor = this.GetAbility().GetSpecialValueFor("ignore_armor") * 0.01
        this.ignore_armor_base = this.GetAbility().GetSpecialValueFor("ignore_armor_base") * 0.01
        this.ignore_armor_bonus = this.GetAbility().GetSpecialValueFor("ignore_armor_bonus") * 0.01
        print("modifier_ignore_armor_debuff===ignore_armor", this.ignore_armor)
        print("modifier_ignore_armor_debuff===ignore_armor_base", this.ignore_armor_base)
        print("modifier_ignore_armor_debuff===ignore_armor_bonus", this.ignore_armor_bonus)
        print("modifier_ignore_armor_debuff===armor_before", this.GetParent().GetPhysicalArmorValue(false))
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
        print("modifier_ignore_armor_debuff===armor_reduction", this.armor_reduction)
        return this.armor_reduction
    }
    OnTakeDamage(event: ModifierInstanceEvent): void {
        print("modifier_ignore_armor_debuff===armor_OnTakeDamage", this.GetParent().GetPhysicalArmorValue(false))
        if (event.unit == this.GetParent() && event.damage_category == DamageCategory.ATTACK) {
            print("OnTakeDamage Destroy Before:", event.unit.GetUnitName(), event.unit.GetMaxMana())
            this.Destroy()
            if (event.unit.IsRealHero()) {
                ParaAdjuster.ModifyMana(event.unit)
            }
            Timers.CreateTimer(0.01, () => {
                print("OnTakeDamage Destroy After 0.01:", event.unit.GetUnitName(), event.unit.GetMaxMana())
            })
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
            AHMC.AddNewModifier(event.target, event.attacker, this.GetAbility(), modifier_ignore_armor_debuff.name, { duration: 1 / 30 })
        }
    }
}
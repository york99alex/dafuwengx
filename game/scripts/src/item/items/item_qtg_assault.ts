import { TSBaseItem } from '../tsBaseItem';
import { IsValid } from '../../utils/amhc';
import { BaseModifier, registerAbility, registerModifier } from '../../utils/dota_ts_adapter';
import { ParaAdjuster } from '../../utils/paraadjuster';
import { HERO_TO_BZ } from '../../constants/constant';

/**
 * 强袭胸甲，5000，1500板甲+1500板甲+2000振奋，60攻速+20甲，光环-10点甲
 * bonus_attack_speed 60	bonus_armor 25	range 400	aura_negative_armor -10
 * 添加400码范围光环，降低敌人-10点甲
 */
@registerAbility()
export class item_qtg_assault extends TSBaseItem {
    IsPassive(): boolean {
        return true;
    }
    GetCastRange(location: Vector, target: CDOTA_BaseNPC): number {
        return this.GetSpecialValueFor('range');
    }
    GetIntrinsicModifierName() {
        return this.GetAbilityName() + '_modifier';
    }
}

@registerModifier()
export class item_qtg_assault_modifier extends BaseModifier {
    bonus_attack_speed: number;
    bonus_armor: number;
    range: number;
    eventID: number;
    IsHidden(): boolean {
        return true;
    }
    OnCreated(params: object): void {
        if (!IsValid(this)) return;
        if (!IsValid(this.GetAbility())) return;
        this.bonus_attack_speed = this.GetAbility().GetSpecialValueFor('bonus_attack_speed');
        this.bonus_armor = this.GetAbility().GetSpecialValueFor('bonus_armor');
        this.range = this.GetAbility().GetSpecialValueFor('range');
    }
    GetAttributes(): ModifierAttribute {
        return ModifierAttribute.MULTIPLE;
    }
    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.ATTACKSPEED_BONUS_CONSTANT, ModifierFunction.PHYSICAL_ARMOR_BONUS];
    }
    GetModifierAttackSpeedBonus_Constant(): number {
        return this.bonus_attack_speed;
    }
    GetModifierPhysicalArmorBonus(event: ModifierAttackEvent): number {
        return this.bonus_armor;
    }
    IsAura(): boolean {
        return true;
    }
    GetAuraRadius(): number {
        return this.range;
    }
    GetAuraSearchFlags(): UnitTargetFlags {
        return UnitTargetFlags.NONE;
    }
    GetAuraSearchTeam(): UnitTargetTeam {
        return UnitTargetTeam.BOTH;
    }
    GetAuraSearchType(): UnitTargetType {
        return UnitTargetType.HERO + UnitTargetType.BASIC;
    }
    GetModifierAura(): string {
        return modifier_item_qtg_assault_aura.name;
    }
    GetAuraEntityReject(entity: CDOTA_BaseNPC): boolean {
        if (entity == this.GetParent()) {
            // 不给自己
            return true;
        } else if (this.GetParent().IsRealHero() && entity.GetUnitName().includes(HERO_TO_BZ[this.GetParent().GetUnitName()])) {
            // 英雄装备，不给自己兵卒
            return true;
        } else if (!this.GetParent().IsRealHero() && this.GetParent().GetUnitName().includes(HERO_TO_BZ[entity.GetUnitName()])) {
            // 兵卒装备，不给自己英雄
            return true;
        }
        return false;
    }
}

/**
 * 降低敌人-10点甲
 * aura_negative_armor -10
 */
@registerModifier()
export class modifier_item_qtg_assault_aura extends BaseModifier {
    aura_negative_armor: number;
    parent: CDOTA_BaseNPC;
    IsDebuff(): boolean {
        return true;
    }
    IsHidden(): boolean {
        return false;
    }
    GetTexture(): string {
        return 'item_assault';
    }
    OnCreated(params: object): void {
        this.parent = this.GetParent();
        this.aura_negative_armor = this.GetAbility().GetSpecialValueFor('aura_negative_armor');
        if (!IsServer()) return;
        if (this.GetParent().IsRealHero()) Timers.CreateTimer(() => ParaAdjuster.ModifyMana(this.parent as CDOTA_BaseNPC_Hero));
    }
    OnDestroy(): void {
        if (!IsServer()) return;
        if (this.GetParent().IsRealHero()) ParaAdjuster.ModifyMana(this.parent as CDOTA_BaseNPC_Hero);
    }
    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.PHYSICAL_ARMOR_BONUS];
    }
    GetModifierPhysicalArmorBonus(event: ModifierAttackEvent): number {
        return this.aura_negative_armor;
    }
}

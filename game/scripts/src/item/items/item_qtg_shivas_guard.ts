import { TSBaseItem } from '../tsBaseItem';
import { IsValid } from '../../utils/amhc';
import { BaseModifier, registerAbility, registerModifier } from '../../utils/dota_ts_adapter';
import { ParaAdjuster } from '../../utils/paraadjuster';
import { HERO_TO_BZ } from '../../constants/constant';
import { CDOTA_BaseNPC_BZ } from '../../player/CDOTA_BaseNPC_BZ';

/**
 * 希瓦的守护，4000，1500板甲+2500
 * bonus_armor 10	bonus_intellect 25  range 400
 * 添加400码范围光环，降低敌人40攻击速度，10%移速，25%所有治疗效果
 */
@registerAbility()
export class item_qtg_shivas_guard extends TSBaseItem {
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
export class item_qtg_shivas_guard_modifier extends BaseModifier {
    bonus_armor: number;
    bonus_intellect: number;
    range: number;
    eventID: number;
    IsHidden(): boolean {
        return true;
    }
    OnCreated(params: object): void {
        if (!IsValid(this)) return;
        if (!IsValid(this.GetAbility())) return;
        this.bonus_armor = this.GetAbility().GetSpecialValueFor('bonus_armor');
        this.bonus_intellect = this.GetAbility().GetSpecialValueFor('bonus_intellect');
        this.range = this.GetAbility().GetSpecialValueFor('range');
    }
    GetAttributes(): ModifierAttribute {
        return ModifierAttribute.MULTIPLE;
    }
    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.PHYSICAL_ARMOR_BONUS, ModifierFunction.STATS_INTELLECT_BONUS];
    }
    GetModifierPhysicalArmorBonus(event: ModifierAttackEvent): number {
        return this.bonus_armor;
    }
    GetModifierBonusStats_Intellect(): number {
        return this.bonus_intellect;
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
        return modifier_item_qtg_shivas_guard_aura.name;
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
 * 降低敌人40攻击速度，移速，25%所有治疗效果
 * decrease_attack_speed -40	jiansu -10	jianliao 25
 */
@registerModifier()
export class modifier_item_qtg_shivas_guard_aura extends BaseModifier {
    decrease_attack_speed: number;
    jiansu: number;
    jianliao: number;
    parent: CDOTA_BaseNPC;
    eventID: number;
    IsDebuff(): boolean {
        return true;
    }
    IsHidden(): boolean {
        return false;
    }
    GetTexture(): string {
        return 'item_shivas_guard';
    }
    OnCreated(params: object): void {
        this.parent = this.GetParent();
        this.decrease_attack_speed = this.GetAbility().GetSpecialValueFor('decrease_attack_speed');
        this.jiansu = this.GetAbility().GetSpecialValueFor('jiansu');
        this.jianliao = this.GetAbility().GetSpecialValueFor('jianliao');
        if (!IsServer()) return;
        if (this.GetParent().IsRealHero()) {
            // 英雄回血
            this.eventID = GameRules.EventManager.Register('Event_ItemHuiXueByRound', (event: { entity: CDOTA_BaseNPC_Hero; nHuiXue: number }) => {
                if (event.entity == this.parent) {
                    if (!this.GetAbility() || !IsValid(this) || !IsValid(this.GetAbility())) return true;
                    event.nHuiXue -= (event.nHuiXue * this.jianliao) / 100;
                }
            });
            Timers.CreateTimer(() => ParaAdjuster.ModifyMana(this.parent as CDOTA_BaseNPC_Hero));
        } else {
            // 兵卒回血
            this.eventID = GameRules.EventManager.Register('Event_ItemHuiXueByRound', (event: { entity: CDOTA_BaseNPC_BZ; nHuiXue: number }) => {
                if (event.entity == this.parent) {
                    if (!this.GetAbility() || !IsValid(this) || !IsValid(this.GetAbility())) return true;
                    event.nHuiXue -= (event.nHuiXue * this.jianliao) / 100;
                }
            });
        }
    }
    OnDestroy(): void {
        if (!IsServer()) return;
        if (this.GetParent().IsRealHero()) ParaAdjuster.ModifyMana(this.parent as CDOTA_BaseNPC_Hero);
        GameRules.EventManager.UnRegisterByID(this.eventID);
        this.eventID = null;
    }
    DeclareFunctions(): ModifierFunction[] {
        return [
            ModifierFunction.ATTACKSPEED_BONUS_CONSTANT,
            ModifierFunction.MOVESPEED_BONUS_PERCENTAGE,
            ModifierFunction.HEAL_AMPLIFY_PERCENTAGE_SOURCE,
            ModifierFunction.HP_REGEN_AMPLIFY_PERCENTAGE,
            ModifierFunction.LIFESTEAL_AMPLIFY_PERCENTAGE,
            ModifierFunction.SPELL_LIFESTEAL_AMPLIFY_PERCENTAGE,
        ];
    }
    GetModifierAttackSpeedBonus_Constant(): number {
        return this.decrease_attack_speed;
    }
    GetModifierMoveSpeedBonus_Percentage(): number {
        return this.jiansu;
    }
    GetModifierHealAmplify_PercentageSource(): number {
        return -this.jianliao;
    }
    GetModifierHPRegenAmplify_Percentage(): number {
        return -this.jianliao;
    }
    GetModifierLifestealRegenAmplify_Percentage(): number {
        return -this.jianliao;
    }
    GetModifierSpellLifestealRegenAmplify_Percentage(): number {
        return -this.jianliao;
    }
}

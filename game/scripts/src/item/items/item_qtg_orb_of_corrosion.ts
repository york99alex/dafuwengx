import { TSBaseItem } from '../tsBaseItem';
import { AMHC } from '../../utils/amhc';
import { BaseModifier, registerAbility, registerModifier } from '../../utils/dota_ts_adapter';
import { Constant } from '../../mode/constant';
import { ParaAdjuster } from '../../utils/paraadjuster';

/**
 * 腐蚀之球，1500，毛毛帽500+淬毒之珠500+枯萎之石500
 * armor -4	slow_melee 15	slow_range 10	duration 2	health_bonus 250
 */
@registerAbility()
export class item_qtg_orb_of_corrosion extends TSBaseItem {
    GetIntrinsicModifierName() {
        return this.GetAbilityName() + '_modifier';
    }
}

@registerModifier()
export class item_qtg_orb_of_corrosion_modifier extends BaseModifier {
    duration: number;
    IsHidden(): boolean {
        return true;
    }
    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.ON_ATTACK_LANDED, , ModifierFunction.HEALTH_BONUS];
    }
    OnAttackLanded(event: ModifierAttackEvent): void {
        if (IsServer()) {
            if (event.attacker == this.GetParent()) {
                this.duration = this.GetAbility().GetSpecialValueFor('duration');
                if (
                    this.GetParent().IsRangedAttacker() ||
                    Constant.HERO_AttackCapabilit[this.GetParent().GetUnitName()] == UnitAttackCapability.RANGED_ATTACK
                ) {
                    // 远程 range
                    AMHC.AddNewModifier(event.target, event.attacker, this.GetAbility(), modifier_item_qtg_orb_of_corrosion_range.name, {
                        duration: this.duration,
                    });
                } else {
                    // 近战 melee
                    AMHC.AddNewModifier(event.target, event.attacker, this.GetAbility(), modifier_item_qtg_orb_of_corrosion_melee.name, {
                        duration: this.duration,
                    });
                }
            }
        }
    }
    GetAttributes(): ModifierAttribute {
        return ModifierAttribute.MULTIPLE;
    }
    GetModifierHealthBonus(): number {
        return this.GetAbility().GetSpecialValueFor('health_bonus');
    }
}

/**持有者为近战对目标施加的debuff */
@registerModifier()
export class modifier_item_qtg_orb_of_corrosion_melee extends BaseModifier {
    IsHidden(): boolean {
        return false;
    }
    IsDebuff(): boolean {
        return true;
    }
    IsPurgable(): boolean {
        return true;
    }
    GetEffectName(): string {
        return 'particles/items2_fx/orb_of_venom.vpcf';
    }
    GetEffectAttachType(): ParticleAttachment {
        return ParticleAttachment.ABSORIGIN_FOLLOW;
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
        return [ModifierFunction.MOVESPEED_BONUS_PERCENTAGE, ModifierFunction.PHYSICAL_ARMOR_BONUS];
    }
    GetModifierMoveSpeedBonus_Percentage(): number {
        return this.GetAbility().GetSpecialValueFor('slow_melee');
    }
    GetModifierPhysicalArmorBonus(event: ModifierAttackEvent): number {
        return this.GetAbility().GetSpecialValueFor('armor');
    }
}

/**持有者为远战对目标施加的debuff */
@registerModifier()
export class modifier_item_qtg_orb_of_corrosion_range extends BaseModifier {
    IsHidden(): boolean {
        return false;
    }
    IsDebuff(): boolean {
        return true;
    }
    IsPurgable(): boolean {
        return true;
    }
    GetEffectName(): string {
        return 'particles/items2_fx/orb_of_venom.vpcf';
    }
    GetEffectAttachType(): ParticleAttachment {
        return ParticleAttachment.ABSORIGIN_FOLLOW;
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
        return [ModifierFunction.MOVESPEED_BONUS_PERCENTAGE, ModifierFunction.PHYSICAL_ARMOR_BONUS];
    }
    GetModifierMoveSpeedBonus_Percentage(): number {
        return this.GetAbility().GetSpecialValueFor('slow_melee');
    }
    GetModifierPhysicalArmorBonus(event: ModifierAttackEvent): number {
        return this.GetAbility().GetSpecialValueFor('armor');
    }
}

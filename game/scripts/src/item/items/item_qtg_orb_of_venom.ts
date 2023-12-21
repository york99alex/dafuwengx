import { TSBaseItem } from '../tsBaseItem';
import { AMHC } from '../../utils/amhc';
import { BaseModifier, registerAbility, registerModifier } from '../../utils/dota_ts_adapter';
import { ParaAdjuster } from '../../utils/paraadjuster';
import { HERO_AttackCapabilit } from '../../mode/constant';

/**
 * 淬毒之珠，500，debuff-10%移速近战/5%远程，持续2秒
 * poison_movement_speed_melee -10	poison_movement_speed_range -5	poison_duration 2.0
 */
@registerAbility()
export class item_qtg_orb_of_venom extends TSBaseItem {
    GetIntrinsicModifierName() {
        return this.GetAbilityName() + '_modifier';
    }
}

@registerModifier()
export class item_qtg_orb_of_venom_modifier extends BaseModifier {
    poison_duration: number;
    IsHidden(): boolean {
        return true;
    }
    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.ON_ATTACK_LANDED];
    }
    OnAttackLanded(event: ModifierAttackEvent): void {
        if (IsServer()) {
            if (event.attacker == this.GetParent()) {
                this.poison_duration = this.GetAbility().GetSpecialValueFor('poison_duration');
                if (
                    this.GetParent().IsRangedAttacker() ||
                    HERO_AttackCapabilit[this.GetParent().GetUnitName()] == UnitAttackCapability.RANGED_ATTACK
                ) {
                    // 远程 range
                    AMHC.AddNewModifier(event.target, event.attacker, this.GetAbility(), modifier_item_qtg_orb_of_venom_range.name, {
                        duration: this.poison_duration,
                    });
                } else {
                    // 近战 melee
                    AMHC.AddNewModifier(event.target, event.attacker, this.GetAbility(), modifier_item_qtg_orb_of_venom_melee.name, {
                        duration: this.poison_duration,
                    });
                }
            }
        }
    }
}

/**持有者为近战对目标施加的debuff */
@registerModifier()
export class modifier_item_qtg_orb_of_venom_melee extends BaseModifier {
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
        return [ModifierFunction.MOVESPEED_BONUS_PERCENTAGE];
    }
    GetModifierMoveSpeedBonus_Percentage(): number {
        return this.GetAbility().GetSpecialValueFor('poison_movement_speed_melee');
    }
}

/**持有者为远战对目标施加的debuff */
@registerModifier()
export class modifier_item_qtg_orb_of_venom_range extends BaseModifier {
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
        return [ModifierFunction.MOVESPEED_BONUS_PERCENTAGE];
    }
    GetModifierMoveSpeedBonus_Percentage(): number {
        return this.GetAbility().GetSpecialValueFor('poison_movement_speed_range');
    }
}

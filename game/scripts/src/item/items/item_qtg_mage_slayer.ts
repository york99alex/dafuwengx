import { TSBaseItem } from '../tsBaseItem';
import { AMHC, IsValid } from '../../utils/amhc';
import { BaseModifier, registerAbility, registerModifier } from '../../utils/dota_ts_adapter';
import { ParaAdjuster } from '../../utils/paraadjuster';

/**
 * 法师克星，2500，20%魔抗，15攻速，20攻击力，10智力
 * bonus_magical_armor 20	bonus_attack_speed 15	bonus_damage 20	bonus_intellect 10
 * 命中添加deBuff
 * spell_amp_debuff 40	duration 4
 */
@registerAbility()
export class item_qtg_mage_slayer extends TSBaseItem {
    GetIntrinsicModifierName() {
        return this.GetAbilityName() + '_modifier';
    }
}

@registerModifier()
export class item_qtg_mage_slayer_modifier extends BaseModifier {
    bonus_magical_armor: number;
    bonus_attack_speed: number;
    bonus_damage: number;
    bonus_intellect: number;
    duration: number;
    IsHidden(): boolean {
        return true;
    }
    OnCreated(params: object): void {
        if (!IsValid(this)) return;
        if (!IsValid(this.GetAbility())) return;

        this.bonus_magical_armor = this.GetAbility().GetSpecialValueFor('bonus_magical_armor');
        this.bonus_attack_speed = this.GetAbility().GetSpecialValueFor('bonus_attack_speed');
        this.bonus_damage = this.GetAbility().GetSpecialValueFor('bonus_damage');
        this.bonus_intellect = this.GetAbility().GetSpecialValueFor('bonus_intellect');

        this.duration = this.GetAbility().GetSpecialValueFor('duration');

        const parent = this.GetParent();
        if (parent.IsRealHero()) ParaAdjuster.ModifyMana(parent);
    }
    OnDestroy(): void {
        const parent = this.GetParent();
        if (parent.IsRealHero()) ParaAdjuster.ModifyMana(parent);
    }
    GetAttributes(): ModifierAttribute {
        return ModifierAttribute.MULTIPLE;
    }
    DeclareFunctions(): ModifierFunction[] {
        return [
            ModifierFunction.MAGICAL_RESISTANCE_BONUS,
            ModifierFunction.ATTACKSPEED_BONUS_CONSTANT,
            ModifierFunction.PREATTACK_BONUS_DAMAGE,
            ModifierFunction.STATS_INTELLECT_BONUS,
            ModifierFunction.ON_ATTACK_LANDED,
        ];
    }
    GetModifierMagicalResistanceBonus(event: ModifierAttackEvent): number {
        return this.bonus_magical_armor;
    }
    GetModifierAttackSpeedBonus_Constant(): number {
        return this.bonus_attack_speed;
    }
    GetModifierPreAttack_BonusDamage(): number {
        return this.bonus_damage;
    }
    GetModifierBonusStats_Intellect(): number {
        return this.bonus_intellect;
    }
    OnAttackLanded(event: ModifierAttackEvent): void {
        if (IsServer()) {
            if (event.attacker == this.GetParent()) {
                AMHC.AddNewModifier(event.target, event.attacker, this.GetAbility(), modifier_item_qtg_mage_slayer_debuff.name, {
                    duration: this.duration,
                });
            }
        }
    }
}

@registerModifier()
export class modifier_item_qtg_mage_slayer_debuff extends BaseModifier {
    spell_amp_debuff: number;
    IsDebuff(): boolean {
        return true;
    }
    IsHidden(): boolean {
        return false;
    }
    IsPurgable(): boolean {
        return true;
    }
    GetTexture(): string {
        return 'item_mage_slayer';
    }
    GetEffectName(): string {
        return 'particles/items3_fx/mage_slayer_debuff.vpcf';
    }
    GetEffectAttachType(): ParticleAttachment {
        return ParticleAttachment.OVERHEAD_FOLLOW;
    }
    OnCreated(params: object): void {
        this.spell_amp_debuff = this.GetAbility().GetSpecialValueFor('spell_amp_debuff');
        if (this.GetParent().IsRealHero()) ParaAdjuster.ModifyMana(this.GetParent() as CDOTA_BaseNPC_Hero);
    }
    OnRefresh(params: object): void {
        if (this.GetParent().IsRealHero()) ParaAdjuster.ModifyMana(this.GetParent() as CDOTA_BaseNPC_Hero);
    }
    OnDestroy(): void {
        if (this.GetParent().IsRealHero()) ParaAdjuster.ModifyMana(this.GetParent() as CDOTA_BaseNPC_Hero);
    }
    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.TOTALDAMAGEOUTGOING_PERCENTAGE];
    }
    GetModifierTotalDamageOutgoing_Percentage(event: ModifierAttackEvent): number {
        if (IsClient()) return -this.spell_amp_debuff;
        if (event.damage_category == DamageCategory.SPELL) {
            return -this.spell_amp_debuff;
        }
    }
}

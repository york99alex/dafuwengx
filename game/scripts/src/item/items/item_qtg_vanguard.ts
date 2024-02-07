import { TSBaseItem } from '../tsBaseItem';
import { IsValid } from '../../utils/amhc';
import { BaseModifier, registerAbility, registerModifier } from '../../utils/dota_ts_adapter';
import { CDOTA_BaseNPC_BZ } from '../../player/CDOTA_BaseNPC_BZ';
import { HERO_TO_AttackCap } from '../../constants/constant';

/**
 * 先锋盾，2000，1000活力球+1000治疗指环
 * bonus_health 300	health_regen_hero 10	health_regen_bz 10
 * block_damage_melee 50	block_damage_ranged 25		block_chance 60
 */
@registerAbility()
export class item_qtg_vanguard extends TSBaseItem {
    IsPassive(): boolean {
        return true;
    }
    GetIntrinsicModifierName() {
        return this.GetAbilityName() + '_modifier';
    }
}

@registerModifier()
export class item_qtg_vanguard_modifier extends BaseModifier {
    bonus_health: number;
    health_regen_hero: number;
    health_regen_bz: number;
    block_damage_melee: number;
    block_damage_ranged: number;
    block_chance: number;
    eventID: number;
    IsHidden(): boolean {
        return true;
    }
    OnCreated(params: object): void {
        if (!IsValid(this)) return;
        if (!IsValid(this.GetAbility())) return;
        this.bonus_health = this.GetAbility().GetSpecialValueFor('bonus_health');
        this.health_regen_hero = this.GetAbility().GetSpecialValueFor('health_regen_hero');
        this.health_regen_bz = this.GetAbility().GetSpecialValueFor('health_regen_bz');
        this.block_damage_melee = this.GetAbility().GetSpecialValueFor('block_damage_melee');
        this.block_damage_ranged = this.GetAbility().GetSpecialValueFor('block_damage_ranged');
        this.block_chance = this.GetAbility().GetSpecialValueFor('block_chance');

        if (!IsServer()) return;
        if (this.GetParent().IsRealHero()) {
            // 英雄回血
            this.eventID = GameRules.EventManager.Register('Event_ItemHuiXueByRound', (event: { entity: CDOTA_BaseNPC_Hero; nHuiXue: number }) => {
                if (event.entity == this.GetCaster()) {
                    if (!this.GetAbility() || !IsValid(this) || !IsValid(this.GetAbility())) return true;
                    event.nHuiXue += event.entity.GetMaxHealth() * (this.health_regen_hero / 100);
                }
            });
        } else {
            // 兵卒回血
            this.eventID = GameRules.EventManager.Register('Event_ItemHuiXueByRound', (event: { entity: CDOTA_BaseNPC_BZ; nHuiXue: number }) => {
                if (event.entity == this.GetCaster()) {
                    if (!this.GetAbility() || !IsValid(this) || !IsValid(this.GetAbility())) return true;
                    event.nHuiXue += event.entity.GetMaxHealth() * (this.health_regen_bz / 100);
                }
            });
        }
    }
    OnDestroy(): void {
        if (!IsServer()) return;
        GameRules.EventManager.UnRegisterByID(this.eventID);
        this.eventID = null;
    }
    GetAttributes(): ModifierAttribute {
        return ModifierAttribute.MULTIPLE;
    }
    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.HEALTH_BONUS, ModifierFunction.PHYSICAL_CONSTANT_BLOCK];
    }
    GetModifierHealthBonus(): number {
        return this.bonus_health;
    }
    /**格挡 */
    GetModifierPhysical_ConstantBlock(event: ModifierAttackEvent): number {
        if (!this.GetAbility() || !IsValid(this) || !IsValid(this.GetAbility())) return 0;
        if (event.target == this.GetParent()) {
            if (RandomInt(1, 100) > this.block_chance) return;
            // 不格挡技能类型
            if (event.damage_category == DamageCategory.SPELL) return;
            if (this.GetParent().IsRealHero()) {
                // 英雄名映射攻击力（英雄攻击能力在初始化时已被手动移除）
                if ((HERO_TO_AttackCap[this.GetParent().GetName()] = UnitAttackCapability.RANGED_ATTACK)) return this.block_damage_ranged; // 远程
                else return this.block_damage_melee; // 近战
            } else {
                // 兵卒
                if (event.target.IsRangedAttacker()) return this.block_damage_ranged; // 远程
                else return this.block_damage_melee; // 近战
            }
        }
    }
}

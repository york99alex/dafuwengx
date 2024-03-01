import { TSBaseItem } from '../tsBaseItem';
import { AMHC, IsValid } from '../../utils/amhc';
import { BaseModifier, registerAbility, registerModifier } from '../../utils/dota_ts_adapter';
import { CDOTA_BaseNPC_BZ } from '../../player/CDOTA_BaseNPC_BZ';
import { HERO_TO_AttackCap } from '../../constants/constant';
import { AbilityManager } from '../../ability/abilitymanager';
import { DamageEvent } from '../../player/player';
import { ParaAdjuster } from '../../utils/paraadjuster';

/**
 * 赤红甲，2000先锋盾+1000头盔
 * bonus_health 350	bonus_armor 5   health_regen_hero 15	health_regen_bz 15
 * block_damage_melee 70	block_damage_ranged 35		block_chance 60
 * 技能主动释放后，一回合内100%格挡70点
 */
@registerAbility()
export class item_qtg_crimson_guard extends TSBaseItem {
    CastFilterResult(): UnitFilterResult {
        if (!IsServer()) return;
        if (!this.isCanCast()) {
            return UnitFilterResult.FAIL_CUSTOM;
        }
        return UnitFilterResult.SUCCESS;
    }

    OnSpellStart(): void {
        const player = GameRules.PlayerManager.getPlayer(this.GetCaster().GetPlayerOwnerID());
        if (!player) return;

        // 音效
        EmitGlobalSound('Item.CrimsonGuard.Cast');
        // 添加buff
        const buff = AbilityManager.setCopyBuff(modifier_item_qtg_crimson_guard_buff.name, player.m_eHero, this.GetCaster(), this);
        for (const BZ of player.m_tabBz) {
            AbilityManager.setCopyBuff(modifier_item_qtg_crimson_guard_buff.name, BZ, this.GetCaster(), this, null, false, buff);
        }
        // 兵卒创建更新buff
        if (buff) {
            buff['updateBZBuffByCreate'] = AbilityManager.updateBZBuffByCreate(player, null, (eBZ: CDOTA_BaseNPC_BZ) => {
                AbilityManager.setCopyBuff(modifier_item_qtg_crimson_guard_buff.name, eBZ, this.GetCaster(), this, null, false, buff);
            });
        }

        // 触发耗蓝
        GameRules.EventManager.FireEvent('Event_HeroManaChange', { player: player, oAblt: this });
        // 设置冷却
        AbilityManager.setRoundCD(player, this);
    }

    GetIntrinsicModifierName() {
        return this.GetAbilityName() + '_modifier';
    }
    isCanCastOtherRound(): boolean {
        return true;
    }
    isCanCastMove(): boolean {
        return true;
    }
    isCanCastInPrison(): boolean {
        return true;
    }
    isCanCastHeroAtk(): boolean {
        return true;
    }
}

@registerModifier()
export class item_qtg_crimson_guard_modifier extends BaseModifier {
    bonus_health: number;
    bonus_armor: number;
    health_regen_hero: number;
    health_regen_bz: number;
    block_damage_melee: number;
    block_damage_ranged: number;
    block_chance: number;
    eventID: number;
    IsHidden(): boolean {
        return true;
    }
    IsPurgable(): boolean {
        return false;
    }
    OnCreated(params: object): void {
        if (!IsValid(this)) return;
        if (!IsValid(this.GetAbility())) return;
        this.bonus_health = this.GetAbility().GetSpecialValueFor('bonus_health');
        this.bonus_armor = this.GetAbility().GetSpecialValueFor('bonus_health');
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
        return [ModifierFunction.HEALTH_BONUS, ModifierFunction.PHYSICAL_ARMOR_BONUS, ModifierFunction.PHYSICAL_CONSTANT_BLOCK];
    }
    GetModifierHealthBonus(): number {
        return this.bonus_health;
    }
    GetModifierPhysicalArmorBonus(event: ModifierAttackEvent): number {
        return this.bonus_armor;
    }
    /**格挡 */
    GetModifierPhysical_ConstantBlock(event: ModifierAttackEvent): number {
        if (!this.GetAbility() || !IsValid(this) || !IsValid(this.GetAbility())) return 0;
        if (event.target == this.GetParent()) {
            if (RandomInt(1, 100) > this.block_chance) return;
            // 不格挡技能类型
            if (event.damage_category == DamageCategory.SPELL) return;
            print('===Block Unit', event.target.GetUnitName(), 'AttackCapability:', event.target.GetAttackCapability());
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

@registerModifier()
export class modifier_item_qtg_crimson_guard_buff extends BaseModifier {
    m_nRound: number;
    m_tPtclID: ParticleID[];
    block_damage_melee: number;
    eventID: number;
    IsHidden(): boolean {
        return false;
    }
    IsPurgable(): boolean {
        return false;
    }
    GetTexture(): string {
        return 'item_crimson_guard';
    }

    OnCreated(params: object): void {
        this.m_nRound = this.GetAbility().GetSpecialValueFor('duration');
        this.block_damage_melee = this.GetAbility().GetSpecialValueFor('block_damage_melee');
        if (IsClient()) return;

        const caster = this.GetParent();
        this.m_tPtclID = [];
        const nPtclID = AMHC.CreateParticle('particles/custom/item_crimson_guard.vpcf', ParticleAttachment.POINT_FOLLOW, false, caster);
        ParticleManager.SetParticleControlEnt(nPtclID, 1, caster, ParticleAttachment.POINT_FOLLOW, 'attach_origin', caster.GetAbsOrigin(), true);
        this.m_tPtclID.push(nPtclID);

        AbilityManager.judgeBuffRound(this.GetCaster().GetPlayerOwnerID(), this);
    }
    OnDestroy(): void {
        if (IsClient()) return;
        if (this['updateBZBuffByCreate']) {
            GameRules.EventManager.UnRegisterByID(this['updateBZBuffByCreate'], 'Event_BZCreate');
        }
        GameRules.EventManager.UnRegisterByID(this.eventID);
        for (const v of this.m_tPtclID) {
            ParticleManager.DestroyParticle(v, false);
        }

        const hero = this.GetParent();
        if (hero.IsRealHero()) ParaAdjuster.ModifyMana(hero);
    }
    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.PHYSICAL_CONSTANT_BLOCK];
    }

    GetModifierPhysical_ConstantBlock(event: ModifierAttackEvent): number {
        if (!this.GetAbility() || !IsValid(this) || !IsValid(this.GetAbility())) return 0;
        if (event.target == this.GetParent()) {
            // 不格挡技能类型
            if (event.damage_category == DamageCategory.SPELL) return;
            return this.block_damage_melee;
        }
        return this.block_damage_melee;
    }
}

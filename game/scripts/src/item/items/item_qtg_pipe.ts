import { TSBaseItem } from '../tsBaseItem';
import { AHMC, IsValid } from '../../utils/amhc';
import { BaseModifier, registerAbility, registerModifier } from '../../utils/dota_ts_adapter';
import { CDOTA_BaseNPC_BZ } from '../../player/CDOTA_BaseNPC_BZ';
import { AbilityManager } from '../../ability/abilitymanager';
import { DamageEvent } from '../../player/player';

/**
 * 洞察烟斗，3500，1000斗篷+500回复戒指+1000治疗指环+1000卷轴，30%魔抗，18%回血
 * bonus_magical_armor 30	health_regen_hero 18	health_regen_bz 18	resist_perct 35 resisit_mana 1
 * 开关：魔法护盾
 */
@registerAbility()
export class item_qtg_pipe extends TSBaseItem {
    GetAbilityTextureName(): string {
        // 使用GetShareability来进行双端对开关的控制
        if (this.GetShareability() == 1) {
            return 'item_pipe_active';
        } else return 'item_pipe';
    }
    GetIntrinsicModifierName() {
        return this.GetAbilityName() + '_modifier';
    }
    CastFilterResult(): UnitFilterResult {
        if (!IsServer()) return;
        if (!this.isCanCast()) {
            return UnitFilterResult.FAIL_CUSTOM;
        }
        return UnitFilterResult.SUCCESS;
    }
    GetCooldown(level: number): number {
        return 1;
    }
    OnSpellStart(): void {
        if (!IsValid(this) || !IsValid(this.GetCaster())) return;

        const isActivated = this.GetShareability() == 1;
        const player = GameRules.PlayerManager.getPlayer(this.GetCaster().GetPlayerOwnerID());
        if (isActivated) {
            // 开启状态施法，关闭魔法护盾，移除Buff
            this.SetShareability(ItemShareability.NOT_SHAREABLE);
            AHMC.RemoveModifierByName(modifier_qtg_pipe_active.name, this.GetCaster());
        } else {
            // 激活状态施法，开启魔法护盾
            this.SetShareability(ItemShareability.PARTIALLY_SHAREABLE);
            // 使用音效
            EmitSoundOn('DOTA_Item.Pipe.Activate', this.GetCaster());
            // 添加Buff
            const buff = AHMC.AddNewModifier(player.m_eHero, player.m_eHero, this, modifier_qtg_pipe_active.name, null);
            for (const BZ of player.m_tabBz) {
                if (IsValid(BZ)) BZ.AddNewModifier(player.m_eHero, this, modifier_qtg_pipe_active.name, null);
            }
            // 兵卒创建更新buff
            if (buff) {
                buff['updateBZBuffByCreate'] = AbilityManager.updateBZBuffByCreate(player, null, (eBZ: CDOTA_BaseNPC_BZ) => {
                    AbilityManager.setCopyBuff(modifier_qtg_pipe_active.name, eBZ, this.GetCaster(), this, null, false, buff);
                });
            }
        }
    }
    isCanCastMove(): boolean {
        return true;
    }
}

@registerModifier()
export class item_qtg_pipe_modifier extends BaseModifier {
    health_regen_hero: number;
    health_regen_bz: number;
    bonus_magical_armor: number;
    eventID: number;
    IsHidden(): boolean {
        return true;
    }
    OnCreated(params: object): void {
        if (!IsValid(this)) return;
        if (!IsValid(this.GetAbility())) return;
        this.health_regen_hero = this.GetAbility().GetSpecialValueFor('health_regen_hero');
        this.health_regen_bz = this.GetAbility().GetSpecialValueFor('health_regen_bz');
        this.bonus_magical_armor = this.GetAbility().GetSpecialValueFor('bonus_magical_armor');

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
        return [ModifierFunction.MAGICAL_RESISTANCE_BONUS];
    }
    GetModifierMagicalResistanceBonus(): number {
        return this.bonus_magical_armor;
    }
}

/**
 * 魔法护盾技能Buff
 * resist_perct 35	resisit_mana 1
 */
@registerModifier()
export class modifier_qtg_pipe_active extends BaseModifier {
    resist_perct: number;
    resisit_mana: number;
    eventID: number;
    nPtclID: ParticleID;
    GetTexture(): string {
        return 'item_pipe_active';
    }
    IsPurgable(): boolean {
        return false;
    }
    OnCreated(params: object): void {
        this.resist_perct = this.GetAbility().GetSpecialValueFor('resist_perct');
        this.resisit_mana = this.GetAbility().GetSpecialValueFor('resisit_mana');

        if (!IsServer()) return;
        print('===modifier_qtg_pipe_active===Register');
        this.eventID = GameRules.EventManager.Register(
            'Event_BeAtk',
            (event: DamageEvent) => {
                if (
                    event.damage < 1 ||
                    !IsValid(this.GetParent()) ||
                    event.entindex_victim_const != this.GetParent().GetEntityIndex() ||
                    event.damagetype_const != DamageTypes.MAGICAL ||
                    RandomInt(1, 100) > this.resist_perct
                )
                    return;
                // 判定成功
                const player = GameRules.PlayerManager.getPlayer(this.GetParent().GetPlayerOwnerID());
                if (player.m_eHero.GetMana() < this.resisit_mana) return;

                // 消耗魔法
                player.spendPlayerMana(this.resisit_mana, this.GetAbility());
                // 触发效果
                event.damage = 0;
                const nPtclID = AHMC.CreateParticle('particles/custom/item_pipe_miss_2.vpcf', ParticleAttachment.POINT, false, this.GetParent(), 2);
                ParticleManager.SetParticleControl(nPtclID, 0, (this.GetParent().GetAbsOrigin() + Vector(0, 0, 200)) as Vector);
                EmitSoundOn('DOTA_Item.LinkensSphere.Activate', this.GetParent());
            },
            this,
            -987654321
        );
        const caster = this.GetParent();
        this.nPtclID = AHMC.CreateParticle('particles/items2_fx/pipe_of_insight.vpcf', ParticleAttachment.OVERHEAD_FOLLOW, false, caster);
        ParticleManager.SetParticleControlEnt(this.nPtclID, 1, caster, ParticleAttachment.POINT_FOLLOW, 'attach_origin', caster.GetAbsOrigin(), true);
        ParticleManager.SetParticleControl(this.nPtclID, 2, Vector(caster.GetModelRadius() * 1.5, 0, 0));
    }

    OnDestroy(): void {
        if (IsClient()) return;
        GameRules.EventManager.UnRegisterByID(this.eventID);
        this.eventID = null;
        ParticleManager.DestroyParticle(this.nPtclID, false);
        this.nPtclID = null;
        if (this['updateBZBuffByCreate']) {
            GameRules.EventManager.UnRegisterByID(this['updateBZBuffByCreate'], 'Event_BZCreate');
        }
    }
}

import { AbilityManager } from '../../ability/abilitymanager';
import { TSBaseItem } from '../tsBaseItem';
import { AMHC, IsValid } from '../../utils/amhc';
import { BaseModifier, registerAbility, registerModifier } from '../../utils/dota_ts_adapter';
import { CDOTA_BaseNPC_BZ } from '../../player/CDOTA_BaseNPC_BZ';
import { ParaAdjuster } from '../../utils/paraadjuster';
import { DamageEvent } from '../../player/player';

/**
 * 刃甲，3000，1500大剑+1500的板甲
 * bonus_damage 20	bonus_armor 10
 */
@registerAbility()
export class item_qtg_blade_mail extends TSBaseItem {
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
        EmitGlobalSound('DOTA_Item.BladeMail.Activate');
        // 添加buff
        const buff = AbilityManager.setCopyBuff(modifier_item_qtg_blade_mail_buff.name, player.m_eHero, this.GetCaster(), this);
        for (const BZ of player.m_tabBz) {
            AbilityManager.setCopyBuff(modifier_item_qtg_blade_mail_buff.name, BZ, this.GetCaster(), this, null, false, buff);
        }
        // 兵卒创建更新buff
        if (buff) {
            buff['updateBZBuffByCreate'] = AbilityManager.updateBZBuffByCreate(player, null, (eBZ: CDOTA_BaseNPC_BZ) => {
                AbilityManager.setCopyBuff(modifier_item_qtg_blade_mail_buff.name, eBZ, this.GetCaster(), this, null, false, buff);
            });
        }

        // 触发耗蓝
        GameRules.EventManager.FireEvent('Event_HeroManaChange', { player: player, oAblt: this });
        // 设置冷却
        AbilityManager.setRoundCD(player, this);
    }

    isCanCastAtk(): boolean {
        return true;
    }

    isCanCastHeroAtk(): boolean {
        return true;
    }

    GetIntrinsicModifierName() {
        return this.GetAbilityName() + '_modifier';
    }
}

@registerModifier()
export class item_qtg_blade_mail_modifier extends BaseModifier {
    bonus_damage: number;
    bonus_armor: number;
    IsHidden(): boolean {
        return true;
    }
    OnCreated(params: object): void {
        if (!IsValid(this) || !IsValid(this.GetAbility())) return;
        this.bonus_damage = this.GetAbility().GetSpecialValueFor('bonus_attack_speed');
        this.bonus_armor = this.GetAbility().GetSpecialValueFor('bonus_armor');

        if (IsClient() || !this.GetParent().IsRealHero()) return;
    }
    GetAttributes(): ModifierAttribute {
        return ModifierAttribute.MULTIPLE;
    }
    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.PREATTACK_BONUS_DAMAGE, ModifierFunction.PHYSICAL_ARMOR_BONUS];
    }
    GetModifierPreAttack_BonusDamage(): number {
        return this.bonus_damage;
    }
    GetModifierPhysicalArmorBonus(event: ModifierAttackEvent): number {
        return this.bonus_armor;
    }
}

@registerModifier()
export class modifier_item_qtg_blade_mail_buff extends BaseModifier {
    m_nRound: number;
    m_tPtclID: ParticleID[];
    eventID: number;
    IsHidden(): boolean {
        return false;
    }
    IsPurgable(): boolean {
        return false;
    }
    GetTexture(): string {
        return 'item_blade_mail';
    }

    OnCreated(params: object): void {
        this.m_nRound = 1;
        if (IsClient()) return;
        const caster = this.GetParent();
        this.eventID = GameRules.EventManager.Register('Event_OnDamage', (event: DamageEvent) => this.onDamage(event), this, -20000);
        this.m_tPtclID = [];
        const nPtclID = AMHC.CreateParticle('particles/items_fx/blademail.vpcf', ParticleAttachment.POINT_FOLLOW, false, caster);
        ParticleManager.SetParticleControlEnt(nPtclID, 0, caster, ParticleAttachment.POINT_FOLLOW, 'attach_origin', caster.GetAbsOrigin(), true);
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
    /**触发反伤 */
    onDamage(event: DamageEvent) {
        if (
            event.bBladeMail ||
            event.entindex_victim_const != this.GetParent().GetEntityIndex() ||
            event.entindex_victim_const == event.entindex_attacker_const
        ) {
            // 自身伤害不反弹
            return;
        }
        // 敌人打自己
        const attacker = EntIndexToHScript(event.entindex_attacker_const) as CDOTA_BaseNPC;
        if (!IsValid(attacker)) return;

        // 反伤
        AMHC.Damage(this.GetParent(), attacker, event.damage, event.damagetype_const, event['ability'], null, {
            bBladeMail: true,
        });
        EmitGlobalSound('DOTA_Item.BladeMail.Damage');
    }
}

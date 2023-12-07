import { TSBaseItem } from '../tsBaseItem';
import { IsValid } from '../../utils/amhc';
import { BaseModifier, registerAbility, registerModifier } from '../../utils/dota_ts_adapter';
import { CDOTA_BaseNPC_BZ } from '../../player/CDOTA_BaseNPC_BZ';
import { AbilityManager } from '../../ability/abilitymanager';

/**
 * 丰饶之环，2500，每回合英雄/兵卒回复12%生命值，英雄每2回合回复1点蓝，兵卒提升20%回蓝，15点攻击力
 * health_regen_hero 12	    health_regen_bz 12
 * mana_regen_hero 1	mana_regen_bz 20
 * bonus_damage 15
 * CD：2
 */
@registerAbility()
export class item_qtg_cornucopia extends TSBaseItem {
    IsPassive(): boolean {
        return true;
    }
    GetIntrinsicModifierName() {
        return this.GetAbilityName() + '_modifier';
    }
    OnSpellStart(): void {
        const player = GameRules.PlayerManager.getPlayer(this.GetCaster().GetPlayerOwnerID());
        if (!player) return;

        // 物品给蓝
        player.givePlayerMana(this.GetSpecialValueFor('mana_regen_hero'));
        if (player.m_eHero.GetMana() > player.m_eHero.GetMaxMana()) player.setPlayerMana(player.m_eHero.GetMaxMana());
        // 设置冷却
        AbilityManager.setRoundCD(player, this);
    }

    isCanCastAtk(): boolean {
        return true;
    }
    isCanCastHeroAtk(): boolean {
        return true;
    }
    isCanCastInPrison(): boolean {
        return true;
    }
}

@registerModifier()
export class item_qtg_cornucopia_modifier extends BaseModifier {
    health_regen_hero: number;
    health_regen_bz: number;
    mana_regen_bz: number;
    bonus_damage: number;
    tEventID: number[];
    IsHidden(): boolean {
        return true;
    }
    OnCreated(params: object): void {
        if (!IsValid(this)) return;
        if (!IsValid(this.GetAbility())) return;
        this.health_regen_hero = this.GetAbility().GetSpecialValueFor('health_regen_hero');
        this.health_regen_bz = this.GetAbility().GetSpecialValueFor('health_regen_bz');
        this.mana_regen_bz = this.GetAbility().GetSpecialValueFor('mana_regen_bz');
        this.bonus_damage = this.GetAbility().GetSpecialValueFor('bonus_damage');
        this.tEventID = [];
        if (!IsServer()) return;
        if (this.GetParent().IsRealHero()) {
            // 英雄回血
            this.tEventID.push(
                GameRules.EventManager.Register('Event_ItemHuiXueByRound', (event: { entity: CDOTA_BaseNPC_Hero; nHuiXue: number }) => {
                    if (event.entity == this.GetCaster()) {
                        if (!this.GetAbility() || !IsValid(this) || !IsValid(this.GetAbility())) return true;
                        event.nHuiXue += event.entity.GetMaxHealth() * (this.health_regen_hero / 100);
                    }
                })
            );
            // 英雄回蓝
            this.StartIntervalThink(0.1);
        } else {
            // 兵卒回血
            this.tEventID.push(
                GameRules.EventManager.Register('Event_ItemHuiXueByRound', (event: { entity: CDOTA_BaseNPC_BZ; nHuiXue: number }) => {
                    if (event.entity == this.GetCaster()) {
                        if (!this.GetAbility() || !IsValid(this) || !IsValid(this.GetAbility())) return true;
                        event.nHuiXue += event.entity.GetMaxHealth() * (this.health_regen_bz / 100);
                    }
                })
            );
            // 兵卒回蓝
            this.tEventID.push(
                GameRules.EventManager.Register('Event_BZHuiMo', (event: { eBz: CDOTA_BaseNPC_BZ; nHuiMoBase: number }) => {
                    if (event.eBz == this.GetCaster()) {
                        if (!this.GetAbility() || !IsValid(this) || !IsValid(this.GetAbility())) return true;
                        event.nHuiMoBase += this.mana_regen_bz / 100;
                    }
                })
            );
        }
    }
    OnIntervalThink(): void {
        if (!this.GetAbility().IsFullyCastable()) return;

        if ((this.GetAbility() as TSBaseItem).isCanCast()) {
            this.GetCaster().CastAbilityNoTarget(this.GetAbility(), this.GetCaster().GetPlayerOwnerID());
        }
    }
    OnDestroy(): void {
        if (!IsServer()) return;
        if (!this.tEventID) return;
        GameRules.EventManager.UnRegisterByIDs(this.tEventID);
        this.tEventID = null;
    }
    GetAttributes(): ModifierAttribute {
        return ModifierAttribute.MULTIPLE;
    }
    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.PREATTACK_BONUS_DAMAGE];
    }
    GetModifierPreAttack_BonusDamage(): number {
        return this.bonus_damage;
    }
}

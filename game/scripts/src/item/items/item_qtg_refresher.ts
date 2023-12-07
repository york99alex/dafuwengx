import { AHMC, IsValid } from '../../utils/amhc';
import { BaseModifier, registerAbility, registerModifier } from '../../utils/dota_ts_adapter';
import { TSBaseItem } from '../tsBaseItem';
import { AbilityManager } from '../../ability/abilitymanager';
import { CDOTA_BaseNPC_BZ } from '../../player/CDOTA_BaseNPC_BZ';
import { Player } from '../../player/player';

/**
 * 刷新球，5000，2500丰饶*2，每回合英雄/兵卒回复24%生命值，英雄2回合回2蓝，兵卒提升40%回蓝，30点攻击力
 * bonus_damage 30	mana_regen_bz 40
 * mana_regen_hero 2	mana_regen_hero_cd 2
 * health_regen_hero 24	health_regen_bz 24
 * CD 5回合 3耗蓝
 */
@registerAbility()
export class item_qtg_refresher extends TSBaseItem {
    CastFilterResult(): UnitFilterResult {
        if (!IsServer()) return;
        if (!this.isCanCast()) {
            return UnitFilterResult.FAIL_CUSTOM;
        }
        return UnitFilterResult.SUCCESS;
    }

    /**技能释放 */
    OnSpellStart(): void {
        const player = GameRules.PlayerManager.getPlayer(this.GetCaster().GetPlayerOwnerID());
        if (!player) return;

        // 触发耗蓝
        GameRules.EventManager.FireEvent('Event_HeroManaChange', { player: player, oAblt: this });
        // 设置冷却
        AbilityManager.setRoundCD(player, this);
    }
    GetIntrinsicModifierName() {
        return this.GetAbilityName() + '_modifier';
    }
}

@registerModifier()
export class item_qtg_refresher_modifier extends BaseModifier {
    bonus_damage: number;
    mana_regen_bz: number;
    mana_regen_hero_cd: number;
    health_regen_hero: number;
    health_regen_bz: number;
    countCD: number;
    nRound: number;
    tEventID: number[];
    IsHidden(): boolean {
        return true;
    }
    OnCreated(params: object): void {
        if (!IsValid(this)) return;
        if (!IsValid(this.GetAbility())) return;
        this.bonus_damage = this.GetAbility().GetSpecialValueFor('bonus_damage');
        this.mana_regen_bz = this.GetAbility().GetSpecialValueFor('mana_regen_bz');
        this.mana_regen_hero_cd = this.GetAbility().GetSpecialValueFor('mana_regen_hero_cd');
        this.health_regen_hero = this.GetAbility().GetSpecialValueFor('health_regen_hero');
        this.health_regen_bz = this.GetAbility().GetSpecialValueFor('health_regen_bz');
        this.countCD = this.mana_regen_hero_cd;

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
            this.StartIntervalThink(0.6);
            const player = GameRules.PlayerManager.getPlayer(this.GetCaster().GetPlayerOwnerID());
            if (!player) return;
            this.tEventID.push(
                GameRules.EventManager.Register('Event_PlayerRoundBegin', (event: { oPlayer: Player }) => {
                    if (event.oPlayer != player) return;
                    if (!(this.GetAbility() as TSBaseItem).isCanCast()) return;
                    if (this.nRound != GameRules.GameConfig.m_nRound) this.countCD--;
                })
            );
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
    /**
     * 监听回蓝
     * mana_regen_hero 2	mana_regen_hero_cd 2
     */
    OnIntervalThink(): void {
        let buff = this.GetParent().FindModifierByName(modifier_qtg_refresher_cd.name);
        if (!buff || !IsValid(buff)) {
            const player = GameRules.PlayerManager.getPlayer(this.GetCaster().GetPlayerOwnerID());
            if (!player) return;

            if (!(this.GetAbility() as TSBaseItem).isCanCast()) return;
            if (player.m_eHero.GetMana() == player.m_eHero.GetMaxMana()) return;

            // 物品给蓝
            player.givePlayerMana(this.GetAbility().GetSpecialValueFor('mana_regen_hero'));
            if (player.m_eHero.GetMana() >= player.m_eHero.GetMaxMana()) player.setPlayerMana(player.m_eHero.GetMaxMana());
            // 设置Buff
            buff = AHMC.AddNewModifier(this.GetCaster(), this.GetCaster(), this.GetAbility(), modifier_qtg_refresher_cd.name, {
                duration: this.mana_regen_hero_cd,
            });
            this.countCD = this.mana_regen_hero_cd;
            this.nRound = GameRules.GameConfig.m_nRound;
            buff.SetStackCount(this.countCD);
        } else if (buff && IsValid(buff)) {
            if (this.countCD == 0) AHMC.RemoveModifierByName(modifier_qtg_refresher_cd.name, this.GetCaster());
            else {
                buff.SetDuration(this.countCD, true);
                buff.SetStackCount(this.countCD);
            }
        }
    }
    OnDestroy(): void {
        if (!IsServer()) return;
        if (!this.tEventID) return;
        GameRules.EventManager.UnRegisterByIDs(this.tEventID);
        this.tEventID = null;
        const buff = this.GetParent().FindModifierByName(modifier_qtg_refresher_cd.name);
        const player = GameRules.PlayerManager.getPlayer(this.GetCaster().GetPlayerOwnerID());
        if (!player || !buff) return;
        if (this.GetAbility() && IsValid(this.GetAbility())) {
            const remainingTime = buff.GetRemainingTime();
            if (buff && IsValid(buff)) {
                Timers.CreateTimer(0, () => {
                    const item = player.m_eHero.FindItemInInventory(item_qtg_refresher.name);
                    if (!item) return;
                    if (item.GetItemSlot() < 6 && item.GetItemState() == 1) return;
                    buff.SetDuration(remainingTime, true);
                    return 0.3;
                });
            }
        } else {
            AHMC.RemoveModifierByName(modifier_qtg_refresher_cd.name, this.GetParent());
        }
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

@registerModifier()
export class modifier_qtg_refresher_cd extends BaseModifier {
    IsDebuff(): boolean {
        return true;
    }
    GetTexture(): string {
        return 'item_refresher';
    }
}

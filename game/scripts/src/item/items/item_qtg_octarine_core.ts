import { TSBaseItem } from '../tsBaseItem';
import { IsValid } from '../../utils/amhc';
import { BaseModifier, registerAbility, registerModifier } from '../../utils/dota_ts_adapter';
import { CDOTA_BaseNPC_BZ } from '../../player/CDOTA_BaseNPC_BZ';
import { AbilityManager } from '../../ability/abilitymanager';
import { Player } from '../../player/player';

/**
 * 玲珑心，4000，2回蓝+1活力球+1能量球，300血，2点蓝上限，每2回合回2点蓝，50%兵卒回蓝提升，CD-1回合
 * bonus_health 300	bonus_mana 2
 * mana_regen_hero 2	mana_regen_hero_cd 2
 * mana_regen_bz 50
 * cd_sub 1 mana_sub 1
 */
@registerAbility()
export class item_qtg_octarine_core extends TSBaseItem {
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
        if (player.m_eHero.GetMaxMana() != player.m_eHero.GetMana()) player.givePlayerMana(this.GetSpecialValueFor('mana_regen_hero'));
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
export class item_qtg_octarine_core_modifier extends BaseModifier {
    bonus_health: number;
    bonus_mana: number;
    mana_regen_bz: number;
    cd_sub: number;
    mana_sub: number;
    eventID: number;
    player: Player;
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
        this.bonus_mana = this.GetParent().IsRealHero() ? this.GetAbility().GetSpecialValueFor('bonus_mana') : 0;
        this.mana_regen_bz = this.GetAbility().GetSpecialValueFor('mana_regen_bz');
        this.cd_sub = this.GetAbility().GetSpecialValueFor('cd_sub');
        this.mana_sub = this.GetAbility().GetSpecialValueFor('mana_sub');

        if (!IsServer()) return;

        this.player = GameRules.PlayerManager.getPlayer(this.GetParent().GetPlayerOwnerID());
        if (this.GetParent().IsRealHero()) {
            this.player.m_nManaMaxBase += this.bonus_mana;
            this.player.setCDSub(this.player.m_nCDSub + this.cd_sub);
            this.player.setManaSub(this.player.m_nManaSub + this.mana_sub);
            // 英雄回蓝
            this.StartIntervalThink(0.1);
        } else {
            // 兵卒回蓝
            this.eventID = GameRules.EventManager.Register('Event_BZHuiMo', (event: { eBz: CDOTA_BaseNPC_BZ; nHuiMoBase: number }) => {
                if (event.eBz == this.GetCaster()) {
                    if (!this.GetAbility() || !IsValid(this) || !IsValid(this.GetAbility())) return true;
                    event.nHuiMoBase += this.mana_regen_bz / 100;
                }
            });
        }
    }
    OnIntervalThink(): void {
        if (!this.GetAbility().IsFullyCastable()) return;

        if (this.GetParent().GetMana() == this.GetParent().GetMaxMana()) return;
        if ((this.GetAbility() as TSBaseItem).isCanCast()) {
            this.GetCaster().CastAbilityNoTarget(this.GetAbility(), this.GetCaster().GetPlayerOwnerID());
        }
    }
    OnDestroy(): void {
        if (!IsServer()) return;
        if (!this.eventID) return;
        GameRules.EventManager.UnRegisterByID(this.eventID);
        if (this.GetParent().IsRealHero()) {
            this.player.m_nManaMaxBase -= this.bonus_mana;
            this.player.setCDSub(this.player.m_nCDSub + this.cd_sub);
            this.player.setManaSub(this.player.m_nManaSub + this.mana_sub);
        }
        this.eventID = null;
    }
    GetAttributes(): ModifierAttribute {
        return ModifierAttribute.MULTIPLE;
    }
    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.HEALTH_BONUS, ModifierFunction.MANA_BONUS];
    }
    GetModifierHealthBonus(): number {
        return this.bonus_health;
    }
    GetModifierManaBonus(): number {
        return this.bonus_mana;
    }
}

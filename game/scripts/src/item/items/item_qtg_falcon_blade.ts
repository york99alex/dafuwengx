import { TSBaseItem } from '../tsBaseItem';
import { IsValid } from '../../utils/amhc';
import { BaseModifier, registerAbility, registerModifier } from '../../utils/dota_ts_adapter';
import { CDOTA_BaseNPC_BZ } from '../../player/CDOTA_BaseNPC_BZ';
import { AbilityManager } from '../../ability/abilitymanager';

/**
 * 猎鹰战刃，1500，毛毛帽500+贤者面罩500+攻击之爪500，200血，3回合1蓝，15攻击力
 * bonus_health 300	mana_regen_hero 1	mana_regen_bz 10	bonus_damage 12
 * CD：3
 */
@registerAbility()
export class item_qtg_falcon_blade extends TSBaseItem {
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
    isCanCDSub(): boolean {
        return false;
    }
}

@registerModifier()
export class item_qtg_falcon_blade_modifier extends BaseModifier {
    mana_regen_bz: number;
    eventID: number;
    IsHidden(): boolean {
        return true;
    }
    OnCreated(params: object): void {
        if (!IsValid(this)) return;
        if (!IsValid(this.GetAbility())) return;
        this.mana_regen_bz = this.GetAbility().GetSpecialValueFor('mana_regen_bz');

        if (!IsServer()) return;
        if (this.GetParent().IsRealHero()) {
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

        if ((this.GetAbility() as TSBaseItem).isCanCast()) {
            this.GetCaster().CastAbilityNoTarget(this.GetAbility(), this.GetCaster().GetPlayerOwnerID());
        }
    }
    OnDestroy(): void {
        if (!IsServer()) return;
        if (!this.eventID) return;
        GameRules.EventManager.UnRegisterByID(this.eventID);
        this.eventID = null;
    }
    GetAttributes(): ModifierAttribute {
        return ModifierAttribute.MULTIPLE;
    }
    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.HEALTH_BONUS, ModifierFunction.PREATTACK_BONUS_DAMAGE];
    }
    GetModifierHealthBonus(): number {
        return this.GetAbility().GetSpecialValueFor('bonus_health');
    }
    GetModifierPreAttack_BonusDamage(): number {
        return this.GetAbility().GetSpecialValueFor('bonus_damage');
    }
}

import { AbilityManager } from '../../ability/abilitymanager';
import { TSBaseItem } from '../tsBaseItem';
import { Player } from '../../player/player';
import { AHMC, IsValid } from '../../utils/amhc';
import { BaseModifier, registerAbility, registerModifier } from '../../utils/dota_ts_adapter';

@registerAbility()
export class item_qtg_arcane_boots extends TSBaseItem {
    GetCastRange(location: Vector, target: CDOTA_BaseNPC): number {
        return 0;
    }

    CastFilterResult(): UnitFilterResult {
        if (!IsServer()) return;
        if (!this.isCanCast()) {
            return UnitFilterResult.FAIL_CUSTOM;
        }
        return UnitFilterResult.SUCCESS;
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

    /**技能释放 */
    OnSpellStart(): void {
        const player = GameRules.PlayerManager.getPlayer(this.GetCaster().GetPlayerOwnerID());
        if (!player) return;

        // 特效
        AHMC.CreateParticle('particles/items_fx/arcane_boots.vpcf', ParticleAttachment.POINT, false, player.m_eHero, 2);
        AHMC.CreateParticle('particles/items_fx/arcane_boots_recipient.vpcf', ParticleAttachment.POINT, false, player.m_eHero, 2);
        // 音效
        EmitGlobalSound('DOTA_Item.ArcaneBoots.Activate');

        // 恢复英雄魔法
        const heromana = this.GetSpecialValueFor('replenish_hero');
        const bzmana = this.GetSpecialValueFor('replenish_bz');
        player.givePlayerMana(heromana);
        // 回复全部兵卒魔法
        for (const BZ of player.m_tabBz) {
            if (IsValid(BZ)) {
                BZ.GiveMana(bzmana);
                AHMC.CreateParticle('particles/items_fx/arcane_boots.vpcf', ParticleAttachment.POINT, false, BZ, 2);
                AHMC.CreateParticle('particles/items_fx/arcane_boots_recipient.vpcf', ParticleAttachment.POINT, false, BZ, 2);
            }
        }
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
export class item_qtg_arcane_boots_modifier extends BaseModifier {
    player: Player;
    bonus_mana: number;
    IsHidden(): boolean {
        return true;
    }
    OnCreated(params: object): void {
        if (!IsValid(this)) return;
        if (!IsValid(this.GetAbility())) return;
        if (IsClient() || !this.GetParent().IsRealHero()) return;

        this.player = GameRules.PlayerManager.getPlayer(this.GetParent().GetPlayerOwnerID());
        this.bonus_mana = this.GetParent().IsRealHero() ? this.GetAbility().GetSpecialValueFor('bonus_mana') : 0;
        this.player.m_nManaMaxBase += this.bonus_mana;
    }
    OnDestroy(): void {
        if (IsClient() || !this.GetParent().IsRealHero()) return;
        this.player.m_nManaMaxBase -= this.bonus_mana;
    }
    GetAttributes(): ModifierAttribute {
        return ModifierAttribute.MULTIPLE;
    }
    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.MOVESPEED_BONUS_UNIQUE, ModifierFunction.MANA_BONUS];
    }
    GetModifierMoveSpeedBonus_Special_Boots() {
        return this.GetAbility().GetSpecialValueFor('bonus_movement');
    }
    GetModifierManaBonus(): number {
        return this.bonus_mana ?? 0;
    }
}

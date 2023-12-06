import { TSBaseItem } from '../tsBaseItem';
import { Player } from '../../player/player';
import { IsValid } from '../../utils/amhc';
import { BaseModifier, registerAbility, registerModifier } from '../../utils/dota_ts_adapter';

/**
 * 能量之球，1000，2点蓝上限
 * bonus_mana 2
 */
@registerAbility()
export class item_qtg_energy_booster extends TSBaseItem {
    IsPassive(): boolean {
        return true;
    }
    GetIntrinsicModifierName() {
        return this.GetAbilityName() + '_modifier';
    }
}

@registerModifier()
export class item_qtg_energy_booster_modifier extends BaseModifier {
    player: Player;
    bonus_mana: number;
    IsHidden(): boolean {
        return true;
    }
    OnCreated(params: object): void {
        if (!IsValid(this)) return;
        if (!IsValid(this.GetAbility())) return;
        this.bonus_mana = this.GetParent().IsRealHero() ? this.GetAbility().GetSpecialValueFor('bonus_mana') : 0;
        if (IsClient() || !this.GetParent().IsRealHero()) return;

        this.player = GameRules.PlayerManager.getPlayer(this.GetParent().GetPlayerOwnerID());
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
        return [ModifierFunction.MANA_BONUS];
    }
    GetModifierManaBonus(): number {
        return this.bonus_mana;
    }
}

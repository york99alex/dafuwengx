import { IsValid } from '../../utils/amhc';
import { Card } from '../card';

/**奶酪 30010 */
export class Card_EVENT_Card_Cheese extends Card {
    m_sName: string = '奶酪';
    isCanCastInPrison(): boolean {
        return true;
    }
    isCanCastMove(): boolean {
        return true;
    }
    isCanCastAtk(): boolean {
        return true;
    }

    OnSpellStart(): void {
        GameRules.PlayerManager.m_tabPlayers.forEach(player => {
            if (IsValid(player.m_eHero) && !player.m_bDie) {
                player.m_eHero.Heal(player.m_eHero.GetMaxHealth(), null);
                player.givePlayerMana(player.m_eHero.GetMaxMana());
            }
            player.m_tabBz.forEach(bz => {
                if (IsValid(bz)) {
                    bz.Heal(player.m_eHero.GetMaxHealth(), null);
                    bz.GiveMana(bz.GetMaxMana());
                }
            });
        });
        EmitSoundOn('DOTA_Item.Cheese.Activate', this.GetOwner().m_eHero);
    }
}

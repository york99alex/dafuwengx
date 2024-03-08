import { IsValid } from '../../utils/amhc';
import { Card } from '../card';

/**团队之手 30006*/
export class Card_EVENT_Hand_Of_Midas extends Card {
    m_sName: string = '团队之手';
    isCanCastMove(): boolean {
        return true;
    }
    isCanCastInPrison(): boolean {
        return true;
    }
    OnSpellStart(): void {
        GameRules.PlayerManager.m_tabPlayers.forEach(player => {
            if (IsValid(player.m_eHero) && !player.m_bDie) {
                player.setGold(500);
                // 飘金
                GameRules.GameConfig.showGold(player, 500);
            }
        });
        EmitGlobalSound('DOTA_Item.Hand_Of_Midas');
    }
}

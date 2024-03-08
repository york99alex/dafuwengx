import { Card } from '../card';

/**骰子-6 30011 */
export class Card_EVENT_Card_Roll_6 extends Card {
    m_sName: string = '骰子-6';
    OnSpellStart(): void {
        GameRules.HeroSelection.GiveAllPlayersSort();
    }
}

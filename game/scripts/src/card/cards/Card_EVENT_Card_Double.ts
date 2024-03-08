import { Card } from '../card';

/**卡牌双雄 30008 */
export class Card_EVENT_Card_Double extends Card {
    m_sName: string = '卡牌双雄';
    isCanCastMove(): boolean {
        return true;
    }
    isCanCastInPrison(): boolean {
        return true;
    }
    isCanCastHeroAtk(): boolean {
        return true;
    }
    isCanCastBZ(): boolean {
        return false;
    }
    isCanCastHero(): boolean {
        return false;
    }
    OnSpellStart(): void {
        const player = this.GetOwner();
        let card = GameRules.CardFactory.create(
            GameRules.CardManager.tSupplyCards[RandomInt(0, GameRules.CardManager.tSupplyCards.length - 1)].CardType,
            player.m_nPlayerID
        );
        if (card) {
            player.setCardAdd(card);
            card = null;
        }
        card = GameRules.CardFactory.create(
            GameRules.CardManager.tSupplyCards[RandomInt(0, GameRules.CardManager.tSupplyCards.length - 1)].CardType,
            player.m_nPlayerID
        );
        if (card) player.setCardAdd(card);
    }
}

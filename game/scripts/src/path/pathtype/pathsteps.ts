import { KeyValues } from '../../kv';
import { Player } from '../../player/player';
import { getRandomsInRange } from '../../utils/amhc';
import { Path } from '../Path';

export class PathSteps extends Path {
    tSupplyCards: any[] = [];

    constructor(entity: CBaseEntity) {
        super(entity);

        for (const key in KeyValues.CardKV) {
            const cardInfo = KeyValues.CardKV[key];
            if (cardInfo.IsSupply && tonumber(cardInfo.IsSupply) == 1) {
                this.tSupplyCards.push(cardInfo);
            }
        }
    }

    onPath(player: Player): void {
        super.onPath(player);

        const card = GameRules.CardFactory.create(this.tSupplyCards[RandomInt(0, this.tSupplyCards.length - 1)].CardType, player.m_nPlayerID);
        // const card = GameRules.CardFactory.create(CardType.Card_BUFF_Bloodrage, player.m_nPlayerID);
        if (card) player.setCardAdd(card);
    }

    randomCard(count: number) {
        const randoms = getRandomsInRange(0, this.tSupplyCards.length - 1, count);
        for (const num of randoms) {
        }
    }
}

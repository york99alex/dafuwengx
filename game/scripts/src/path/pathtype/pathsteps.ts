import { KeyValues } from '../../kv';
import { GameRecord } from '../../mode/S2Cmode/GameRecord';
import { Player } from '../../player/player';
import { getRandomsInRange } from '../../utils/amhc';
import { Path } from '../Path';

export class PathSteps extends Path {
    constructor(entity: CBaseEntity) {
        super(entity);

        for (const key in KeyValues.CardKV) {
            const cardInfo = KeyValues.CardKV[key];
            if (cardInfo.IsSupply && tonumber(cardInfo.IsSupply) == 1) {
                GameRules.CardManager.tSupplyCards.push(cardInfo);
            }
        }
    }

    onPath(player: Player): void {
        super.onPath(player);

        const card = GameRules.CardFactory.create(GameRules.CardManager.tSupplyCards[RandomInt(0, GameRules.CardManager.tSupplyCards.length - 1)].CardType, player.m_nPlayerID);
        // const card = GameRules.CardFactory.create(CardType.Card_EVENT_Card_Roll_3, player.m_nPlayerID);
        if (card) player.setCardAdd(card);
    }

    randomCard(count: number) {
        const randoms = getRandomsInRange(0, GameRules.CardManager.tSupplyCards.length - 1, count);
        for (const num of randoms) {
        }
    }
}

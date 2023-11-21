import { TSBaseItem } from "../ability/tsBaseItem"
import { CardID_MONSTER, CardID_NONE } from "../mode/gamemessage"
import { Player } from "../player/player"
import { CardFactory } from "./cardfactory"

export class CardManager {
    static EvtID = {
        Event_CardUseRequest: "Event_CardUseRequest"   // 请求使用卡牌
    }
    m_tabCards = []
    m_tGetCardCount: {
        [playerid: number]: {
            [type: number]: number
        }
    }    // 记录给玩家发牌的数量{playerid,{type,count}}
    m_nIncludeID = 0

    /**初始化 */
    init() {
        this.registerEvent()
    }

    registerEvent() {

    }

    /**获取卡牌自增ID */
    getIncludeID() {
        return this.m_nIncludeID++
    }

    /**通用装备激活卡牌 */
    onItem_getCard(item: TSBaseItem, player: Player, cardType: string) {
        const cardID = this.getCardType(cardType, player, item)
        if (cardID) {
            const card = CardFactory.create(cardID, player.m_nPlayerID)
            if (card)
                player.setCardAdd(card)
        }
    }

    /**获取卡牌类型 */
    getCardType(cardType: string, player: Player, item: TSBaseItem): number {
        let cardID: number
        switch (cardType) {
            case "HERO":

                break;
            case "MONSTER":
                const keys = Object.keys(CardID_MONSTER)
                const i = keys[RandomInt(1, keys.length)]
                cardID = CardID_MONSTER[i]
                break;
            case "ITEM":
                cardID = item.GetSpecialValueFor("card_type")
                break;
            default:
                cardID = CardID_NONE
                break;
        }
        return cardID
    }

}
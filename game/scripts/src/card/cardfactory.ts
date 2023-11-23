import { KeyValues } from "../kv";
import { Card, CardInfo } from "./card";
import { Card_MAGIC_InfernalBlade } from "./cards/Card_MAGIC_InfernalBlade";
import { Card_MONSTER_ANCIENT } from "./cards/Card_MONSTER_ANCIENT";
import { Card_MONSTER_CREEP_STACKING } from "./cards/Card_MONSTER_CREEP_STACKING";
import { Card_MONSTER_LARGE } from "./cards/Card_MONSTER_LARGE";
import { Card_MONSTER_SMALL } from "./cards/Card_MONSTER_SMALL";

export class CardFactory {

    static create(cardType: number, nPlayerID: PlayerID): Card {
        // 获取卡牌信息
        if (KeyValues.CardKV) {
            for (const key in KeyValues.CardKV) {
                const value = KeyValues.CardKV[key]
                if (cardType == tonumber(value.CardType)) {
                    print("===CardFactory===new:", key)
                    const cardInstance = createCardInstance(key, value, nPlayerID)
                    if (!cardInstance || !value) return
                    if (cardInstance) return cardInstance
                    if (value) return new Card(value, nPlayerID)
                }
            }
        }
    }
}

function createCardInstance(className: string, cardInfo: CardInfo, nPlayerID: PlayerID) {
    const classMap: { [key: string]: new (cardInfo: CardInfo, nPlayerID: PlayerID) => any } = {
        Card_MAGIC_InfernalBlade,
        Card_MONSTER_SMALL,
        Card_MONSTER_LARGE,
        Card_MONSTER_ANCIENT,
        Card_MONSTER_CREEP_STACKING,

    }

    const selectedClass = classMap[className];
    if (selectedClass) {
        return new selectedClass(cardInfo, nPlayerID);
    } else {
        throw new Error(`Class with name ${className} not found`);
    }
}
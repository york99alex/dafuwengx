import { KeyValues } from '../kv';
import { Card, CardInfo } from './card';
import { Card_BUFF_Bloodrage } from './cards/Card_BUFF_Bloodrage';
import { Card_EVENT_DoDoBrother } from './cards/Card_EVENT_DoDoBrother';
import { Card_EVENT_Infernal_Blade_333 } from './cards/Card_EVENT_Infernal_Blade_333';
import { Card_EVENT_Shop } from './cards/Card_EVENT_Shop';
import { Card_MAGIC_Bottle } from './cards/Card_MAGIC_Bottle';
import { Card_MAGIC_BottleArcane } from './cards/Card_MAGIC_BottleArcane';
import { Card_MAGIC_BottleBounty } from './cards/Card_MAGIC_BottleBounty';
import { Card_MAGIC_BottleDouble } from './cards/Card_MAGIC_BottleDouble';
import { Card_MAGIC_BottleHaste } from './cards/Card_MAGIC_BottleHaste';
import { Card_MAGIC_BottleInvisibility } from './cards/Card_MAGIC_BottleInvisibility';
import { Card_MAGIC_BottleRegeneration } from './cards/Card_MAGIC_BottleRegeneration';
import { Card_MAGIC_BottleShield } from './cards/Card_MAGIC_BottleShield';
import { Card_MAGIC_BottleXP } from './cards/Card_MAGIC_BottleXP';
import { Card_MAGIC_Card_Steal } from './cards/Card_MAGIC_Card_Steal';
import { Card_MAGIC_Glimpse } from './cards/Card_MAGIC_Glimpse';
import { Card_MAGIC_InfernalBlade } from './cards/Card_MAGIC_InfernalBlade';
import { Card_MAGIC_ReversePolarity } from './cards/Card_MAGIC_ReversePolarity';
import { Card_MAGIC_Swap } from './cards/Card_MAGIC_Swap';
import { Card_MONSTER_ANCIENT } from './cards/Card_MONSTER_ANCIENT';
import { Card_MONSTER_CREEP_STACKING } from './cards/Card_MONSTER_CREEP_STACKING';
import { Card_MONSTER_LARGE } from './cards/Card_MONSTER_LARGE';
import { Card_MONSTER_SMALL } from './cards/Card_MONSTER_SMALL';

export class CardFactory {
    create(cardType: number, nPlayerID: PlayerID): Card {
        // 获取卡牌信息
        if (KeyValues.CardKV) {
            for (const key in KeyValues.CardKV) {
                const value = KeyValues.CardKV[key];
                if (cardType == tonumber(value.CardType)) {
                    print('===CardFactory===new:', key);
                    const cardInstance = createCardInstance(key, value, nPlayerID);
                    if (!cardInstance || !value) return;
                    if (cardInstance) return cardInstance;
                    if (value) return new Card(value, nPlayerID);
                }
            }
        }
    }
}

function createCardInstance(className: string, cardInfo: CardInfo, nPlayerID: PlayerID) {
    const classMap: { [key: string]: new (cardInfo: CardInfo, nPlayerID: PlayerID) => any } = {
        Card_MONSTER_SMALL,
        Card_MONSTER_LARGE,
        Card_MONSTER_ANCIENT,
        Card_MONSTER_CREEP_STACKING,
        Card_MAGIC_Card_Steal,
        Card_MAGIC_Swap,
        Card_MAGIC_ReversePolarity,
        Card_MAGIC_Glimpse,
        Card_MAGIC_InfernalBlade,
        Card_MAGIC_Bottle,
        Card_MAGIC_BottleArcane,
        Card_MAGIC_BottleBounty,
        Card_MAGIC_BottleDouble,
        Card_MAGIC_BottleHaste,
        Card_MAGIC_BottleInvisibility,
        Card_MAGIC_BottleRegeneration,
        Card_MAGIC_BottleShield,
        Card_MAGIC_BottleXP,
        Card_BUFF_Bloodrage,
        Card_EVENT_DoDoBrother,
        Card_EVENT_Shop,
        Card_EVENT_Infernal_Blade_333,
    };

    const selectedClass = classMap[className];
    if (selectedClass) {
        return new selectedClass(cardInfo, nPlayerID);
    } else {
        throw new Error(`Class with name ${className} not found`);
    }
}

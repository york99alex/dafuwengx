import { TSBaseItem } from '../item/tsBaseItem';
import { CardID_MONSTER, CardID_NONE, TCardCast_Nil, TCardCast_Pos, TCardCast_Target, TypeOprt } from '../constants/gamemessage';
import { Player } from '../player/player';
import { Card } from './card';
import { CardFactory } from './cardfactory';

export class CardManager {
    static EvtID = {
        Event_CardUseRequest: 'Event_CardUseRequest', // 请求使用卡牌
    };
    m_tabCards: Card[] = [];
    m_tGetCardCount: {
        [playerid: number]: {
            [type: number]: number;
        };
    } = {}; // 记录给玩家发牌的数量{playerid,{type,count}}
    m_nIncludeID = 0;
    tSupplyCards: any[] = []; // 参与补给的卡牌KV

    /**初始化 */
    init() {
        this.registerEvent();
    }

    registerEvent() {
        GameRules.EventManager.Register(
            CardManager.EvtID.Event_CardUseRequest,
            (event: {
                nPlayerID: number;
                nCardID: number;
                typeOprt: number;
                nPosX?: number;
                nPosY?: number;
                nPosZ?: number;
                nTargetEntID?: EntityIndex;
            }) => this.onEvent_CardUseRequest(event)
        );
    }

    /**玩家请求使用卡牌 */
    onEvent_CardUseRequest(event: {
        nPlayerID: number;
        nCardID: number;
        typeOprt: number;
        nPosX?: number;
        nPosY?: number;
        nPosZ?: number;
        nTargetEntID?: EntityIndex;
    }) {
        print('===CardManager.onEvent_CardUseRequest===');
        DeepPrintTable(event);
        if (!event.nCardID || !event.nPlayerID) return;
        const player = GameRules.PlayerManager.getPlayer(event.nPlayerID);
        const card = GameRules.CardManager.getCardByID(event.nCardID);
        let castType = 0;
        let nResult = 1;
        if (card) {
            if (event.nPlayerID == card.m_nOwnerID) {
                // 判断施法目标
                if ((card.m_typeCast & TCardCast_Target) > 0) {
                    print('===castfilert===0 targetname:', EntIndexToHScript(event.nTargetEntID).GetName());
                    print('===castfilert===0 GetModelName:', EntIndexToHScript(event.nTargetEntID).GetModelName());
                    if (
                        event.nTargetEntID &&
                        UnitFilterResult.SUCCESS == card.CastFilterResultTarget(EntIndexToHScript(event.nTargetEntID) as CDOTA_BaseNPC)
                    ) {
                        castType = TCardCast_Target;
                        nResult = 0;
                    }
                } else if ((card.m_typeCast & TCardCast_Pos) > 0) {
                    if (
                        event.nPosX &&
                        event.nPosY &&
                        event.nPosZ &&
                        UnitFilterResult.SUCCESS == card.CastFilterResultLocation(Vector(event.nPosX, event.nPosY, event.nPosZ))
                    ) {
                        castType = TCardCast_Pos;
                        nResult = 0;
                    }
                } else if ((card.m_typeCast & TCardCast_Nil) > 0) {
                    if (UnitFilterResult.SUCCESS == card.CastFilterResult()) {
                        castType = TCardCast_Nil;
                        nResult = 0;
                    }
                }
                print('[onEvent_CardUseRequest]: card type is ', card.m_typeCard, '  card cast type is ', card.m_typeCast);
            }
        } else if (card == null) {
            print('error!:===card is null===');
            return;
        }
        const tabData = {
            nPlayerID: event.nPlayerID,
            nCardID: event.nCardID,
            nRequest: nResult,
            typeOprt: TypeOprt.TO_UseCard,
        };
        print('use card nResult = ' + (nResult == 0 ? '成功' : '失败'));
        if (nResult == 0) {
            tabData['CardType'] = card.m_typeCard;
            tabData['CardKind'] = card.m_typeKind;
            tabData['ManaCost'] = card.GetManaCost();
            tabData['nTargetEntID'] = event.nTargetEntID;
            tabData['nPosX'] = event.nPosX;
            tabData['nPosY'] = event.nPosY;
            tabData['nPosZ'] = event.nPosZ;

            // 使用卡牌
            card.GetOwner().spendPlayerMana(card.GetManaCost());
            card.OnSpellStart();
            // 删除卡牌
            card.destory();

            // 广播全部玩家
            GameRules.PlayerManager.broadcastMsg('GM_OperatorFinished', tabData);

            // 游戏记录
            // TODO: GameRecord
        } else {
            // 失败，通知请求玩家
            player.sendMsg('GM_OperatorFinished', tabData);
            card.onCastError();
        }

        print('GM_OperatorFinished=========================');
        DeepPrintTable(tabData);
        print('GM_OperatorFinished=========================');
    }

    /**获取卡牌自增ID */
    getIncludeID() {
        return this.m_nIncludeID++;
    }

    /**通过ID获取卡牌 */
    getCardByID(cardID: number) {
        print('===getCardByID: ', cardID);
        this.m_tabCards.forEach(card => {
            print('cardID: ', card.m_nID, '===cardName:', card.m_typeCard);
        });
        for (const card of this.m_tabCards) {
            if (card.m_nID == cardID) return card;
        }
    }

    /**获取卡牌类型 */
    getCardType(cardType: string, player: Player, item: TSBaseItem): number {
        let cardID: number;
        switch (cardType) {
            case 'HERO':
                break;
            case 'MONSTER':
                const keys = Object.keys(CardID_MONSTER);
                const i = keys[RandomInt(0, keys.length - 1)];
                cardID = CardID_MONSTER[i];
                break;
            case 'ITEM':
                cardID = item.GetSpecialValueFor('card_type');
                break;
            default:
                cardID = CardID_NONE;
                break;
        }
        return cardID;
    }

    /**通用装备激活卡牌 */
    onItem_getCard(item: TSBaseItem, player: Player, cardType: string) {
        const cardID = this.getCardType(cardType, player, item);
        print('===onItem_getCard===itemname:', item.GetName(), 'cardID:', cardID);
        if (cardID) {
            const card = GameRules.CardFactory.create(cardID, player.m_nPlayerID);
            if (card) {
                player.setCardAdd(card);
            }
        }
    }
}

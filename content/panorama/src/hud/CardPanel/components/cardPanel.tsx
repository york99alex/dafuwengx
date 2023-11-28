import { useGameEvent, useNetTableKey } from 'react-panorama-x';
import { HandCard } from '../handCard';
import { useEffect, useState } from 'react';
import Card from './card';
import { TypeOperator } from '../../mode/constant';

export default function CardPanel() {
    // 存储本地玩家手牌（playerID索引无效，stupid略略略）
    type CardList = {
        [playerID: number]: {
            [cardID: number]: HandCard;
        };
    };
    // 初始化
    const [cardlist, setCardList] = useState<CardList>({});

    // 更新手牌方法
    function updateCardList(playerID: number, cardID: number, handCard?: HandCard) {
        setCardList(prevData => {
            console.log('===updateCardList===', playerID, cardID, handCard);
            // 使用对象解构，如果 handCard 不存在，则删除对应的 cardID 索引项
            const { [cardID]: deletedCard, ...updatedCards } = prevData[playerID] || {};

            return {
                ...prevData,
                [playerID]: {
                    ...updatedCards,
                    ...(handCard ? { [cardID]: handCard } : {}),
                },
            };
        });
    }

    /**新增手牌 */
    useGameEvent(
        'S2C_GM_CardAdd',
        event => {
            console.log('===S2C_GM_CardAdd===' + event.json);
            const eventJson = JSON.parse(event.json as any);

            if (event.nPlayerID == Players.GetLocalPlayer()) {
                const handCard = new HandCard({
                    nCardID: eventJson.nCardID,
                    cardType: eventJson.cardType,
                    cardKind: eventJson.cardKind,
                    castType: eventJson.castType,
                    nManaCost: eventJson.nManaCost,
                });
                updateCardList(event.nPlayerID, handCard.nCardID, handCard);
                GetCardAnim(handCard.nCardID);
            } else {
                return;
            }
        },
        []
    );

    /**接收操作请求 */
    useGameEvent(
        'GM_OperatorFinished',
        event => {
            if (event.typeOprt == TypeOperator.TO_UseCard) {
                if (event.nRequest == 1) {
                    PlayerUseCard(event);
                } else if (event.nRequest == 1) {
                    // 使用卡牌失败
                    PlayerUseFaild();
                }
            }
        },
        []
    );

    /**动画：获取卡牌 */
    function GetCardAnim(cardID: number) {
        const cardContainer = $.GetContextPanel().FindChildTraverse(`Card_${cardID}`);
        if (!cardContainer) return;
        console.log('===GetCardAnim');
        cardContainer.AddClass('GetCardAnim');
    }

    /**动画：删除卡牌 */
    function DelCardAnim(cardID: number) {
        const cardContainer = $.GetContextPanel().FindChildTraverse(`Card_${cardID}`);
        if (!cardContainer) return;
        console.log('===DelCardAnim');
        cardContainer.AddClass('DelCardAnim');
    }

    /**玩家使用卡牌 */
    function PlayerUseCard(event: {
        nPlayerID: number;
        typeOprt: number;
        nCardID: number;
        nRequest: number;
        typeCard: number;
        nManaCost: number;
        nTargetEntID: number;
        nPosX: number;
        nPosY: number;
        nPosZ: number;
    }) {
        // 判断是否是当前玩家
        if (event.nPlayerID != Players.GetLocalPlayer()) {
            // 删除卡牌动画
            DelCardAnim(event.nCardID);
            // 删除卡牌数据
            // 重排卡牌
        }
        // 更新游戏记录
        console.log('event.nPlayerID:' + event.nPlayerID);
        console.log('event.typeOprt:' + event.typeOprt);
        console.log('event.nRequest:' + event.nRequest);
        console.log('event.nCardID:' + event.nCardID);
        console.log('event.typeCard:' + event.typeCard);
        console.log('event.nManaCost:' + event.nManaCost);
        updateCardList(event.nPlayerID, event.nCardID);
    }

    /**玩家使用卡牌失败 */
    function PlayerUseFaild() {}

    // 依赖cardlist更新后的render渲染以后的副操作
    // useEffect(() => {}, [cardlist]);

    // const testlist = {
    //     0: {
    //         1: new HandCard({ nCardID: 0, nManaCost: 2, cardType: 10006, cardKind: 1, castType: 1 }),
    //         2: new HandCard({ nCardID: 1, nManaCost: 0, cardType: 10007, cardKind: 2, castType: 2 }),
    //         3: new HandCard({ nCardID: 2, nManaCost: 1, cardType: 10007, cardKind: 3, castType: 4 }),
    //         4: new HandCard({ nCardID: 3, nManaCost: 1, cardType: 10007, cardKind: 3, castType: 2 }),
    //         5: new HandCard({ nCardID: 4, nManaCost: 1, cardType: 10007, cardKind: 3, castType: 1 }),
    //     },
    // };

    const arrows = [0, 1, 2, 3, 4, 5, 6];

    return (
        <Panel id="CardBody">
            <Panel id="Arrow">
                {arrows.map(num => {
                    return (
                        <Image
                            key={num}
                            id={`arrow_${num}`}
                            className="arrowsize"
                            hittest={false}
                            visible={false}
                            src={`file://{images}/custom_game/arrow_png.png`}
                        />
                    );
                })}
            </Panel>
            <Panel className="CardPanel">
                {Object.entries(cardlist[Players.GetLocalPlayer()] || {}).map(([cardID, handCard]) => {
                    return <Card key={cardID} card={handCard} count={Object.keys(cardlist[0] || {}).length} />;
                })}

                {/* {Object.entries(testlist[0] || {}).map(([cardID, handCard]) => {
                    return <Card key={cardID} card={handCard} count={Object.keys(testlist[0] || {}).length} />;
                })} */}
            </Panel>
        </Panel>
    );
}

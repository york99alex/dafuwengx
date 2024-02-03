import { useGameEvent, useNetTableKey } from 'react-panorama-x';
import { HandCard } from '../handCard';
import { useEffect, useState } from 'react';
import Card from './card';
import { TypeOprt } from '../../mode/constant';

export default function CardPanel() {
    // 存储本地玩家手牌（playerID索引无效，stupid略略略）
    type CardList = {
        [cardID: number]: HandCard;
    };
    // 初始化
    const [cardlist, setCardList] = useState<CardList>({});
    const arrows = [0, 1, 2, 3, 4, 5, 6];

    // 更新手牌方法
    function updateCardList(cardID: number, handCard?: HandCard) {
        setCardList(prevData => {
            console.log('===updateCardList===LocalPlayer:', Players.GetLocalPlayer(), handCard);
            // 使用对象解构，如果 handCard 不存在，则删除对应的 cardID 索引项
            const { [cardID]: deletedCard, ...updatedCards } = prevData;

            // TODO: 排序，先依据重复cardType插入，否则追加到最后

            return {
                ...updatedCards,
                ...(handCard ? { [cardID]: handCard } : {}),
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
                updateCardList(handCard.nCardID, handCard);
            } else {
                return;
            }
            console.log('===cardlist===GM_CardAdd', cardlist);
        },
        []
    );

    /**接收操作请求 */
    useGameEvent(
        'GM_OperatorFinished',
        event => {
            if (event.typeOprt == TypeOprt.TO_UseCard) {
                if (event.nRequest == 0) {
                    PlayerUseCard(event);
                } else if (event.nRequest == 1) {
                    // 使用卡牌失败
                    PlayerUseFaild();
                }
            }
        },
        []
    );

    /**动画：删除卡牌 */
    function DelCardAnim(cardID: number) {
        const cardContainer = $.GetContextPanel().FindChildTraverse(`Card_${cardID}`);
        if (!cardContainer) return;
        console.log('===DelCard===Anim');
        cardContainer.AddClass('DelCard');
        cardContainer.hittest = false;
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
        if (event.nPlayerID == Players.GetLocalPlayer()) {
            // 删除卡牌动画
            DelCardAnim(event.nCardID);
            // 删除卡牌数据
            setTimeout(() => updateCardList(event.nCardID), 2000);
            // 重排卡牌
        }
        // 更新游戏记录
        console.log('event.nPlayerID:' + event.nPlayerID);
        console.log('event.typeOprt:' + event.typeOprt);
        console.log('event.nRequest:' + event.nRequest);
        console.log('event.nCardID:' + event.nCardID);
        console.log('event.typeCard:' + event.typeCard);
        console.log('event.nManaCost:' + event.nManaCost);
    }

    /**玩家使用卡牌失败 */
    function PlayerUseFaild() {}

    /**游戏开始时配合动画修改透明度 */
    // useEffect(() => {
    //     const curPanel = $.GetContextPanel().FindChildrenWithClassTraverse('CardPanel')[0];
    //     setTimeout(() => {
    //         curPanel.style.opacity = '0.95';
    //     }, 3000);
    // }, []);

    return (
        <Panel id="CardBody" hittest={false}>
            <Panel id="Arrow" hittest={false}>
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
            <Panel className="CardPanel" hittest={false} visible={true}>
                {Object.entries(cardlist || {}).map(([cardID, handCard]) => {
                    return <Card key={cardID} card={handCard} count={Object.keys(cardlist || {}).length} />;
                })}
            </Panel>
        </Panel>
    );
}

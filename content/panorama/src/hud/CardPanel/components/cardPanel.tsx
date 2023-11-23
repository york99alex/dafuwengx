import { useGameEvent, useNetTableKey } from 'react-panorama-x';
import { HandCard } from '../handCard';
import { useEffect, useState } from 'react';
import Card from './card';

export default function CardPanel() {
    // 存储所有玩家手牌
    type CardList = {
        [playerID: number]: {
            [cardID: number]: HandCard;
        };
    };
    // 初始化
    const [cardlist, setCardList] = useState<CardList>({});
    // 更新手牌方法
    const updateCardList = (playerID: number, cardID: number, handCard?: HandCard) => {
        setCardList(prevData => {
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
    };

    useGameEvent('S2C_GM_CardAdd', event => {
        console.log('===S2C_GM_CardAdd===' + event.json);
        // console.log(event.json);

        if (event.nPlayerID == Players.GetLocalPlayer()) {
            for (const key in event.json) {
                const handCard = new HandCard(event.json[key]);
                updateCardList(event.nPlayerID, handCard.nCardID, handCard);
            }
        }
    });

    // TODO: cardlist更新后的render渲染以后的副操作
    // useEffect(() => {}, [cardlist]);

    const testlist = {
        0: {
            1: new HandCard({ nCardID: 0, nManaCost: 2, cardType: 10006, cardKind: 1, castType: 1 }),
            2: new HandCard({ nCardID: 1, nManaCost: 0, cardType: 10007, cardKind: 2, castType: 1 }),
            3: new HandCard({ nCardID: 2, nManaCost: 1, cardType: 10007, cardKind: 3, castType: 1 }),
        },
    };

    return (
        <Panel className="CardPanel">
            {/* {Object.entries(cardlist[Players.GetLocalPlayer()] || {}).map(([cardID, handCard]) => {
                <Card key={cardID} card={handCard}></Card>;
            })} */}

            {Object.entries(testlist[0] || {}).map(([cardID, handCard]) => {
                return <Card key={cardID} card={handCard} />;
            })}
        </Panel>
    );
}

import { useEffect, useRef, useState } from 'react';
import { HandCard } from '../handCard';
import { TypeCard, TypeOprt } from '../../mode/constant';

export default function Card({ card, count }: { card: HandCard; count: number }) {
    console.log(card);
    const cardContainer = useRef<Panel | null>();
    const Arrow = $.GetContextPanel().GetParent()!.GetParent()!.FindChildTraverse('Arrow');
    const arrows: ImagePanel[] = [];
    for (let i = 0; i < 7; i++) {
        arrows.push(
            $.GetContextPanel()
                .GetParent()!
                .GetParent()!
                .FindChildTraverse('arrow_' + i) as ImagePanel
        );
    }
    let coNum: number;

    useEffect(() => {
        if (!cardContainer.current) return;
        $.RegisterEventHandler('DragStart', cardContainer.current, OnDragStart);
        $.RegisterEventHandler('DragEnd', cardContainer.current, OnDragEnd);
        const marginRight = Math.round(((1 - 7 / (3 * (count - 1))) * 30 ) * 100) / 100;
        cardContainer.current!.style.marginRight = marginRight > 0 ? `-${marginRight}%` : '0';
        cardContainer.current!.SetPanelEvent('onmouseover', () => cardContainer.current?.AddClass('hover'));
        cardContainer.current!.SetPanelEvent('onmouseout', () => cardContainer.current?.RemoveClass('hover'));
        IsHiddenArrow(true);
    });

    const OnDragStart = (panel: string, dragCallBack: DragSettings) => {
        // dragCallBack.displayPanel = cardContainer.current!;
        dragCallBack.displayPanel = $.CreatePanel('Panel', cardContainer.current!, 'cache');
        if (isNilCastCard(card.castType)) {
            // 无施法目标
            // TODO: 没有施法目标的卡牌该如何设置打出引导的效果
        } else {
            // 有施法目标，取消隐藏箭头
            IsHiddenArrow(false, cardContainer.current!);
        }
    };
    // TODO: 鼠标拖回卡牌区域，箭头变为隐藏或者红色，表示放弃操作
    // 依据箭头类型
    const OnDragEnd = (panel: string, displayPanel: Panel) => {
        displayPanel.DeleteAsync(0);
        IsHiddenArrow(true, cardContainer.current!);
        let mouseCursor = GameUI.GetCursorPosition();
        let screenwidth = Game.GetScreenWidth();
        let screenheight = Game.GetScreenHeight();
        if (mouseCursor[0] < screenwidth * 0.25 && mouseCursor[1] > screenheight * 0.8) {
            // 取消施法
            return;
        } else {
            console.log('[Card]cardPanel.OnDragEnd===cardID:', card);
            SendTagert(card.nCardID, card.castType);
        }
    };

    /**是否隐藏提示箭头 */
    function IsHiddenArrow(value: boolean, cardItem?: Panel) {
        Arrow!.visible = !value;
        if (!value) {
            let cardPos = cardItem?.style.position?.split('px');
            let cardPanelWidth = cardContainer.current!.GetParent()!.actuallayoutwidth / 2 + 26;
            let y = (Game.GetScreenHeight() * cardContainer.current!.actuallayoutheight) / 2 / 991;
            coNum = setInterval(() => {
                reset(parseInt(cardPos![0]), Game.GetScreenHeight() - y, GameUI.GetCursorPosition()[0], GameUI.GetCursorPosition()[1]);
            }, 10);
        } else {
            if (coNum) {
                clearInterval(coNum);
            }
        }
    }

    /**返回卡牌是否是无目标施法的类型 */
    function isNilCastCard(cardCastType: number) {
        return (cardCastType & TypeCard.TCardCast_Nil) > 0;
    }

    function reset(startPosx: number, startPosy: number, endPosx: number, endPosy: number) {
        let x = Game.GetScreenWidth();
        let y = Game.GetScreenHeight();
        if (endPosx < x * 0.25 && endPosy > y * 0.8) {
            Arrow!.visible = false;
            return;
        }
        Arrow!.visible = true;
        let offsetX = (endPosx - startPosx) / 6;
        let offsetY = (endPosy - startPosy) / 6;
        let angle = Math.atan2(startPosy - endPosy, endPosx - startPosx);
        let theta = angle * (-180 / Math.PI);
        let marginleft = (startPosx / x) * 100 - ((130 * startPosx) / 1768 / x) * 100;
        let marginTop = (startPosy / y) * 100 - ((130 * startPosy) / 1768 / x) * 100;
        let marginleftlast = (endPosx / x) * 100 - ((130 * endPosx) / 1768 / x) * 100;
        let marginToplast = (endPosy / y) * 100 - ((130 * endPosy) / 1768 / x) * 100;
        arrows[0].style.marginLeft = marginleft + '%';
        arrows[0].style.marginTop = marginTop + '%';
        arrows[0].style.preTransformRotate2d = theta + 'deg';
        arrows[arrows.length - 1].style.marginLeft = marginleftlast + '%';
        arrows[arrows.length - 1].style.marginTop = marginToplast + '%';
        arrows[arrows.length - 1].style.preTransformRotate2d = theta + 'deg';
        for (let i = 1; i < arrows.length - 1; i++) {
            let marginleft = ((startPosx + offsetX * i) / x) * 100 - ((130 * (startPosx + offsetX * i)) / 1768 / x) * 100;
            let margintop = ((startPosy + offsetY * i) / y) * 100 - ((130 * (startPosy + offsetY * i)) / 1768 / x) * 100;
            arrows[i].style.marginLeft = marginleft + '%';
            arrows[i].style.marginTop = margintop + '%';
            arrows[i].style.preTransformRotate2d = theta + 'deg';
        }
    }

    /**发送目标至Server端 */
    function SendTagert(cardID: number, castType: number) {
        const mouseCursor = GameUI.GetCursorPosition();
        const entity = GameUI.FindScreenEntities(mouseCursor);
        let stingType = 'CardCast_Error';
        if ((castType & TypeCard.TCardCast_Pos) > 0) {
            const screenPos = Game.ScreenXYToWorld(mouseCursor[0], mouseCursor[1]);
            GameEvents.SendCustomGameEventToServer('GM_Operator', {
                nPlayerID: Players.GetLocalPlayer(),
                nCardID: cardID,
                typeOprt: TypeOprt.TO_UseCard,
                nPosX: screenPos[0],
                nPosY: screenPos[1],
                nPosZ: screenPos[2],
            });
            stingType = 'CardCast_Pos';
        } else if ((castType & TypeCard.TCardCast_Nil) > 0) {
            GameEvents.SendCustomGameEventToServer('GM_Operator', {
                nPlayerID: Players.GetLocalPlayer(),
                nCardID: cardID,
                typeOprt: TypeOprt.TO_UseCard,
            });
            stingType = 'CardCast_Nil';
        } else if ((castType & TypeCard.TCardCast_Target) > 0 && entity.length > 0) {
            const entIndex = entity[0].entityIndex;
            const entityPos = Entities.GetAbsOrigin(entIndex);
            GameEvents.SendCustomGameEventToServer('GM_Operator', {
                nPlayerID: Players.GetLocalPlayer(),
                nCardID: cardID,
                typeOprt: TypeOprt.TO_UseCard,
                nTargetEntID: entIndex,
                nPosX: entityPos[0],
                nPosY: entityPos[1],
                nPosZ: entityPos[2],
            });
            stingType = 'CardCast_Target';
        } else {
            console.error('TypeOperator.TO_UseCard_Error===nCardID:' + cardID + '===CastType:' + stingType);
            // TODO: 前端直接提醒施法错误，无需发送后端
            return;
        }
        console.log('TypeOperator.TO_UseCard===nCardID:' + cardID + '===CastType:' + stingType);
    }

    return (
        <Panel className="CardContainer" id={`Card_${card.nCardID}`} hittest={true} draggable={true} ref={panel => (cardContainer.current = panel)}>
            <Panel className="CardHead">
                <Label className="CardMana" text={card.nManaCost} />
                <Label className="CardName" text={$.Localize(`#Card_${card.cardType}`)} />
            </Panel>
            <Panel className="CardImage" style={{ backgroundImage: `url('file://{images}/custom_game/card/card_${card.cardType}_png.png')` }} />
            <Panel className="CardBottom">
                <Label className="CardDescription" text={$.Localize(`#Card_${card.cardType}_Description`)} />
            </Panel>
            <Label
                style={{ fontSize: '40px' }}
                text={card.nCardID + '\n' + card.cardType + '\n' + card.cardKind + '\n' + card.cardType + '\n' + card.nManaCost}
            />
        </Panel>
    );
}

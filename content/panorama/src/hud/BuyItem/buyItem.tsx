import { useNetTableKey, useNetTableValues } from 'react-panorama-x';
import { player_info } from '../mode/constant';
import { PlayerMgr, UIHud } from '..';
import { HideHudElement } from '../../hero_selection';
import { useEffect } from 'react';

export function BuyItem() {
    const keyname = ('player_info_' + PlayerMgr.playerID) as player_info;
    const { nBuyItem, nGold } = useNetTableKey('GamingTable', keyname)!;

    function onclick() {
        const element = UIHud.FindChildTraverse('shop')!;
        if (element.BHasClass('ShopOpen')) {
            element.RemoveClass('ShopOpen');
            element.AddClass('ShopClosing');
        } else if (element.BHasClass('ShopClosing')) {
            element.RemoveClass('ShopClosing');
            element.AddClass('ShopOpen');
        }
    }

    return (
        <>
            <Button className="ShopButton" onmouseactivate={onclick}>
                <Label className="GoldLabel" text={nGold} hittest={false} />
                <Panel className="GoldIcon" hittest={false} />
            </Button>
            <Label className="BuyItem" text={`购买次数：` + nBuyItem} />
        </>
    );
}

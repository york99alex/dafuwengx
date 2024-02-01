import { useNetTableKey } from 'react-panorama-x';
import { player_info } from '../mode/constant';
import { PlayerMgr, UIHud } from '..';

export function BuyItem() {
    const { nBuyItem, nGold } = useNetTableKey('GamingTable', ('player_info_' + PlayerMgr.playerID) as player_info)!;

    function onclick() {
        const element = UIHud.FindChildTraverse('shop')!;
        if (element.BHasClass('ShopOpen')) {
            element.RemoveClass('ShopOpen');
            element.AddClass('ShopClosing');
        } else {
            element.RemoveClass('ShopClosing');
            element.AddClass('ShopOpen');
        }
    }

    return (
        <Panel className="ShopBlock" hittest={false}>
            <Button className="ShopButton" onmouseactivate={onclick} hittest={true}>
                <Label className="GoldLabel" text={nGold} />
                <Panel className="GoldIcon" />
            </Button>
            <Label className="BuyItem" text={`购买次数：` + nBuyItem} />
        </Panel>
    );
}

import 'panorama-polyfill-x/lib/console';
import 'panorama-polyfill-x/lib/timers';

import { useMemo, type FC, useContext, createContext } from 'react';
import { render, useNetTableKey } from 'react-panorama-x';
import { useXNetTableKey } from '../hooks/useXNetTable';
import { PathPanel } from './PathPanel/components/pathPanel';
import { CountDown } from './CountDown/components/countDown';
import { PrisonPanel } from './PathPanel/components/prisonPanel';
import { HideHudElement } from '../hero_selection';
import CardPanel from './CardPanel/components/cardPanel';
import { BuyItem } from './BuyItem/buyItem';
import { HudError } from './HudError/hudError';
import { Tooltip } from './Tooltip/tooltip';
import { TradePanel } from './Trade/components/tradePanel';
import { PlayerManager } from './player/playerManager';
import { GameManager } from './gamemanager';

const Test: FC = () => {
    // const data = useXNetTableKey(`test_table`, `test_key`, { data_1: `HelloWorld` });
    // const string_data = data.data_1;
    // return useMemo(() => <Label text={`${string_data}`} />, [string_data]);
    return <></>;
};

GameUI.SetDefaultUIEnabled(DotaDefaultUIElement_t.DOTA_DEFAULT_UI_ACTION_MINIMAP, false);
GameUI.SetDefaultUIEnabled(DotaDefaultUIElement_t.DOTA_DEFAULT_UI_AGHANIMS_STATUS, false);
GameUI.SetDefaultUIEnabled(DotaDefaultUIElement_t.DOTA_DEFAULT_UI_INVENTORY_COURIER, false);
GameUI.SetDefaultUIEnabled(DotaDefaultUIElement_t.DOTA_DEFAULT_UI_QUICK_STATS, false);

export const UIHud = $.GetContextPanel().GetParent()!.GetParent()!.GetParent()!;
HideHudElement(UIHud, 'CommonItems');
HideHudElement(UIHud, 'QuickBuySlot8');
HideHudElement(UIHud, 'GridNeutralsTab');
HideHudElement(UIHud, 'ToggleAdvancedShop');
HideHudElement(UIHud, 'inventory_neutral_slot_container');
HideHudElement(UIHud, 'ShopButton');
// HideHudElement(hud, 'stash');

export const PlayerMgr = new PlayerManager();
export const GameMgr = new GameManager();

render(
    <>
        {/* <Test /> */}
        <CountDown />
        <CardPanel />
        <PathPanel />
        <PrisonPanel />
        <BuyItem />
        <HudError />
        <Tooltip />
        <TradePanel />
    </>,
    $.GetContextPanel()
);

console.log(`Hello, Qing Tian Ge!`);

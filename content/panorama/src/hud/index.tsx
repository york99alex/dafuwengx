import 'panorama-polyfill-x/lib/console';
import 'panorama-polyfill-x/lib/timers';

import { useMemo, type FC, useContext, createContext } from 'react';
import { render, useNetTableKey } from 'react-panorama-x';
import { useXNetTableKey } from '../hooks/useXNetTable';
import { HideHudElement } from '../hero_selection';
import CardPanel from './CardPanel/components/cardPanel';
import { BuyItem } from './BuyItem/buyItem';
import { HudError } from './HudError/hudError';
import { Tooltip } from './Tooltip/tooltip';
import { TradePanel } from './Trade/components/tradePanel';
import { PlayerManager } from './player/playerManager';
import { GameManager } from './gamemanager';
import { SupplyPanel } from './Supply/components/SupplyPanel';
import { PathPanel } from './PathPanel/components/pathPanel';
import { PathManager } from './path/PathManager';

const Test: FC = () => {
    // const data = useXNetTableKey(`test_table`, `test_key`, { data_1: `HelloWorld` });
    // const string_data = data.data_1;
    // return useMemo(() => <Label text={`${string_data}`} />, [string_data]);
    return <></>;
};

// for (let index = -1; index <= 32; index++) {
//     GameUI.SetDefaultUIEnabled(index, true);
// }

GameUI.SetDefaultUIEnabled(DotaDefaultUIElement_t.DOTA_DEFAULT_UI_ACTION_MINIMAP, false);
GameUI.SetDefaultUIEnabled(DotaDefaultUIElement_t.DOTA_DEFAULT_UI_AGHANIMS_STATUS, false);
GameUI.SetDefaultUIEnabled(DotaDefaultUIElement_t.DOTA_DEFAULT_UI_INVENTORY_COURIER, false);
GameUI.SetDefaultUIEnabled(DotaDefaultUIElement_t.DOTA_DEFAULT_UI_QUICK_STATS, false);
GameUI.SetDefaultUIEnabled(DotaDefaultUIElement_t.DOTA_DEFAULT_UI_INVENTORY_QUICKBUY, false);
GameUI.SetDefaultUIEnabled(DotaDefaultUIElement_t.DOTA_DEFAULT_UI_INVENTORY_GOLD, false);
GameUI.SetDefaultUIEnabled(DotaDefaultUIElement_t.DOTA_DEFAULT_UI_TOP_BAR, false);
GameUI.SetDefaultUIEnabled(DotaDefaultUIElement_t.DOTA_DEFAULT_UI_FLYOUT_SCOREBOARD, false);

export const UIHud = $.GetContextPanel().GetParent()!.GetParent()!.GetParent()!;
HideHudElement(UIHud, 'CommonItems');
HideHudElement(UIHud, 'QuickBuySlot8');
HideHudElement(UIHud, 'GridNeutralsTab');
HideHudElement(UIHud, 'ToggleAdvancedShop');
HideHudElement(UIHud, 'inventory_neutral_slot_container');
HideHudElement(UIHud, 'ShopButton');
HideHudElement(UIHud, 'shop_launcher_bg');
HideHudElement(UIHud, 'ToggleScoreboardButton');
// HideHudElement(UIHud, 'stash');
HideHudElement(UIHud, 'StatBranch');
HideHudElement(UIHud, 'level_stats_frame');



export const PlayerMgr = new PlayerManager();
export const GameMgr = new GameManager();
export const PathMgr = new PathManager();

GameUI.SetCameraDistance(1300);
GameUI.SetCameraPitchMin(0);
GameUI.SetCameraPitchMax(65);

render(
    <>
        {/* <Test /> */}
        <CardPanel />
        <BuyItem />
        <HudError />
        <PathPanel />
        <Tooltip />
        <TradePanel />
        <SupplyPanel />
    </>,
    $.GetContextPanel()
);

console.log(`Hello, Qing Tian Ge!`);

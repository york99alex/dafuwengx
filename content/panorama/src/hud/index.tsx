import 'panorama-polyfill-x/lib/console';
import 'panorama-polyfill-x/lib/timers';

import { useMemo, type FC } from 'react';
import { render, useNetTableKey } from 'react-panorama-x';
import { useXNetTableKey } from '../hooks/useXNetTable';
import { PathPanel } from './PathPanel/components/pathPanel';
import { CountDown } from './CountDown/components/countDown';
import { PrisonPanel } from './PathPanel/components/prisonPanel';
import { HideHudElement } from '../hero_selection';
import CardPanel from './CardPanel/components/cardPanel';

const Test: FC = () => {
    // const data = useXNetTableKey(`test_table`, `test_key`, { data_1: `HelloWorld` });
    // const string_data = data.data_1;
    // return useMemo(() => <Label text={`${string_data}`} />, [string_data]);
    return <></>;
};

render(
    <>
        {/* <Test /> */}
        <CountDown />
        <CardPanel />
        <PathPanel />
        <PrisonPanel />
    </>,
    $.GetContextPanel()
);

console.log(`Hello, Qing Tian Ge!`);

GameUI.SetDefaultUIEnabled(DotaDefaultUIElement_t.DOTA_DEFAULT_UI_ACTION_MINIMAP, false);
GameUI.SetDefaultUIEnabled(DotaDefaultUIElement_t.DOTA_DEFAULT_UI_AGHANIMS_STATUS, false);
GameUI.SetDefaultUIEnabled(DotaDefaultUIElement_t.DOTA_DEFAULT_UI_INVENTORY_COURIER, false);
GameUI.SetDefaultUIEnabled(DotaDefaultUIElement_t.DOTA_DEFAULT_UI_QUICK_STATS, false);

const hud = $.GetContextPanel().GetParent()!.GetParent()!.GetParent()!;
HideHudElement(hud, 'CommonItems');
HideHudElement(hud, 'QuickBuySlot8');
HideHudElement(hud, 'GridNeutralsTab');
HideHudElement(hud, 'ToggleAdvancedShop');
// HideHudElement(hud, 'stash');

import { render } from 'react-panorama-x';

export default function SetUp() {
    function FindDotaHudElement(sElement: string) {
        var BaseHud = $.GetContextPanel()!.GetParent()!.GetParent()!.GetParent()!.GetParent()!;

        console.log('[Panorama]===game state:', Game.GetState(), 'BaseHud id:', BaseHud.id);
        return BaseHud.FindChildTraverse(sElement);
    }

    ShowLoading();

    function ShowLoading() {
        if (Game.GameStateIs(DOTA_GameState.DOTA_GAMERULES_STATE_GAME_IN_PROGRESS)) {
            return;
        } else {
            if (
                Game.GameStateIs(DOTA_GameState.DOTA_GAMERULES_STATE_WAIT_FOR_PLAYERS_TO_LOAD) ||
                Game.GameStateIs(DOTA_GameState.DOTA_GAMERULES_STATE_STRATEGY_TIME)
            ) {
                FindDotaHudElement('PreGame')!.style.opacity = '0';
            } else if (Game.GameStateIs(DOTA_GameState.DOTA_GAMERULES_STATE_HERO_SELECTION)) {
                FindDotaHudElement('PreGame')!.style.opacity = '1';
            }

            $.Schedule(0.5, ShowLoading);
        }
    }

    return <></>;
}

render(<SetUp></SetUp>, $.GetContextPanel());

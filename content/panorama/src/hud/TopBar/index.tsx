import { useEffect, useState } from 'react';
import { render, useNetTableKey, useNetTableValues } from 'react-panorama-x';
import { PlayerInfo } from './components/playerInfo';
import { GameClock } from './components/gameClock';
import { OprtButton } from './components/oprtButton';

render(<TopBar />, $.GetContextPanel());

export function TopBar() {
    const [leftPlayers, setLeftPlayers] = useState<PlayerID[] | null>(null);
    const [rightPlayers, setRightPlayers] = useState<PlayerID[] | null>(null);
    const playersData = useNetTableKey('HeroSelection', 'PlayersSort');
    const { time } = useNetTableKey('GamingTable', 'timeOprt') ?? { time: 0 };

    useEffect(() => {
        if (playersData == null) return;
        const players = Object.values(playersData);
        // const players: PlayerID[] = [0, 0, 0];
        setLeftPlayers(players.slice(0, Math.ceil(players.length / 2)).reverse());
        setRightPlayers(players.slice(Math.ceil(players.length / 2)));
    }, [playersData]);

    return (
        <Panel className="HudTopBar" hittest={false}>
            <Button
                className="ToggleButton Scoreboard"
                onactivate={() => {
                    GameUI.OnToggleScoreboard();
                }}
            ></Button>

            <Panel className="Top Left" hittest={false}>
                {leftPlayers?.map(playerID => (
                    <PlayerInfo key={playerID} playerID={playerID} />
                ))}
            </Panel>
            <GameClock />
            <Panel className="Top Right" hittest={false}>
                {rightPlayers?.map(playerID => (
                    <PlayerInfo key={playerID} playerID={playerID} />
                ))}
            </Panel>
            <Panel className="OprtPanel" hittest={false}>
                <Panel className="CountDown">
                    <DOTAScenePanel
                        id="CountDownScene"
                        hittest={false}
                        map="maps/countdown.vmap"
                        camera="point_camera"
                        light="global_light"
                        particleonly={false}
                    />
                    <Label className="CDLabel" text={time} />
                </Panel>
                <OprtButton />
            </Panel>
        </Panel>
    );
}

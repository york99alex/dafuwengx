import { useEffect, useRef, useState } from 'react';
import { render, useNetTableKey } from 'react-panorama-x';
import { SetHotKey } from '../utils/useful';
import { PlayerBoard } from './components/playerBoard';
import { PlayerMgr } from '../hud';

render(<Scoreboard />, $.GetContextPanel());
export function Scoreboard() {
    const [show, setShow] = useState(false);
    const boardRef = useRef<Panel>(null);

    function getSortedPlayers() {
        return Object.values(CustomNetTables.GetTableValue('HeroSelection', 'PlayersSort') ?? []).concat(
            Array(6 - PlayerMgr.getSortedPlayers().length).fill(-1)
        );
    }

    useEffect(() => {
        SetHotKey(
            'Tab',
            () => setShow(true),
            () => setShow(false)
        );
    }, []);

    useEffect(() => {
        GameUI.OnToggleScoreboard = () => {
            if (boardRef.current) {
                setShow(!show);
            }
        };
    });

    return (
        <Panel className="ScoreboardRoot" ref={boardRef} visible={show} hittest={false}>
            <Panel id="Title">
                <Panel id="Null" />
                <Label id="LvlLabel" className="SubheaderDesc" text={$.Localize('#scoreboard_title_level')} />
                <Label id="TolLabel" className="SubheaderDesc" text={$.Localize('#scoreboard_title_total')} />
                <Label id="GoldLabel" className="SubheaderDesc" text={$.Localize('#scoreboard_title_gold')} />
                <Label id="KillsLabel" className="SubheaderDesc" text={$.Localize('#scoreboard_title_kills')} />
                <Label id="GcldLabel" className="SubheaderDesc" text={$.Localize('#scoreboard_title_gcld')} />
                <Label id="MuteLabel" className="SubheaderDesc" text={$.Localize('#scoreboard_title_mute')} />
            </Panel>
            {getSortedPlayers().map((playerID, index) => (
                <PlayerBoard key={index} playerID={playerID} />
            ))}
        </Panel>
    );
}

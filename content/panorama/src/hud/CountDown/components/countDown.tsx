import { useState } from 'react';
import { useGameEvent, useNetTableKey } from 'react-panorama-x';
import { TypeOprt } from '../../mode/constant';

export function CountDown() {
    const [isDC, setDC] = useState(false);

    useGameEvent(
        'GM_Operator',
        event => {
            if (event.typeOprt == TypeOprt.TO_DeathClearing) {
                setDC(true);
            } else {
                setDC(false);
            }
        },
        []
    );

    return (
        <Panel className="CountDown" style={{ flowChildren: 'down' }}>
            <TextButton
                className="ButtonBevel"
                text={isDC ? $.Localize('#FinishDC') : $.Localize('#FinishRound')}
                onactivate={() => {
                    GameEvents.SendCustomGameEventToServer('GM_Operator', {
                        nPlayerID: Players.GetLocalPlayer(),
                        typeOprt: 0,
                    });
                }}
            />
        </Panel>
    );
}

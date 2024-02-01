import { useState } from 'react';
import { useGameEvent, useNetTableKey } from 'react-panorama-x';
import { TypeOprt } from '../../mode/constant';

export function CountDown() {
    const { time } = useNetTableKey('GamingTable', 'timeOprt') ?? { time: 0 };
    const { nRound } = useNetTableKey('GamingTable', 'round') ?? { nRound: 0 };
    const [isDC, setDC] = useState(false);

    const [nNum1, setNum1] = useState(0);
    const [nNum2, setNum2] = useState(0);

    useGameEvent(
        'GM_OperatorFinished',
        event => {
            if (event.nNum1 && event.nNum2) {
                setNum1(event.nNum1);
                setNum2(event.nNum2);
            }
        },
        []
    );
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

    let baoziTip = '';
    if (nNum1 + nNum2 > 0 && nNum1 == nNum2) {
        baoziTip = '豹子！';
    }

    return (
        <Panel className="CountDown" style={{ flowChildren: 'down' }}>
            <Label className="Round" text={`Round: ${nRound ?? 0}`} />

            <Label className="Number" text={`倒计时: ${time ?? 0}`} />

            <Panel style={{ flowChildren: 'right' }}>
                <TextButton
                    className="ButtonBevel"
                    text="Roll"
                    onactivate={() => {
                        GameEvents.SendCustomGameEventToServer('GM_Operator', {
                            nPlayerID: Players.GetLocalPlayer(),
                            typeOprt: 1,
                        });
                    }}
                />
                <Label className="RollResult" text={` ${nNum1 ?? 0}&${nNum2 ?? 0} ${baoziTip}`} />
            </Panel>

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

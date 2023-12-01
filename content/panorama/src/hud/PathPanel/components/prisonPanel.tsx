import { useState } from 'react';
import { useGameEvent } from 'react-panorama-x';
import { TypeOprt } from '../../mode/constant';

export const PrisonPanel = () => {
    const [isPannelOpen, setIsPanelOpen] = useState(false);

    useGameEvent('GM_Operator', event => {
        if (event.nPlayerID != Players.GetLocalPlayer() || event.typeOprt != TypeOprt.TO_PRISON_OUT) return;
        setIsPanelOpen(true);
        $.Msg('GM_Operator_Prison', event);
    });

    const [requestResult, setRequest] = useState('');
    useGameEvent('GM_OperatorFinished', event => {
        if (event.nPlayerID == Players.GetLocalPlayer() && event.typeOprt == 5 && event.nRequest == 1) {
            setRequest(event.nRequest == 1 ? '买活成功' : '买活失败');
        }
    });

    return (
        <>
            <Panel className={`oprtTip ${isPannelOpen ? 'open' : 'close'}`}>
                <Label className="PathTitle" text={$.Localize('#TypeOperator_Hell')} />
                <Label className="PathDetail" text={$.Localize('#DescriptionContent_Hell')} />
                <Label className="BuyResult" text={`${requestResult}`} />
                <TextButton
                    className="ButtonBevel BuyBack"
                    text="买活"
                    onactivate={() => {
                        GameEvents.SendCustomGameEventToServer('GM_Operator', {
                            nPlayerID: Players.GetLocalPlayer(),
                            typeOprt: 5,
                            nRequest: 1,
                        });
                        setIsPanelOpen(false);
                    }}
                />
                <TextButton
                    className="ButtonBevel Cannel"
                    text="取消"
                    onactivate={() => {
                        GameEvents.SendCustomGameEventToServer('GM_Operator', {
                            nPlayerID: Players.GetLocalPlayer(),
                            typeOprt: 5,
                            nRequest: 0,
                        });
                        setIsPanelOpen(false);
                    }}
                />
            </Panel>
        </>
    );
};

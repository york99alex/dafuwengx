import { useEffect, useState } from 'react';

export default function BotSet() {
    const [hostID, setHostID] = useState<PlayerID>(-1);

    // 获取房主
    useEffect(() => {
        const timer = setInterval(() => {
            const id = CustomNetTables.GetTableValue('HostPlayer', 'hostPlayer')?.hostID;
            if (id != undefined && id >= 0) {
                setHostID(id);
                return;
            }
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    return (
        <Panel className="BotSet">
            <Label className="BotSetText" text={$.Localize('#BotSetText')} />
            <DropDown
                className="DropDown"
                selected={'DropDownLabel0'}
                enabled={hostID == Players.GetLocalPlayer()}
                oninputsubmit={e => {
                    let label = e.GetSelected();
                    if (!label.id) return;
                    let num = parseInt(label.id.charAt(label.id.length - 1));
                    if (num == 7) num = 6 - Game.GetAllPlayerIDs().length;
                    GameEvents.SendCustomGameEventToServer('C2S_Bot_Setting', {
                        setNum: num,
                    });
                }}
            >
                <Label className="DropDownLabel" id={'DropDownLabel0'} text={$.Localize('#BotSetNum0')}></Label>
                {[...Array(6 - Game.GetAllPlayerIDs().length).keys()].map(i => (
                    <Label key={i + 1} className="DropDownLabel" id={'DropDownLabel' + (i + 1)} text={$.Localize('#BotSetNum' + (i + 1))}></Label>
                ))}
                <Label className="DropDownLabel" id={'DropDownLabel7'} text={$.Localize('#BotSetNum7')}></Label>
            </DropDown>
            <Label className="BotSetTip" text={$.Localize('#BotSetTip')} />
        </Panel>
    );
}

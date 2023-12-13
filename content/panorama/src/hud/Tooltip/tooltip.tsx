import { useRef } from 'react';

export function Tooltip() {
    const tooltip = useRef<Panel>(null);
    const cursorTargetEnts = [];
    const cursorEntities = GameUI.FindScreenEntities(GameUI.GetCursorPosition());
    for (let i = 0; i < cursorEntities.length; i++) {
        const entID = cursorEntities[i].entityIndex;
        cursorTargetEnts.push(entID);
        const unitName = Entities.GetUnitName(entID);
        if (unitName.length >= 4) {
            if (unitName.substring(0, 4) == 'rune') {
            } else if (unitName.substring(0, 4) == 'Path') {
            }
        }
    }

    return (
        <Panel className="body" hittest={false}>
            <Panel className="PathTooltip" ref={tooltip}>
                <Panel className="Details">
                    <Panel className="Header">
                        <Label className="PathName" text="" />
                    </Panel>
                    <Panel className="Target">
                        <Label className="Description" text="" />
                    </Panel>
                    <Panel className="BuffDetails">
                        <Label className="Description" text="" />
                    </Panel>
                </Panel>
            </Panel>
        </Panel>
    );
}

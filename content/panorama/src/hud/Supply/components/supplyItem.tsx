import { useEffect, useRef } from 'react';
import { GameMgr, PlayerMgr } from '../..';
import { TypeOprt } from '../../mode/constant';
import { PathType } from '../../path/PathManager';

export function SupplyItem(props: { data: any; index: number }) {
    const item = useRef<Panel>(null);

    function onClick() {
        if (item.current?.BHasClass('Select')) return;

        GameMgr.SendOperatorToServer({
            nPlayerID: Players.GetLocalPlayer(),
            typeOprt: TypeOprt.TO_Supply,
            nRequest: props.index + 1,
        });
    }

    function onRightClick() {
        if (props.data.type == 'item') {
            // 右键触发在商店中打开
            GameEvents.SendEventClientSide('dota_link_clicked', {
                link: 'dota.item.' + props.data.itemName,
                shop: 0,
                recipe: 0,
                nav: 0,
                nav_back: 0,
            });
        }
    }

    useEffect(() => {
        if (!props.data) return;
        if (props.data.nOwnerID != null) {
            item.current?.AddClass('Select');
        }
    }, [props.data]);

    return (
        <Panel className="CenterItem" ref={item}>
            {props.data.type == 'item' ? (
                <DOTAItemImage className="Item" itemname={props.data.itemName} showtooltip={true} onactivate={onClick} oncontextmenu={onRightClick} />
            ) : (
                <Image
                    className="Path"
                    src={`file://{images}/custom_game/path/path${PathType[props.data.pathID]}.png`}
                    onmouseover={panel => $.DispatchEvent('DOTAShowTextTooltip', panel, $.Localize('#PathName_' + props.data.pathID))}
                    onmouseout={panel => $.DispatchEvent('DOTAHideTextTooltip', panel)}
                    onactivate={onClick}
                />
            )}
        </Panel>
    );
}

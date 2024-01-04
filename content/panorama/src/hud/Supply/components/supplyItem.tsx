import { GameMgr, PlayerMgr } from '../..';
import { TypeOprt } from '../../mode/constant';
import { PathType } from '../../path/PathManager';

export function SupplyItem(props: { data: any; index: number }) {
    function onClick() {
        console.log('===SupplyItem Onclick', {
            nPlayerID: PlayerMgr.playerID,
            typeOprt: TypeOprt.TO_Supply,
            nRequest: props.index + 1,
        });

        GameMgr.SendOperatorToServer({
            nPlayerID: PlayerMgr.playerID,
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

    return (
        <Panel className="CenterItem">
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

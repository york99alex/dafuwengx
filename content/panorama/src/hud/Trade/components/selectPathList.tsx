import { PathTradeType, PathType } from '../../path/PathManager';
import { AUCTIONSTATE, TRADESTATE } from '../../mode/constant';

export function SelectPathList(props: { pathIDs: number[]; selectIDs: number[]; SetSelectIDs: Function; tradeState: number }) {
    function onPathHover(pathID: number, btn: Button) {
        $.GetContextPanel().AddClass('hover');
        // 悬浮提示路径信息
        $.DispatchEvent('DOTAShowTextTooltip', btn, $.Localize('#PathName_' + pathID));
    }

    return (
        <>
            {(props.tradeState == AUCTIONSTATE.SendAndWait || props.tradeState == TRADESTATE.BeTrade ? props.selectIDs : props.pathIDs).map(
                (id, index) => {
                    if (PathTradeType.indexOf(PathType[id]) != -1) {
                        return (
                            <Button
                                key={index}
                                className={'PathSelectButton' + (props.selectIDs.indexOf(id) > -1 ? ' Select' : '')}
                                onactivate={() => {
                                    if (props.tradeState != TRADESTATE.None || props.tradeState != AUCTIONSTATE.None) {
                                        props.SetSelectIDs(props.selectIDs);
                                        return;
                                    }
                                    if (props.selectIDs.indexOf(id) > -1) {
                                        props.SetSelectIDs(props.selectIDs.filter(path => path != id));
                                    } else props.SetSelectIDs(props.selectIDs.concat(id));
                                }}
                                onmouseover={btn => onPathHover(id, btn)}
                                onmouseout={btn => $.DispatchEvent('DOTAHideTextTooltip', btn)}
                                style={{
                                    backgroundImage: `url("file://{images}/custom_game/path/path${PathType[id]}.png")`,
                                }}
                            ></Button>
                        );
                    }
                }
            )}
        </>
    );
}

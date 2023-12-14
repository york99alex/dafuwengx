import { useState } from 'react';
import { PathTradeType, PathType } from '../../path/PathManager';

export function SelectPathList(props: { pathIDs: number[]; selectID: number; SetSelectID: Function }) {
    const [isSelect, setSelect] = useState(false);

    function onPathHover(pathID: number, btn: Button) {
        $.GetContextPanel().AddClass('hover');
        // TODO: 悬浮提示路径信息
        $.DispatchEvent('DOTAShowTextTooltip', btn, $.Localize('#PathName_' + pathID));
    }

    return (
        <>
            {props.pathIDs.map((id, index) => {
                if (PathTradeType.indexOf(PathType[id]) != -1) {
                    return (
                        <Button
                            key={index}
                            className={'PathSelectButton' + (props.selectID == index && isSelect ? ' Select' : '')}
                            onactivate={() => {
                                if (props.selectID == index && isSelect) {
                                    props.SetSelectID(-1);
                                    setSelect(!isSelect);
                                } else props.SetSelectID(index);

                                if (!isSelect) setSelect(!isSelect);
                            }}
                            onmouseover={btn => onPathHover(id, btn)}
                            onmouseout={btn => $.DispatchEvent('DOTAHideTextTooltip', btn)}
                            style={{
                                backgroundImage: `url("file://{images}/custom_game/path/path${PathType[id]}.png")`,
                            }}
                        ></Button>
                    );
                }
            })}
        </>
    );
}

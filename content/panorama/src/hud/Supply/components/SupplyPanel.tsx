import { useEffect, useRef, useState } from 'react';
import { useGameEvent, useNetTableKey } from 'react-panorama-x';
import { PlayerPanel } from './playerPanel';
import { SupplyItem } from './supplyItem';
import { TypeOprt } from '../../mode/constant';

export function SupplyPanel() {
    const root = useRef<Panel>(null);
    const supplyData = useNetTableKey('GamingTable', 'supply');
    const [oprtID, setOprtID] = useState(-1);
    const [playerList, setPlayerList] = useState<PlayerID[]>([]);
    const [supplyList, setSupplyList] = useState<any[]>([]);
    const [leftList, setLeftList] = useState<PlayerID[]>([]);
    const [rightList, setRightList] = useState<PlayerID[]>([]);

    // supply有data就始终打开面板
    useEffect(() => {
        if (!supplyData) {
            // console.log('===SupplyPanle data null, supply end');
            root.current?.AddClass('Hidden');
            return;
        } else if (supplyData.nPlayerIDOprt < -1) {
            // console.log('===SupplyPanle oprtID == -2, supply end in 2s, data:', supplyData);
            setSupplyList(Object.values(supplyData.tabSupplyInfo));
            setOprtID(supplyData.nPlayerIDOprt);
            setTimeout(() => {
                root.current?.AddClass('Hidden');
                resetState();
            }, 2000);
            return;
        } else root.current?.RemoveClass('Hidden');
        // console.log('===SupplyPanle useEffect supplyData:', supplyData);
        const tList: PlayerID[] = Object.values(supplyData.tabPlayerID);
        if (playerList.length != tList.length && tList.every((value, index) => value != playerList[index])) setPlayerList(tList);
        setSupplyList(Object.values(supplyData.tabSupplyInfo));
        setOprtID(supplyData.nPlayerIDOprt);
    }, [supplyData]);

    // 左右两侧playerList分列
    useEffect(() => {
        for (let i = 0; i < playerList.length; i++) {
            if (i % 2 == 0) {
                setLeftList(prevList => [...prevList, playerList[i]]);
            } else {
                setRightList(prevList => [...prevList, playerList[i]]);
            }
        }
    }, [playerList]);

    useEffect(() => {
        // console.log('===SupplyPanle leftList:', leftList, 'rightList:', rightList);
    }, [leftList, rightList]);

    function getTipLabel(oprtID: number) {
        switch (oprtID) {
            case -1:
                return $.Localize('#supply_tip_ready');
            case -2:
                return $.Localize('#supply_tip_end');
            default:
                return $.Localize('#supply_tip_turn');
        }
    }

    function resetState() {
        setOprtID(-1);
        setSupplyList([]);
    }

    useGameEvent('GM_Operator', event => {
        if (event.typeOprt == TypeOprt.TO_Supply) {
            // console.log('===Supply GM_Operator event:', event);
        }
    });

    useGameEvent('GM_OperatorFinished', event => {
        if (event.typeOprt == TypeOprt.TO_Supply) {
            // console.log('===Supply GM_OperatorFinished event:', event);
        }
    });

    return (
        <Panel className="SupplyRoot Hidden" ref={root} hittest={true}>
            <Panel className="Title">
                <Label className="TitleLabel" text={$.Localize('#supply_title')} />
                <Label className="TipLabel" text={getTipLabel(oprtID)} />
            </Panel>
            <Panel className="SupplyContain">
                <Panel className="PlayerGrid Left">
                    {leftList.map((playerID, index) => (
                        <PlayerPanel key={index} playerID={playerID} data={supplyList} oprtID={oprtID} />
                    ))}
                </Panel>
                <Panel className="CenterContain">
                    {supplyList.map((supplyData, index) => (
                        <SupplyItem data={supplyData} key={index} index={index} />
                    ))}
                </Panel>
                <Panel className="PlayerGrid Right">
                    {rightList.map((playerID, index) => (
                        <PlayerPanel key={index} playerID={playerID} data={supplyList} oprtID={oprtID} />
                    ))}
                </Panel>
            </Panel>
        </Panel>
    );
}

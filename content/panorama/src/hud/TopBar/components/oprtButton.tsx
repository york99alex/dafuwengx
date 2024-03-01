import { useGameEvent, useNetTableKey } from 'react-panorama-x';
import { PlayerMgr } from '../..';
import { TypeOprt } from '../../mode/constant';
import { useRef, useState } from 'react';

/**
 * 操作面板：
 * 负责Roll点按钮及动画，结束回合按钮，结束死亡清算按钮
 */
export function OprtButton() {
    const [typeOprt, setTypeOprt] = useState(-1);
    const [baoziTip, setBaoziTip] = useState(false);
    const [eventPlayerID, setEventPlayerID] = useState(-1);
    const rollPanel = useRef<Panel>(null);
    const num1Panel = useRef<Panel>(null);
    const num2Panel = useRef<Panel>(null);

    /**接收后端发来的允许操作 */
    useGameEvent(
        'GM_Operator',
        event => {
            setEventPlayerID(event.nPlayerID);
            if (event.nPlayerID == Players.GetLocalPlayer()) {
                switch (event.typeOprt) {
                    case TypeOprt.TO_Roll: {
                        setTypeOprt(TypeOprt.TO_Roll);
                        setBaoziTip(false);
                        // 启动提示骰子动画
                        if (num1Panel.current) {
                            num1Panel.current.style.animationName = 'waitRoll';
                            num1Panel.current.style.animationDuration = '2s';
                            num1Panel.current.style.animationTimingFunction = 'linear';
                            num1Panel.current.style.animationIterationCount = 'infinite';
                        }
                        if (num2Panel.current) {
                            num2Panel.current.style.animationName = 'waitRoll';
                            num2Panel.current.style.animationDuration = '2s';
                            num2Panel.current.style.animationTimingFunction = 'linear';
                            num2Panel.current.style.animationIterationCount = 'infinite';
                        }
                        break;
                    }
                    case TypeOprt.TO_Finish: {
                        setTypeOprt(TypeOprt.TO_Finish);
                        break;
                    }
                }
            } else if (event.typeOprt == TypeOprt.TO_DeathClearing) {
                setTypeOprt(TypeOprt.TO_DeathClearing);
            }
        },
        []
    );

    /**接收后端发来的操作结果 */
    useGameEvent(
        'GM_OperatorFinished',
        event => {
            if (event.typeOprt == TypeOprt.TO_DeathClearing && event.nPlayerID == Players.GetLocalPlayer()) {
                resetState();
            } else if (event.typeOprt == TypeOprt.TO_Finish && event.nRequest == 1) {
                console.log('===Receive Finish Round:', event);
                // 结束回合请求成功，前端重置state
                resetState();
            } else if (event.typeOprt == TypeOprt.TO_Roll) {
                // 向上扔骰子动画
                setTypeOprt(TypeOprt.TO_Roll);
                if (rollPanel.current) {
                    rollPanel.current.style.animationName = 'upRoll';
                    rollPanel.current.style.animationDuration = '0.8s';
                    rollPanel.current.style.animationTimingFunction = 'ease-in-out';
                    rollPanel.current.style.animationIterationCount = '1';
                }
                animateRoll(num1Panel.current!, event.nNum1);
                animateRoll(num2Panel.current!, event.nNum2);
                if (event.nNum1 == event.nNum2) {
                    console.log('===Roll Baozi!!!');
                    setTimeout(() => setBaoziTip(true), 1500);
                }
            }
        },
        []
    );

    // 重置state
    function resetState() {
        setTypeOprt(-1);
        setBaoziTip(false);
        setEventPlayerID(-1);
    }

    /**发送操作 */
    function sendOprt(oprtType: number) {
        if (Game.IsGamePaused() || oprtType != typeOprt) return;
        if (eventPlayerID >= 0 && eventPlayerID != Players.GetLocalPlayer()) return;
        GameEvents.SendCustomGameEventToServer('GM_Operator', {
            nPlayerID: Players.GetLocalPlayer(),
            typeOprt: oprtType,
        });
        console.log('===SendOprt:', {
            nPlayerID: Players.GetLocalPlayer(),
            typeOprt: oprtType,
        });
    }

    /**roll点动画 */
    function animateRoll(panel: Panel, rollNum: number) {
        panel.style.animationName = 'rotateRoll';
        panel.style.animationDuration = '0.05s';
        panel.style.animationDirection = 'alternate';
        let nFps = 15;
        let nClsID = 0;
        for (let i = 1; i < 7; i++) {
            if (panel.BHasClass('RollNum_' + i)) {
                nClsID = i;
                break;
            }
        }

        const funGstID = (val: number | null) => {
            if (val != null) nClsID = val;
            return nClsID;
        };

        const onThink = () => {
            if (0 < nFps) {
                --nFps;
                panel.RemoveClass('RollNum_' + funGstID(null));
                funGstID((Math.floor(Math.random() * 100) % 6) + 1);
                panel.AddClass('RollNum_' + funGstID(null));
                $.Schedule(0.05, onThink);
            } else {
                panel.style.animationDuration = '0s';
                panel.RemoveClass('RollNum_' + nClsID);
                if (panel.id == 'Roll_1') {
                    panel.AddClass('RollNum_' + rollNum);
                } else if (panel.id == 'Roll_2') {
                    panel.AddClass('RollNum_' + rollNum);
                }
            }
        };
        onThink();
    }

    return (
        <Panel className="OprtButton">
            <Panel
                className="RollPanel"
                visible={typeOprt == TypeOprt.TO_Roll}
                hittest={typeOprt == TypeOprt.TO_Roll}
                onactivate={() => sendOprt(TypeOprt.TO_Roll)}
                ref={rollPanel}
            >
                <Panel id="Roll_1" className="Roll" ref={num1Panel} />
                <Panel id="Roll_2" className="Roll" ref={num2Panel} />
            </Panel>
            <Panel className="multicast">
                {baoziTip ? (
                    <DOTAScenePanel
                        id="MultiCastScene"
                        hittest={false}
                        map="maps/multicast.vmap"
                        camera="camera"
                        light="light"
                        particleonly={false}
                    />
                ) : (
                    <></>
                )}
            </Panel>

            <Panel className="FinishPanel" visible={typeOprt == TypeOprt.TO_Finish} onactivate={() => sendOprt(TypeOprt.TO_Finish)}>
                <Label id="FinishLabel" text={$.Localize('#FinishRound')} />
            </Panel>
            <Panel
                className="FinishPanel DeathClearing"
                visible={typeOprt == TypeOprt.TO_DeathClearing && eventPlayerID == Players.GetLocalPlayer()}
                onactivate={() => sendOprt(TypeOprt.TO_DeathClearing)}
            >
                <Label id="DCLabel" text={$.Localize('#FinishDC')} />
            </Panel>
        </Panel>
    );
}

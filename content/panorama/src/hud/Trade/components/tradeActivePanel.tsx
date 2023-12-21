import { useEffect, useMemo, useState } from 'react';
import SelectPlayerList from './selectPlayerList';
import { Player } from '../../player/player';
import { SelectPathList } from './selectPathList';
import { useGameEvent, useNetTableKey } from 'react-panorama-x';
import { TRADESTATE, TypeOprt, player_info } from '../../mode/constant';
import { GameMgr, PlayerMgr } from '../..';

export default function TradeActivePanel(props: { openTradePanel: Function }) {
    const [selectPlayerID, setSelectPlayerID] = useState<PlayerID>(-1);
    const [selectPathIDs, setSelectPathIDs] = useState<number[]>([]);
    const [sliderValue, setSliderValue] = useState(0);
    const [textValue, setTextValue] = useState(0);
    /**是否可以交易，true不在交易中，false在交易中 */
    const [tradeState, setTradeState] = useState<number>(TRADESTATE.None);
    const [tradePaths, setTradePaths] = useState<number[]>([]);

    // 接收的交易请求数据
    const [recvData, setRecvData] = useState<any>({});

    const keyname = ('player_info_' + Players.GetLocalPlayer()) as player_info;
    const nGold = useNetTableKey('GamingTable', keyname)?.nGold ?? 0;

    useEffect(() => {
        console.log('===TradeActivePanel===selectPlayerID:', selectPlayerID, 'selectPathID:', selectPathIDs);
    }, [selectPlayerID, selectPathIDs]);

    function onSliderChanged(val: number) {
        if (tradeState != TRADESTATE.None) return;

        setSliderValue(val);
        setTextValue((nGold * val) / 100);
    }

    function onTextChanged(val: number) {
        setSliderValue((val / nGold) * 100);
        setTextValue(val);
    }

    /**发送交易请求 */
    function sendTrade() {
        if (selectPlayerID == -1 || tradeState != TRADESTATE.None) {
            // 检查合法性
            GameEvents.SendEventClientSide('dota_hud_error_message', {
                sequenceNumber: 0,
                reason: 80,
                message: 'Error_Trade_Failed',
            });
            return;
        } else {
            // 发送交易请求
            GameEvents.SendCustomGameEventToServer('GM_Operator', {
                nPlayerID: PlayerMgr.playerID,
                typeOprt: TypeOprt.TO_TRADE,
                nPlayerIDTrade: PlayerMgr.playerID,
                nPlayerIDTradeBe: selectPlayerID,
                json: {
                    trade: {
                        nGold: textValue,
                        arrPath: selectPathIDs,
                    },
                },
            });
        }
    }

    /**发起交易结果 */
    useGameEvent(
        'GM_OperatorFinished',
        event => {
            console.log('===Trade===GM_OperatorFinished');
            // console.log(event);
            if (
                event.typeOprt == TypeOprt.TO_TRADE &&
                event.nPlayerID == PlayerMgr.playerID &&
                event.nPlayerIDTrade == PlayerMgr.playerID &&
                event.nPlayerIDTradeBe == selectPlayerID
            ) {
                if (event.nRequest == 1) {
                    // 发起交易成功，锁定交易面板
                    setTradeState(TRADESTATE.Trade);
                } else {
                    // 发起交易失败
                    GameEvents.SendEventClientSide('dota_hud_error_message', {
                        sequenceNumber: 0,
                        reason: 80,
                        message: 'Error_Trade_Failed',
                    });
                }
            } else if (
                // 交易完成后的回包
                event.typeOprt == TypeOprt.TO_TRADE_BE &&
                event.nRequest &&
                (event.nPlayerIDTrade == PlayerMgr.playerID || event.nPlayerIDTradeBe == PlayerMgr.playerID)
            ) {
                if(event.nRequest == 1){
                    // 交易成功，重置状态，并提醒玩家
                }else{
                    // 交易失败
                    GameEvents.SendEventClientSide('dota_hud_error_message', {
                        sequenceNumber: 0,
                        reason: 80,
                        message: 'Error_Trade_Failed_'+event.nRequest,
                    });
                }
                setTradeState(TRADESTATE.None);
            }
        },
        []
    );

    /**被交易方收到交易请求
     * 收包：event:{
            nPlayerID: 被交易方,
            nPlayerIDTrade: 发起交易方,
            nPlayerIDTradeBe: 被交易方,
            typeOprt: TypeOprt.TO_TRADE_BE,
            json: data.json,
        };
     */
    useGameEvent(
        'GM_Operator',
        event => {
            console.log('===Trade===Recv===GM_Operator');
            console.log(event);

            if (event.typeOprt == TypeOprt.TO_TRADE_BE && event.nPlayerID == PlayerMgr.playerID && event.nPlayerIDTradeBe == PlayerMgr.playerID) {
                // 收到交易请求，更新交易状态和面板内容
                setTradeState(TRADESTATE.BeTrade);
                setSelectPlayerID(event.nPlayerIDTrade!);
                const eventPaths: number[] = Object.values(event.json.trade.arrPath);
                setSelectPathIDs(eventPaths);
                setTradePaths(eventPaths);
                props.openTradePanel();
                setSliderValue(100);
                setTextValue(event.json.trade.nGold);
                setRecvData(event);
            }
        },
        []
    );

    /**收到交易请求后，确认交易
     * 发包：event:{
            nPlayerID: 被交易方,
            nPlayerIDTrade: 发起交易方,
            nPlayerIDTradeBe: 被交易方,
            typeOprt: TypeOprt.TO_TRADE_BE,
            nRequest: 1
            json: data.json,
        };
     */
    function confirmTrade() {
        const data = recvData;
        data.nRequest = 1;
        data.nPlayerID = PlayerMgr.playerID;
        GameEvents.SendCustomGameEventToServer('GM_Operator', data);
    }

    /**收到交易请求后，取消交易 */
    function cancelTrade() {
        const data = recvData;
        data.nRequest = 0;
        data.nPlayerID = PlayerMgr.playerID;
        data.typeOprt = TypeOprt.TO_TRADE_BE;
        GameEvents.SendCustomGameEventToServer('GM_Operator', data);
    }

    // TODO: 收到交易请求后，点击确认或者取消结束交易后，重置当前的useState数据
    function resetState() {
        // 有没有回包
    }

    return (
        <Panel className="TradeActivePanel" hittest={true}>
            <Label className="TradeTitle" text={tradeState == TRADESTATE.BeTrade ? $.Localize(`#BeTradeTitle`) : $.Localize(`#TradeTitle`)} />
            <Label
                style={{ marginLeft: '10px' }}
                text={tradeState == TRADESTATE.BeTrade ? $.Localize(`#BeTradeTargetTitle`) : $.Localize(`#TradeTargetTitle`)}
            />
            <Panel className="TradeSelectPlayers">
                <SelectPlayerList
                    ids={PlayerMgr.otherPlayers}
                    selectPlayerID={selectPlayerID}
                    SetSelectPlayerID={(id: PlayerID) => setSelectPlayerID(id)}
                    tradeState={tradeState}
                />
                {/* <PlayerSelectList ids={[0, 0, 0, 0, 0, 0]} selectID={selectID} SetSelectID={(id: number) => setSelectID(id)} /> */}
            </Panel>
            <Label style={{ marginLeft: '10px' }} text={$.Localize(`#TradePathTargetTitle`)} />
            <Panel className="TradeSelectPath">
                <SelectPathList
                    // pathIDs={tradeState == TRADESTATE.BeTrade ? tradePaths : [2, 4, 5, 6, 7, 8, 23, 34, 35, 39]}
                    pathIDs={tradeState == TRADESTATE.BeTrade ? tradePaths : Player.getPlayerPath(Players.GetLocalPlayer())}
                    selectIDs={tradeState == TRADESTATE.BeTrade ? tradePaths : selectPathIDs}
                    SetSelectIDs={(ids: number[]) => setSelectPathIDs(ids)}
                    tradeState={tradeState}
                ></SelectPathList>
            </Panel>
            <Panel className="TradeOperateTitle">
                <Label style={{ marginLeft: '10px' }} text={$.Localize(`#TradeGoldCost`)} />
                <Button
                    className="ChangeGold Floor ButtonBevel"
                    onactivate={() => {
                        if (tradeState != TRADESTATE.None) return;
                        setTextValue(Math.floor(textValue / 100) * 100);
                        setSliderValue((Math.floor(textValue / 100) * 100 * 100) / nGold);
                    }}
                >
                    <Label className="ChangeGoldText" text="⌊100⌋" />
                </Button>
                <Button
                    className="ChangeGold Up ButtonBevel"
                    onactivate={() => {
                        if (tradeState != TRADESTATE.None) return;
                        if (textValue + 100 > nGold) {
                            setTextValue(nGold);
                            setSliderValue(100);
                        } else {
                            setTextValue(textValue + 100);
                            setSliderValue(((textValue + 100) * 100) / nGold);
                        }
                    }}
                >
                    <Label className="ChangeGoldText" text="+100" />
                </Button>
                <Button
                    className="ChangeGold Down ButtonBevel"
                    onactivate={() => {
                        if (tradeState != TRADESTATE.None) return;
                        if (textValue - 100 < 0) {
                            setTextValue(0);
                            setSliderValue(0);
                        } else {
                            setTextValue(textValue - 100);
                            setSliderValue(((textValue - 100) * 100) / nGold);
                        }
                    }}
                >
                    <Label className="ChangeGoldText" text="-100" />
                </Button>
            </Panel>
            <Panel className="TradeOperate">
                <Slider
                    className="HorizontalSlider"
                    direction="horizontal"
                    min={0}
                    max={100}
                    value={sliderValue}
                    onvaluechanged={p => onSliderChanged(p.value)}
                />
                <Panel className="PanelTradeGold" hittest={false}>
                    <TextEntry
                        id="TextEntryTradeGold"
                        maxchars={5}
                        text={textValue.toString()}
                        ontextentrychange={p => {
                            // 输入提醒：整数（未验证）
                            const value = parseInt(p.text);
                            if (isNaN(value) || !Number.isInteger(value)) {
                                GameEvents.SendEventClientSide('dota_hud_error_message', {
                                    sequenceNumber: 0,
                                    reason: 80,
                                    message: 'Error_TextNaN',
                                });
                            } else onTextChanged(value);
                        }}
                        enabled={tradeState == TRADESTATE.None}
                    />
                    <Panel className="GoldIcon" hittest={false} />
                </Panel>
            </Panel>
            {tradeState == TRADESTATE.BeTrade ? (
                <Panel className="CheckTrade">
                    <Button className={'ConfirmTrade ButtonBevel'} onactivate={confirmTrade}>
                        <Label style={{ textOverflow: 'shrink' }} text={$.Localize(`#ConfirmTrade`)} />
                    </Button>
                    <Button className={'CancelTrade ButtonBevel'} onactivate={cancelTrade}>
                        <Label style={{ textOverflow: 'shrink' }} text={$.Localize(`#CancelTrade`)} />
                    </Button>
                </Panel>
            ) : (
                <Button className={'SendTradeButton  ' + (tradeState == TRADESTATE.None ? 'ButtonBevel' : '')} onactivate={sendTrade}>
                    <Label
                        className="SendTradeText"
                        text={tradeState == TRADESTATE.None ? $.Localize(`#SendTradeButton`) : $.Localize(`#TradeButtonWait`)}
                    />
                </Button>
            )}
        </Panel>
    );
}

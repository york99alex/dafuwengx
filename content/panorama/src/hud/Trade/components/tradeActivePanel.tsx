import { useEffect, useMemo, useRef, useState } from 'react';
import SelectPlayerList from './selectPlayerList';
import { PlayerManager } from '../../player/playerManager';
import { Player } from '../../player/player';
import { SelectPathList } from './selectPathList';
import { useNetTableKey } from 'react-panorama-x';
import { player_info } from '../../mode/constant';

export default function TradeActivePanel() {
    const [selectPlayerID, setSelectPlayerID] = useState(-1);
    const [selectPathID, setSelectPathID] = useState(-1);
    const [sliderValue, setSliderValue] = useState(0);
    const [textValue, setTextValue] = useState(0);
    const otherPlayers = PlayerManager.getOtherPlayerIDs();

    const keyname = ('player_info_' + Players.GetLocalPlayer()) as player_info;
    const nGold = useNetTableKey('GamingTable', keyname)?.nGold ?? 0;

    useEffect(() => {
        console.log('===TradeActivePanel===selectPlayerID:', selectPlayerID, 'selectPathID:', selectPathID);
    }, [selectPlayerID, selectPathID]);

    function onSliderChanged(val: number) {
        setSliderValue(val);
        setTextValue((nGold * val) / 100);
    }

    function onTextChanged(val: number) {
        setSliderValue((val / nGold) * 100);
        setTextValue(val);
    }

    /**发送交易请求 */
    function sendTrade() {
        // TODO: 检查 selectPlayerID、selectPathID、textValue 合法性
    }

    return (
        <Panel className="TradeActivePanel" hittest={true}>
            <Label className="TradeTitle" text={$.Localize(`#TradeTitle`)} />
            <Label style={{ marginLeft: '10px' }} text={$.Localize(`#TradeTargetTitle`)} />
            <Panel className="TradeSelectPlayers">
                <SelectPlayerList ids={otherPlayers} selectPlayerID={selectPlayerID} SetSelectPlayerID={(id: number) => setSelectPlayerID(id)} />
                {/* <PlayerSelectList ids={[0, 0, 0, 0, 0, 0]} selectID={selectID} SetSelectID={(id: number) => setSelectID(id)} /> */}
            </Panel>
            <Label style={{ marginLeft: '10px' }} text={$.Localize(`#TradePathTargetTitle`)} />
            <Panel className="TradeSelectPath">
                <SelectPathList
                    // pathIDs={Player.getPlayerPath(Players.GetLocalPlayer())}
                    pathIDs={[2, 4, 5, 6, 7, 8, 23, 34, 35, 39]}
                    selectID={selectPathID}
                    SetSelectID={(id: number) => setSelectPathID(id)}
                ></SelectPathList>
            </Panel>
            <Panel className="TradeOperateTitle">
                <Label style={{ marginLeft: '10px' }} text={$.Localize(`#TradeGoldCost`)} />
                <Button
                    className="ChangeGold Floor ButtonBevel"
                    onactivate={() => {
                        setTextValue(Math.floor(textValue / 100) * 100);
                        setSliderValue((Math.floor(textValue / 100) * 100 * 100) / nGold);
                    }}
                >
                    <Label className="ChangeGoldText" text="⌊100⌋" />
                </Button>
                <Button
                    className="ChangeGold Up ButtonBevel"
                    onactivate={() => {
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
                        ontextentrychange={p => onTextChanged(parseInt(p.text))}
                    />
                    <Panel className="GoldIcon" hittest={false} />
                </Panel>
            </Panel>
            <Button className="SendTradeButton ButtonBevel" onactivate={sendTrade}>
                <Label className="SendTradeText" text={$.Localize(`#SendTradeButton`)} />
            </Button>
        </Panel>
    );
}

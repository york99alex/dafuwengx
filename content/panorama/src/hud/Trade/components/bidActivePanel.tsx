import { useEffect, useRef, useState } from 'react';
import { GameMgr, PlayerMgr } from '../..';
import { AUCTIONSTATE, BIDSTATE, AUCTION_ADD_GOLD, TypeOprt, AUCTION_BID_TIME } from '../../mode/constant';
import { SelectPathList } from './selectPathList';
import { checkGold, errorMessage } from './auctionActivePanel';

export function BidActivePanel(props: {
    bidState: any;
    setAuctPaths: Function;
    setBidState: Function;
    setAuctPrice: Function;
    setAuctState: Function;
    setRecvOprtData: Function;
    recvOprtData: any;
    isAuctionOpen: boolean;
    auctState: number;
}) {
    const [sliderValue, setSliderValue] = useState(0);
    // 竞拍价格
    const [bidPrice, setBidPrice] = useState(0);

    // 倒计时进度条
    const progressBar = useRef<ProgressBar>(null);
    const timerIDRef = useRef(0);
    const [countDown, setCountDown] = useState<number>(AUCTION_BID_TIME);

    function onSliderChanged(val: number) {
        const bidPrice = props.recvOprtData?.nGold ?? 0;
        setBidPrice(bidPrice + ((Players.GetGold(Players.GetLocalPlayer()) - bidPrice) * val) / 100);
        console.log('===setSliderValue===4');
        setSliderValue(val);
    }

    /**切换按钮文本 */
    function switchButtonText(bidState: number): string {
        switch (bidState) {
            case BIDSTATE.Wait:
                return $.Localize(`#WaitBidButton`);
            case BIDSTATE.Finish:
                return $.Localize(`#FinishBidButton`);
            default:
                return $.Localize(`#SendBidButton`);
        }
    }

    useEffect(() => {
        if (props.recvOprtData) {
            console.log('===BidActivePanel===useEffect recvOprtData Change :', props.recvOprtData);
            startProgressBar();
            setSliderValue(0);
            setBidPrice(props.recvOprtData?.nGold ?? 100);
        }
    }, [props.recvOprtData]);

    /**发送叫价 */
    function sendBid() {
        console.log('===sendBid:', props.bidState);
        // if (props.bidState == BIDSTATE.Cannt || props.bidState == BIDSTATE.Wait || props.recvOprtData?.nPlayerID == Players.GetLocalPlayer()) return;
        if (props.bidState == BIDSTATE.Finish) {
            // 完成拍卖，点击确认重置面板和状态
            props.setBidState(BIDSTATE.None);
            props.setAuctPaths([]);
            props.setAuctPrice(0);
            props.setAuctState(AUCTIONSTATE.None);
            props.setRecvOprtData(null);
            return;
        }
        // 检查
        if (bidPrice < props.recvOprtData?.nGold + 50) {
            errorMessage('Error_Bid_LessThanLeast');
        } else if (!checkGold(bidPrice)) {
            errorMessage('Error_NeedGold');
        } else {
            GameMgr.SendOperatorToServer({
                nPlayerID: Players.GetLocalPlayer(),
                typeOprt: TypeOprt.TO_BidAuction,
                nGold: bidPrice,
                json: Object.values(props.recvOprtData?.json || []),
            });
            props.setBidState(BIDSTATE.Wait);
        }
    }

    /**开启进度条 */
    function startProgressBar() {
        console.log('startProgressBar');
        stopProgressBar();
        if (progressBar.current) {
            progressBar.current.min = 0;
            progressBar.current.value = countDown;
            progressBar.current.max = AUCTION_BID_TIME;

            const timer = setInterval(() => {
                setCountDown(prevCountDown => {
                    if (prevCountDown >= 0) {
                        progressBar.current!.style.width = `${prevCountDown}%`;
                        return Game.IsGamePaused() ? prevCountDown : prevCountDown - 2;
                    } else {
                        stopProgressBar();
                        return 0;
                    }
                });
            }, 200);
            timerIDRef.current = timer;
        }
    }

    /**关闭进度条 */
    function stopProgressBar() {
        if (timerIDRef.current) {
            console.log('stopProgressBar===timerID:', timerIDRef.current);
            clearInterval(timerIDRef.current);
            timerIDRef.current = 0;
        }
    }

    return (
        <Panel
            className="BidActivePanel"
            style={{ visibility: props.auctState == AUCTIONSTATE.Bid && props.isAuctionOpen ? 'visible' : 'collapse' }}
            hittest={props.auctState == AUCTIONSTATE.Bid && props.isAuctionOpen}
        >
            <Label className="BidTitle" text={props.bidState == BIDSTATE.Finish ? $.Localize(`#BidFinishTitle`) : $.Localize(`#BidTitle`)} />
            <Label style={{ marginLeft: '10px' }} text={$.Localize(`#BidPathTargetTitle`)} />
            <Panel className="BidSelectPath">
                <SelectPathList
                    pathIDs={Object.values(props.recvOprtData?.json || [])}
                    // pathIDs={[2, 3, 4]}
                    selectIDs={Object.values(props.recvOprtData?.json || [])}
                    SetSelectIDs={() => {}}
                    tradeState={props.auctState}
                ></SelectPathList>
            </Panel>
            <Label style={{ marginLeft: '10px' }} text={$.Localize(`#BidSendPlayerTitle`)} />
            <Panel className="SendPlayerInfo">
                <DOTAHeroImage
                    id="Icon"
                    heroname={props.recvOprtData ? Players.GetPlayerSelectedHero(props.recvOprtData.nSendPlayerID) : 'npc_dota_hero_wisp'}
                    heroimagestyle="landscape"
                />
                <Panel style={{ width: '100%', height: '100%', flowChildren: 'down' }}>
                    <Label className="PlayerName" text={props.recvOprtData ? Players.GetPlayerName(props.recvOprtData?.nSendPlayerID) : ''} />
                    <Panel style={{ width: '100%', height: '100%', flowChildren: 'right' }}>
                        <Label className="SendPriceText" text={$.Localize(`#SendPriceText`)} />
                        <Label className="SendPriceNumber" text={props.recvOprtData ? props.recvOprtData.nGold : 0} />
                    </Panel>
                </Panel>
            </Panel>
            <Label style={{ marginLeft: '10px' }} text={$.Localize(`#BidPlayerTitle`)} />
            <Panel className="BidPlayerInfo">
                <DOTAHeroImage
                    id="Icon"
                    heroname={props.recvOprtData ? Players.GetPlayerSelectedHero(props.recvOprtData.nPlayerID) : 'npc_dota_hero_wisp'}
                    heroimagestyle="landscape"
                    visible={props.recvOprtData?.nPlayerID != Players.GetLocalPlayer()}
                />
                <Panel style={{ width: '100%', height: '100%', flowChildren: 'down' }} visible={props.recvOprtData?.nPlayerID != Players.GetLocalPlayer()}>
                    <Label className="PlayerName" text={props.recvOprtData ? Players.GetPlayerName(props.recvOprtData?.nPlayerID) : ''} />
                    <Panel style={{ width: '100%', height: '100%', flowChildren: 'right' }}>
                        <Label
                            className="BidPriceText"
                            text={props.bidState == BIDSTATE.Finish ? $.Localize(`#BidFinishPanelTitle`) : $.Localize(`#BidPanelPrice`)}
                        />
                        <Label className="BidPriceNumber" text={props.recvOprtData ? props.recvOprtData.nGold : 0} />
                    </Panel>
                </Panel>
            </Panel>
            <Panel style={{ width: '100%', height: '20px', flowChildren: 'right' }} visible={props.bidState != BIDSTATE.Finish}>
                <Label style={{ margin: '2px 0 0 10px' }} text={$.Localize(`#BidGoldTitle`)} />
                <Label style={{ color: '#ffcc33', fontSize: '20px', fontWeight: 'bold' }} text={AUCTION_ADD_GOLD} />
            </Panel>
            <Panel className="BidOprtPanel" visible={props.bidState != BIDSTATE.Finish}>
                {props.bidState != BIDSTATE.Cannt && props.bidState != BIDSTATE.Wait ? (
                    <Panel className="BidSliderAndButton">
                        <Slider
                            className="HorizontalSlider"
                            direction="horizontal"
                            min={0}
                            max={100}
                            value={sliderValue}
                            onvaluechanged={p => onSliderChanged(p.value)}
                        />
                        <Panel className="BidButtons">
                            <Button
                                className="ChangeBidGold Floor ButtonBevel"
                                onactivate={() => {
                                    if (props.auctState == AUCTIONSTATE.SendAndWait) return;
                                    const bidVal = Math.floor(bidPrice / 100) * 100;
                                    setSliderValue(
                                        Math.floor(
                                            ((bidVal - (props.recvOprtData?.nGold ?? 0)) * 100) /
                                                (Players.GetGold(Players.GetLocalPlayer()) - (props.recvOprtData?.nGold ?? 0))
                                        )
                                    );
                                    setBidPrice(bidVal);
                                }}
                            >
                                <Label className="ChangeBidGoldText" text="⌊100⌋" />
                            </Button>
                            <Button
                                className="ChangeBidGold Up ButtonBevel"
                                onactivate={() => {
                                    if (props.auctState == AUCTIONSTATE.SendAndWait) return;
                                    const bidVal = bidPrice + 50;
                                    if (!checkGold(bidVal)) {
                                        errorMessage('Error_NeedGold');
                                        return;
                                    }
                                    setSliderValue(
                                        Math.floor(
                                            ((bidVal - (props.recvOprtData?.nGold ?? 0)) * 100) /
                                                (Players.GetGold(Players.GetLocalPlayer()) - (props.recvOprtData?.nGold ?? 0))
                                        )
                                    );
                                    setBidPrice(bidVal);
                                }}
                            >
                                <Label className="ChangeBidGoldText" text="+50" />
                            </Button>
                            <Button
                                className="ChangeBidGold Down ButtonBevel"
                                onactivate={() => {
                                    if (props.auctState == AUCTIONSTATE.SendAndWait) return;
                                    const bidVal = bidPrice - 50;
                                    if (bidVal < 0) return;
                                    setSliderValue(
                                        Math.floor(
                                            ((bidVal - (props.recvOprtData?.nGold ?? 0)) * 100) /
                                                (Players.GetGold(Players.GetLocalPlayer()) - (props.recvOprtData?.nGold ?? 0))
                                        )
                                    );
                                    setBidPrice(bidVal);
                                }}
                            >
                                <Label className="ChangeBidGoldText" text="-50" />
                            </Button>
                        </Panel>
                    </Panel>
                ) : (
                    <Panel className="BidNotEnoughGold" style={{ visibility: props.bidState == BIDSTATE.Cannt ? 'collapse' : 'visible' }}>
                        <Label
                            className="BidNotEnoughGoldText"
                            text={props.bidState == BIDSTATE.Wait ? $.Localize(`#WaitBidButton`) : $.Localize(`#BidNotEnoughGold`)}
                        />
                    </Panel>
                )}
                <Panel className="BidPriceText">
                    <TextEntry
                        className="BidPriceTextEntry"
                        maxchars={5}
                        text={bidPrice.toString()}
                        enabled={props.auctState != AUCTIONSTATE.Bid && props.bidState == BIDSTATE.Cannt}
                        ontextentrychange={p => {
                            // 输入提醒：整数（未验证）
                            const value = parseInt(p.text);
                            if (isNaN(value) || !Number.isInteger(value)) {
                                errorMessage('Error_TextNaN');
                            } else {
                                if (!checkGold(value)) {
                                    errorMessage('Error_NeedGold');
                                    setBidPrice(Players.GetGold(Players.GetLocalPlayer()));
                                    return;
                                } else {
                                    setSliderValue(
                                        Math.floor(
                                            ((value - (props.recvOprtData?.nGold ?? 0)) * 100) /
                                                (Players.GetGold(Players.GetLocalPlayer()) - (props.recvOprtData?.nGold ?? 0))
                                        )
                                    );
                                    setBidPrice(value);
                                }
                            }
                        }}
                    />
                    <Panel className="GoldIcon" hittest={false} />
                </Panel>
            </Panel>
            <Button
                className="SendBidButton ButtonBevel"
                onactivate={sendBid}
                // enabled={props.bidState != BIDSTATE.Cannt && props.bidState != BIDSTATE.Wait && props.recvOprtData?.nPlayerID != Players.GetLocalPlayer()}
            >
                <Label className="SendBidText" text={switchButtonText(props.bidState)} />
            </Button>
            <Panel className="ProgressBar" style={{ visibility: props.bidState == BIDSTATE.Finish ? 'collapse' : 'visible' }}>
                <ProgressBar className="CD" ref={progressBar} />
            </Panel>
        </Panel>
    );
}

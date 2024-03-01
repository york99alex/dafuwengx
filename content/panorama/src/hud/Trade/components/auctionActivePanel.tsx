import { useEffect, useRef, useState } from 'react';
import { SelectPathList } from './selectPathList';
import { AUCTIONSTATE, AUCTION_ADD_GOLD, AUCTION_BID_TIME, BIDSTATE, TypeOprt } from '../../mode/constant';
import { Player } from '../../player/player';
import { GameMgr, PlayerMgr } from '../..';
import { useGameEvent } from 'react-panorama-x';
import { BidActivePanel } from './bidActivePanel';

export default function AuctionActivePanel(props: { isAuctionOpen: boolean; setIsAuctionOpen: Function }) {
    const [selectPathIDs, setSelectPathIDs] = useState<number[]>([]);
    const [auctPaths, setAuctPaths] = useState<number[]>([]);
    const [auctPrice, setAuctPrice] = useState<number>(0);
    /**交易状态*/
    const [auctState, setAuctState] = useState<number>(AUCTIONSTATE.None);

    // 竞拍数据
    const [recvOprtData, setRecvOprtData] = useState<any>(null);

    // 标识本地玩家叫价状态，None：未叫价，Wait：已叫价
    const [bidState, setBidState] = useState<number>(BIDSTATE.None);

    /**发起拍卖 */
    function startAuction() {
        GameMgr.SendOperatorToServer({
            nPlayerID: Players.GetLocalPlayer(),
            typeOprt: TypeOprt.TO_SendAuction,
            nGold: auctPrice,
            json: selectPathIDs,
        });
    }

    function resetState() {
        setSelectPathIDs([]);
        setAuctState(AUCTIONSTATE.None);
        setAuctPaths([]);
        setAuctPrice(0);
        setRecvOprtData(null);
    }

    /**
     *             const sendAllData = {
                nPlayerID: event.nPlayerID,
                nSendPlayerID: event.nPlayerID,
                typeOprt: TypeOprt.TO_BidAuction,
                nGold: event.nGold,
                nAddGold: this.addGold,
                nTotalTime: AUCTION_BID_TIME,
                json: arrPath,
            };
     */
    useGameEvent(
        'GM_Operator',
        event => {
            if (event.typeOprt == TypeOprt.TO_BidAuction) {
                console.log('===Auction===GM_Operator===TO_BidAuction', event);
                // 收到竞拍
                /**
                 * ===Auction===GM_Operator===TO_BidAuction Object [Object: null prototype]
                 * {
                 * nAddGold: 50,
                 * nPlayerID: 0,
                 * nTotalTime: 10,
                 * nSendPlayerID: 0,
                 * nGold: 500,
                 * typeOprt: 1008,
                 *  json: Object [Object: null prototype] { 1: 5 } }
                 */
                setRecvOprtData(event);
                props.setIsAuctionOpen(true);
                if (event.nSendPlayerID == Players.GetLocalPlayer()) {
                    // 自己发起的拍卖，锁定面板更新

                    setAuctState(AUCTIONSTATE.Bid);
                    if (checkGold(event.nGold ?? 0)) {
                        setBidState(BIDSTATE.None);
                    } else {
                        setBidState(BIDSTATE.Cannt);
                    }
                } else {
                    // 他人发起的拍卖
                    setAuctState(AUCTIONSTATE.Bid);
                    if (checkGold(event.nGold ?? 0)) {
                        setBidState(BIDSTATE.None);
                    } else {
                        setBidState(BIDSTATE.Cannt);
                    }
                }
            }
        },
        []
    );

    /**请求回包 */
    useGameEvent(
        'GM_OperatorFinished',
        event => {
            if (event.nPlayerID == Players.GetLocalPlayer() && event.typeOprt != TypeOprt.TO_FinishAuction) {
                if (event.typeOprt == TypeOprt.TO_SendAuction) {
                    console.log('===Auction===GM_OperatorFinished===TO_SendAuction', event);
                    // 发起拍卖回包
                    if (event.nRequest == 1) {
                        // 发起成功
                        setAuctPaths(Object.values(event.json));
                        setAuctPrice(event.nGold ?? 0);
                        setAuctState(AUCTIONSTATE.SendAndWait);
                    } else {
                        // 发起失败，错误提醒
                        GameEvents.SendEventClientSide('dota_hud_error_message', {
                            sequenceNumber: 0,
                            reason: 80,
                            message: 'Error_SendAuction_Failed_' + event.nRequest,
                        });
                    }
                } else if (event.typeOprt == TypeOprt.TO_BidAuction) {
                    console.log('===Auction===GM_OperatorFinished===TO_BidAuction', event);
                    // 竞拍叫价回包，仅叫价玩家能收到
                    /**
                     * nPlayerID
                     * typeOprt
                     * nGold
                     * nRequest
                     */
                    if (event.nRequest == 1) {
                        if (event.nPlayerID == Players.GetLocalPlayer()) {
                            // 叫价成功
                            setBidState(BIDSTATE.Wait);
                        }
                    } else {
                        errorMessage('Error_SendBid_Failed_' + event.nRequest);
                        setBidState(BIDSTATE.None);
                    }
                }
            } else if (event.typeOprt == TypeOprt.TO_FinishAuction) {
                console.log('===Auction===GM_OperatorFinished===TO_FinishAuction', event);
                if (event.nPlayerID == event.nSendPlayerID) {
                    // 无人竞拍
                } else if (event.nPlayerID == -1) {
                    // 取消竞拍
                } else if (event.typeOprt != event.nSendPlayerID) {
                    // 竞拍完成
                }
                // 完成拍卖
                setBidState(BIDSTATE.Finish);
                setSelectPathIDs([]);
            }
        },
        []
    );

    return (
        <>
            <Panel
                className="AuctionActivePanel"
                style={{ visibility: props.isAuctionOpen ? 'visible' : 'collapse' }}
                hittest={props.isAuctionOpen && auctState != AUCTIONSTATE.Bid}
            >
                <Label
                    className="AuctionTitle"
                    text={auctState == AUCTIONSTATE.SendAndWait ? $.Localize(`#BidTitle`) : $.Localize(`#AuctionTitle`)}
                />
                <Label style={{ marginLeft: '10px' }} text={$.Localize(`#TradePathTargetTitle`)} />
                <Panel className="AuctionSelectPath">
                    <SelectPathList
                        // pathIDs={auctState != AUCTIONSTATE.None ? auctPaths : [2, 4, 5, 6, 7, 8, 23, 34, 35, 39]}
                        pathIDs={Player.getPlayerPath(Players.GetLocalPlayer())}
                        selectIDs={auctState != AUCTIONSTATE.None ? auctPaths : selectPathIDs}
                        SetSelectIDs={(ids: number[]) => setSelectPathIDs(ids)}
                        tradeState={auctState}
                    ></SelectPathList>
                </Panel>
                <Panel className="AuctionPrice">
                    <Label style={{ margin: '10px 0 0 10px' }} text={$.Localize(`#AuctionPrice`)} />
                    <TextEntry
                        className="TextEntryAuctionPrice"
                        maxchars={5}
                        text={auctPrice.toString()}
                        enabled={auctState == AUCTIONSTATE.None}
                        ontextentrychange={p => {
                            // 输入提醒：整数（未验证）
                            const value = parseInt(p.text);
                            if (isNaN(value) || !Number.isInteger(value)) {
                                GameEvents.SendEventClientSide('dota_hud_error_message', {
                                    sequenceNumber: 0,
                                    reason: 80,
                                    message: 'Error_TextNaN',
                                });
                            } else setAuctPrice(value);
                        }}
                    />
                    <Panel className="GoldIcon" hittest={false} />
                </Panel>
                <Panel className="AuctionPriceButton">
                    <Button
                        className="ChangeAuctionGold Floor ButtonBevel"
                        onactivate={() => {
                            if (auctState == AUCTIONSTATE.SendAndWait) return;
                            setAuctPrice(Math.floor(auctPrice / 100) * 100);
                        }}
                    >
                        <Label className="ChangeAuctionGoldText" text="⌊100⌋" />
                    </Button>
                    <Button
                        className="ChangeAuctionGold Up ButtonBevel"
                        onactivate={() => {
                            if (auctState == AUCTIONSTATE.SendAndWait) return;
                            setAuctPrice(auctPrice + 100);
                        }}
                    >
                        <Label className="ChangeAuctionGoldText" text="+100" />
                    </Button>
                    <Button
                        className="ChangeAuctionGold Down ButtonBevel"
                        onactivate={() => {
                            if (auctState == AUCTIONSTATE.SendAndWait) return;
                            if (auctPrice - 100 < 0) return;
                            setAuctPrice(auctPrice - 100);
                        }}
                    >
                        <Label className="ChangeAuctionGoldText" text="-100" />
                    </Button>
                </Panel>
                <Label
                    style={{ margin: '10px 0 0 10px', visibility: auctState == AUCTIONSTATE.SendAndWait ? 'visible' : 'collapse' }}
                    text={$.Localize(`#BidPanelTitle`)}
                />
                <Panel className="SendBidInfo" style={{ visibility: auctState == AUCTIONSTATE.SendAndWait ? 'visible' : 'collapse' }}>
                    <DOTAHeroImage
                        id="Icon"
                        heroname={recvOprtData ? Players.GetPlayerSelectedHero(recvOprtData?.nPlayerID) : 'npc_dota_hero_wisp'}
                        heroimagestyle="landscape"
                    />
                    <Panel style={{ width: '100%', height: '100%', flowChildren: 'down' }}>
                        <Label className="PlayerName" text={recvOprtData ? Players.GetPlayerName(recvOprtData?.nPlayerID) : ''} />
                        <Panel style={{ width: '100%', height: '100%', flowChildren: 'right' }}>
                            <Label className="BidPriceText" text={$.Localize(`#BidPanelPrice`)} />
                            <Label className="BidPriceNumber" text={recvOprtData ? recvOprtData.nGold : 0} />
                        </Panel>
                    </Panel>
                </Panel>

                <Button
                    className={'SendAuctionButton  ' + (auctState == AUCTIONSTATE.None ? 'ButtonBevel' : '')}
                    enabled={auctState != AUCTIONSTATE.Bid}
                    onactivate={startAuction}
                >
                    <Label
                        className="SendAuctionText"
                        text={auctState == AUCTIONSTATE.None ? $.Localize(`#SendAuctionButton`) : $.Localize(`#AuctionButtonWait`)}
                    />
                </Button>
            </Panel>
            <BidActivePanel
                bidState={bidState}
                setBidState={setBidState}
                setAuctPaths={setAuctPaths}
                setAuctPrice={setAuctPrice}
                setAuctState={setAuctState}
                setRecvOprtData={setRecvOprtData}
                isAuctionOpen={props.isAuctionOpen}
                auctState={auctState}
                recvOprtData={recvOprtData}
            />
        </>
    );
}

/**错误提醒 */
export function errorMessage(message: string) {
    GameEvents.SendEventClientSide('dota_hud_error_message', {
        sequenceNumber: 0,
        reason: 80,
        message: message,
    });
}

/**检查金钱 */
export function checkGold(price: number): boolean {
    return Players.GetGold(Players.GetLocalPlayer()) >= price;
}

import { PathDomain } from '../path/pathsdomain/pathdomain';
import { Player } from '../player/player';
import { reloadable } from '../utils/tstl-utils';
import { AUCTION_ADD_GOLD, AUCTION_BID_TIME, GAME_MODE, GAME_MODE_ALLPATH, TypePathState } from './constant';
import { TypeOprt } from './gamemessage';

const CancleReason = {
    GCLD: -1,
    SendPlayerDie: -2,
    BidPlayerDie: -3,
};

/**拍卖模块 */
@reloadable
export class Auction {
    /**发起拍卖数据 */
    sendData;
    /**发起玩家id */
    sendPlayerID: number = -1;
    /**起拍金 */
    startGold: number = 0;
    /**最低加价 */
    addGold: number = AUCTION_ADD_GOLD;
    /**所有参与拍卖数据 arr: {{nPlayerID,nGold},...} */
    allJoinBidInfo: {
        nPlayerID: number;
        nGold: number;
    }[];
    /**所有玩家的最后出价 tab: k playerID v nGold */
    lastBidPlayers: { [key: number]: number };
    /**当前出价 */
    curGold = 0;
    /**计时Timer */
    auctionTimer = null;
    /**当前竞拍剩余时间 */
    curBidTime = 0;
    /**拍卖进行状态 */
    aucState = {
        runtime: 0,
        finish: 1,
    };
    /**默认已完成 */
    state = 1;

    static EvtID = {
        Event_TO_SendAuction: 'Event_TO_SendAuction',
        Event_TO_BidAuction: 'Event_TO_BidAuction',
    };

    init() {
        GameRules.EventManager.Register(
            Auction.EvtID.Event_TO_SendAuction,
            (event: { nPlayerID: number; typeOprt: number; nGold: number; json: any }) => this.Process_TO_SendAuction(event)
        );
        GameRules.EventManager.Register(Auction.EvtID.Event_TO_BidAuction, event => this.Process_TO_BidAuction(event));
        GameRules.EventManager.Register('Event_GCLD', (event: { entity: CDOTA_BaseNPC_Hero; path: PathDomain }) => this.onPathGCLD(event));
        GameRules.EventManager.Register('Event_PlayerDie', (event: { player: Player }) => this.onPlayerDie(event));
    }

    /**处理请求：发起交易 */
    Process_TO_SendAuction(event: { nPlayerID: number; typeOprt: number; nGold: number; json: any }) {
        print('===Process_TO_SendAuction:');
        DeepPrintTable(event);
        /**
         * {
            typeOprt                        	= 1007 (number)
            nGold                           	= 555 (number)
            PlayerID                        	= 0 (number)
            json                            	= table: 0x0101f890 (table)
            {
                0                               	= 5 (number)
                1                               	= 6 (number)
                2                               	= 23 (number)
            }
            nPlayerID                       	= 0 (number)
            }
         */
        const arrPath: number[] = Object.values(event.json);
        if (this.state == this.aucState.finish) {
            event['nRequest'] = this.CheckPath(event.nPlayerID, arrPath);
        } else event['nRequest'] = 0;

        PrintSendData('Send_GM_OperatorFinished', event);
        GameRules.PlayerManager.sendMsg('GM_OperatorFinished', event, event.nPlayerID);

        // 发起拍卖
        if (event['nRequest'] == 1) {
            // TODO: 游戏记录

            // 更新拍卖数据
            this.sendData = event;
            this.sendPlayerID = event.nPlayerID;
            this.startGold = event.nGold;
            this.allJoinBidInfo = [];
            this.curGold = event.nGold;
            this.state = this.aucState.runtime;
            this.SetAuctionPathState(TypePathState.Auction);

            // 通知全体玩家
            const sendAllData = {
                nPlayerID: event.nPlayerID,
                nSendPlayerID: event.nPlayerID,
                typeOprt: TypeOprt.TO_BidAuction,
                nGold: event.nGold,
                nAddGold: this.addGold,
                nTotalTime: AUCTION_BID_TIME,
                json: arrPath,
            };
            PrintSendData('SendAll_GM_Operator', sendAllData);
            GameRules.PlayerManager.broadcastMsg('GM_Operator', sendAllData);
            this.StartTimers(sendAllData);
        }
    }

    /**处理请求：发起竞拍 */
    Process_TO_BidAuction(event) {
        print('===Process_TO_BidAuction:');
        DeepPrintTable(event);
        /**
         * {
                typeOprt                        	= 1008 (number)
                json                            	= table: 0x0083ac88 (table)
                {
                }
                nPlayerID                       	= 0 (number)
                PlayerID                        	= 0 (number)
                nGold                           	= 1216 (number)
            }
         */
        const sendData = {};
        const player = GameRules.PlayerManager.getPlayer(event.nPlayerID);
        if (event && this.state == this.aucState.runtime) {
            sendData['nRequest'] = (event => {
                // 获取最后一个出价玩家
                let lastBidPlayer: { nPlayerID: number; nGold: number } = null;
                if (this.allJoinBidInfo.length > 0) {
                    lastBidPlayer = this.allJoinBidInfo[this.allJoinBidInfo.length - 1];
                }
                if (event.nPlayerID != this.sendPlayerID && player && (!lastBidPlayer || event.nPlayerID != lastBidPlayer.nPlayerID)) {
                    const selfLastBid = this.lastBidPlayers[event.nPlayerID];
                    const selfHasGold = player.GetGold() + (selfLastBid ?? 0) >= event.nGold;
                    if (event.nGold && selfHasGold && event.nGold >= this.curGold + this.addGold) return 1;
                    else {
                        print('===BidAuction===BidAuction gold error:', {
                            eventGold: event.nGold,
                            selfHasGold: selfHasGold,
                            thisCurGold: this.curGold,
                            thisAddGold: this.addGold,
                        });
                        return 3; //竞拍金币不符
                    }
                } else {
                    return 2; // 竞拍玩家不符
                }
            })(event);

            if (sendData['nRequest'] == 1) {
                // 给玩家暂扣拍卖的钱
                print('===BidAuction===set gold is:', event.nGold);
                this.lastBidPlayers[event.nPlayerID] = event.nGold;
                player.setGold(-event.nGold);
                // 通知UI显示花费
                CustomGameEventManager.Send_ServerToAllClients('S2C_GM_ShowGold', {
                    nPlayerID: event.nPlayerID,
                    nGold: -event.nGold,
                });

                const lastBid = this.allJoinBidInfo[this.allJoinBidInfo.length - 1];
                if (lastBid) {
                    const lastBidPlayer = GameRules.PlayerManager.getPlayer(lastBid.nPlayerID);
                    lastBidPlayer.setGold(lastBid.nGold);
                    // 通知UI显示花费
                    CustomGameEventManager.Send_ServerToAllClients('S2C_GM_ShowGold', {
                        nPlayerID: lastBid.nPlayerID,
                        nGold: lastBid.nGold,
                    });
                }
                this.allJoinBidInfo.push({
                    nPlayerID: event.nPlayerID,
                    nGold: event.nGold,
                });
            }
        } else sendData['nRequest'] = 0; // 非竞拍状态

        sendData['nPlayerID'] = event.nPlayerID;
        sendData['typeOprt'] = TypeOprt.TO_BidAuction;
        sendData['nGold'] = event.nGold;
        PrintSendData('GM_OperatorFinished', sendData);
        GameRules.PlayerManager.sendMsg('GM_OperatorFinished', sendData, event.nPlayerID);
        if (sendData['nRequest'] == 1) {
            // TODO:游戏记录

            const sendAllData = {
                nPlayerID: event.nPlayerID,
                nSendPlayerID: this.sendPlayerID,
                typeOprt: TypeOprt.TO_BidAuction,
                nGold: event.nGold,
                nAddGold: this.addGold,
                nTotalTime: AUCTION_BID_TIME,
                json: this.sendData.json,
            };
            PrintSendData('SendAll_GM_Operator', sendAllData);
            GameRules.PlayerManager.broadcastMsg('GM_Operator', sendAllData);
            this.StartTimers(sendAllData);
        }
    }

    /**路径被攻城略地
     */
    onPathGCLD(event: { entity: CDOTA_BaseNPC_Hero; path: PathDomain }) {
        
    }

    /**拍卖玩家死亡 */
    onPlayerDie(event: { player: Player }) {

    }

    /**检查玩家路径 */
    CheckPath(nPlayerID: number, arrPath: number[]) {
        const player = GameRules.PlayerManager.getPlayer(nPlayerID);
        if (!player) return 2; // 玩家id错误
        if (arrPath && arrPath.length > 0) {
            const hasBZPaths = [];
            for (const pathID of arrPath) {
                if (!player.isHasPath(pathID)) return 4; // 含未拥有路径
                const path = GameRules.PathManager.getPathByID(pathID);
                if (path['m_tabENPC'] && path['m_tabENPC'].length && path['m_tabENPC'].length > 0) {
                    if (path['m_nPlayerIDGCLD']) return 7; // 包含攻城中的地
                    if (!hasBZPaths[path.m_typePath]) hasBZPaths[path.m_typePath] = [];
                    hasBZPaths[path.m_typePath].push(path);
                }
            }
            if (GAME_MODE == GAME_MODE_ALLPATH) {
                // 连地错误
                return 5;
            }
        } else {
            return 3; // 路径为空
        }
        return 1;
    }

    /**设置路径拍卖状态 */
    SetAuctionPathState(pathState: TypePathState) {
        const arrPath: number[] = Object.values(this.sendData.json);
        for (const pathID of arrPath) {
            const path = GameRules.PathManager.getPathByID(pathID);
            path.setPathState(pathState);
        }
    }

    /**开始竞拍倒计时 */
    StartTimers(data) {
        this.StopTimers();
        this.curBidTime = AUCTION_BID_TIME;
        this.auctionTimer = Timers.CreateTimer(() => {
            if (this.curBidTime >= 0) {
                print('===Auction->Timer:', this.curBidTime);
                CustomNetTables.SetTableValue('GamingTable', 'auction', {
                    remaining: this.curBidTime,
                    bidData: data,
                });
                this.curBidTime--;
                return 1;
            } else {
                CustomNetTables.SetTableValue('GamingTable', 'auction', {
                    remaining: 0,
                    bidData: null,
                });
                this.BitOutTime();
                this.StopTimers();
                return null;
            }
        });
    }

    /**停止竞拍计时 */
    StopTimers() {
        if (this.auctionTimer) Timers.RemoveTimer(this.auctionTimer);
    }

    /**拍卖超时 */
    BitOutTime() {
        this.state = this.aucState.finish;
        // 无人竞拍
        if (!this.allJoinBidInfo || this.allJoinBidInfo.length == 0) {
            print('===Auction->BitOutTime: 无人竞拍');
            GameRules.PlayerManager.broadcastMsg('GM_OperatorFinished', {
                nPlayerID: this.sendPlayerID,
                nSendPlayerID: this.sendPlayerID,
                typeOprt: TypeOprt.TO_FinishAuction,
                nGold: this.startGold,
                json: this.sendData.json,
            });
            // TODO: 游戏记录

            this.ResetData();
            return;
        }

        // 最后一个出价玩家信息
        const bidInfo = this.allJoinBidInfo[this.allJoinBidInfo.length - 1];

        if (!GameRules.PlayerManager.isAlivePlayer(bidInfo.nPlayerID)) {
            this.Cancle(CancleReason.BidPlayerDie);
            return;
        }

        GameRules.PlayerManager.broadcastMsg('GM_OperatorFinished', {
            nPlayerID: bidInfo.nPlayerID,
            nSendPlayerID: this.sendPlayerID,
            typeOprt: TypeOprt.TO_FinishAuction,
            nGold: bidInfo.nGold,
            json: this.sendData.json,
        });

        const sendPlayer = GameRules.PlayerManager.getPlayer(this.sendPlayerID);
        const recvPlayer = GameRules.PlayerManager.getPlayer(bidInfo.nPlayerID);

        // 给发起拍卖的玩家加钱
        sendPlayer.setGold(bidInfo.nGold);
        // 通知UI显示花费
        CustomGameEventManager.Send_ServerToAllClients('S2C_GM_ShowGold', { nGold: bidInfo.nGold, nPlayerID: this.sendPlayerID });

        // 交换土地
        const tabPath: number[] = Object.values(this.sendData.json);
        const addPaths = [];
        for (const pathID of tabPath) {
            const path = GameRules.PathManager.getPathByID(pathID);
            if (!addPaths[path.m_typePath]) addPaths[path.m_typePath] = [];
            addPaths[path.m_typePath].push(path);
        }
        for (const paths of addPaths) {
            sendPlayer.setMyPathsGive(paths, recvPlayer);
        }

        // TODO: 游戏记录

        this.ResetData();
    }

    /**取消拍卖
     * @param reason 取消原因 -1: 有地被攻城 -2: 发起玩家死亡 -3: 竞拍玩家死亡
     */
    Cancle(reason: number) {
        CustomNetTables.SetTableValue('GamingTable', 'auction', { remaining: 0, bidData: null });
        const lastBid = this.allJoinBidInfo[this.allJoinBidInfo.length - 1];
        if (lastBid && reason != CancleReason.BidPlayerDie) {
            const lastBidPlayer = GameRules.PlayerManager.getPlayer(lastBid.nPlayerID);
            lastBidPlayer.setGold(lastBid.nGold);
            // 通知UI显示花费
            CustomGameEventManager.Send_ServerToAllClients('S2C_GM_ShowGold', { nGold: lastBid.nGold, nPlayerID: lastBid.nPlayerID });
        }

        GameRules.PlayerManager.broadcastMsg('GM_OperatorFinished', {
            nPlayerID: -1, // 竞拍者-1 取消拍卖
            nSendPlayerID: this.sendPlayerID,
            typeOprt: TypeOprt.TO_FinishAuction,
            nGold: this.startGold,
            json: this.sendData.json,
        });
        this.ResetData();
        this.StopTimers();
    }

    /**重置拍卖数据 */
    ResetData() {
        this.SetAuctionPathState(TypePathState.None);
        this.sendData = null;
        this.sendPlayerID = -1;
        this.startGold = 0;
        this.allJoinBidInfo = [];
        this.lastBidPlayers = {};
        this.curGold = 0;
        this.curBidTime = 0;
        this.state = this.aucState.finish;
    }
}

function PrintSendData(title, data) {
    print('===============================================');
    print('===Auction->', title);
    DeepPrintTable(data);
    print('^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^');
}

import { PathDomain } from '../path/pathsdomain/pathdomain';
import { Player } from '../player/player';
import { AUCTION_ADD_GOLD } from './constant';

/**拍卖模块 */
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
        GameRules.EventManager.Register(Auction.EvtID.Event_TO_SendAuction, event => this.Process_TO_SendAuction(event));
        GameRules.EventManager.Register(Auction.EvtID.Event_TO_BidAuction, event => this.Process_TO_BidAuction(event));
        GameRules.EventManager.Register('Event_GCLD', (event: { entity: CDOTA_BaseNPC_Hero; path: PathDomain }) => this.onPathGCLD(event));
        GameRules.EventManager.Register('Event_PlayerDie', (event: { player: Player }) => this.onPlayerDie(event));
    }

    Process_TO_SendAuction(event) {}

    Process_TO_BidAuction(event) {}

    /**路径被攻城略地
     */
    onPathGCLD(event: { entity: CDOTA_BaseNPC_Hero; path: PathDomain }) {}

    /**拍卖玩家死亡 */
    onPlayerDie(event: { player: Player }) { }
}

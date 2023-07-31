import { Constant } from "./constant"

/**拍卖模块 */
export class Auction {
    sendData  //  发起拍卖数据
    sendPlayerID = -1 //  发起玩家id
    startGold = 0 //  起拍金
    addGold = Constant.AUCTION_ADD_GOLD //  最低加价
    allJoinBidInfo: {
        nPlayerID: number,
        nGold: number
    }[] //  所有参与拍卖数据 arr: {{nPlayerID,nGold},...}
    lastBidPlayers: { [key: number]: number }
    //  所有玩家的最后出价 tab: k playerID v nGold
    curGold = 0 //  当前出价
    auctionTimer = null //  计时Timer
    curBidTime = 0 //  当前竞拍剩余时间
    //  拍卖进行状态
    aucState = {
        runtime: 0,
        finish: 1
    }
    state = 1 //  默认已完成
    static EvtID = {
        Event_TO_SendAuction: "Event_TO_SendAuction",
        Event_TO_BidAuction: "Event_TO_BidAuction"
    }
}
export const TypeCard = {
    TCardCast_Nil: 1,
    TCardCast_Pos: 2,
    TCardCast_Target: 4,
};

export const TypeOprt = {
    TO_Finish: 0,
    TO_Roll: 1,
    TO_AYZZ: 2,
    TO_GCLD: 3,
    TO_TP: 4,
    TO_PRISON_OUT: 5,
    TO_AUCTION: 6,
    TO_DeathClearing: 7,
    TO_Supply: 8,
    TO_AtkMonster: 9,
    TO_RandomCard: 10,
    TO_Free: 1000,
    TO_ZBMM: 1001,
    TO_YJXR: 1002,
    TO_XJGT: 1003,
    TO_TREASURE: 1004,
    TO_TRADE: 1005,
    TO_TRADE_BE: 1006,
    TO_SendAuction: 1007,
    TO_BidAuction: 1008,
    TO_FinishAuction: 1009,
    TO_UseCard: 1010,
};

export type player_info = 'player_info_0' | 'player_info_1' | 'player_info_2' | 'player_info_3' | 'player_info_4' | 'player_info_5';

export const TRADESTATE = {
    None: 0,
    Trade: 1,
    BeTrade: 2,
};

export const AUCTIONSTATE = {
    None: 0,
    SendAndWait: 1,
    Bid: 2,
};

export const BIDSTATE = {
    Cannt: -1,
    None: 0,
    Wait: 1,
    Finish: 2,
};

/**拍卖最低加价 */
export const AUCTION_ADD_GOLD: number = 50;
/**竞拍倒计时时间 0.1s */
export const AUCTION_BID_TIME: number = 100;

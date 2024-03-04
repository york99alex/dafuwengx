export const TypeCard = {
    TCardCast_Nil: 1,
    TCardCast_Pos: 2,
    TCardCast_Target: 4,
};

//  游戏状态
export const GS_None = 0;
export const GS_Begin = 1;
export const GS_RoundBefore = 1;
export const GS_Wait = 2;
export const GS_WaitOperator = 3;
export const GS_Move = 4;
export const GS_Finished = 5;
export const GS_DeathClearing = 6;
export const GS_Supply = 7; //  补给阶段
export const GS_ReadyStart = 8; //  准备开始
export const GS_End = 9;


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
    TO_MuteTrade: 1011,
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

// 路径类型
/**无*/
export const TP_NONE = 0;
/**起点 */
export const TP_START = 1;
/**宝藏 */
export const TP_TREASURE = 2;
/**TP点 */
export const TP_TP = 3;
/**神符 */
export const TP_RUNE = 4;
/**未知事件 */
export const TP_UNKNOWN = 5;
/**拍卖行 */
export const TP_AUCTION = 6;
/**监狱 */
export const TP_PRISON = 7;
/**肉山 */
export const TP_ROSHAN = 8;
/**小野 */
export const TP_MONSTER_1 = 9;
/**大野 */
export const TP_MONSTER_2 = 10;
/**远古野 */
export const TP_MONSTER_3 = 11;
/**领地1号 天辉 */
export const TP_DOMAIN_1 = 12;
/**领地2号 河道 */
export const TP_DOMAIN_2 = 13;
/**领地3号 蛇沼 */
export const TP_DOMAIN_3 = 14;
/**领地4号 夜魇 */
export const TP_DOMAIN_4 = 15;
/**领地5号 龙谷 */
export const TP_DOMAIN_5 = 16;
/**领地6号 鵰巢 */
export const TP_DOMAIN_6 = 17;
/**领地7号 圣所 */
export const TP_DOMAIN_7 = 18;
/**领地8号 */
export const TP_DOMAIN_8 = 19;
/**领地结束 */
export const TP_DOMAIN_End = 1000;
/**台阶 */
export const TP_STEPS = 1001;
/**边路商店 */
export const TP_SHOP_SIDE = 1002;
/**神秘商店 */
export const TP_SHOP_SECRET = 1003;
/**野怪路径集合 */
export const TP_MONSTERS = [TP_MONSTER_1, TP_MONSTER_2, TP_MONSTER_3];

/**每等级经验 */
export const LEVEL_EXP: Record<number, number> = {
    1: 1,
    2: 2,
    3: 3,
    4: 4,
    5: 5,
    6: 6,
    7: 8,
    8: 10,
    9: 12,
    10: 14,
    11: 16,
    12: 18,
    13: 20,
    14: 22,
    15: 24,
    16: 27,
    17: 30,
    18: 33,
    19: 36,
    20: 39,
    21: 42,
    22: 45,
    23: 48,
    24: 51,
    25: 54,
};

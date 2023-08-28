export namespace GameMessage {
    //  游戏状态
    export const GS_None = 0
    export const GS_Begin = 1
    export const GS_Wait = 2
    export const GS_WaitOperator = 3
    export const GS_Move = 4
    export const GS_Finished = 5
    export const GS_DeathClearing = 6
    export const GS_Supply = 7           //  补给阶段
    export const GS_ReadyStart = 8       //  准备开始
    export const GS_End = 9

    //  玩家状态
    export const PS_None = 0
    export const PS_Moving = 1               //  移动中
    export const PS_AtkBZ = 2                //  兵卒可攻击
    export const PS_AtkHero = 4              //  英雄可攻击
    export const PS_MagicImmune = 8          //  魔免
    export const PS_PhysicalImmune = 16      //  物免
    export const PS_AbilityImmune = 32       //  技能免疫
    export const PS_Rooted = 64              //  禁止移动
    export const PS_Trading = 128            //  交易中
    export const PS_Die = 256                //  死亡
    export const PS_InPrison = 512           //  入狱
    export const PS_AtkMonster = 1024        //  刷野
    export const PS_Pass = 2048              //  跳过回合(被眩晕，睡眠等)
    export const PS_Invis = 4096             //  隐身


    //  购物状态
    export const TBuyItem_None = 0           //  不能购买
    export const TBuyItem_Side = 1           //  可够边路商店物品
    export const TBuyItem_Secret = 2         //  可够神秘商店物品
    export const TBuyItem_SideAndSecret = 3  //  可够边路和神秘商店物品

    // 路径类型
    export const TP_NONE = 0  // 无
    export const TP_START = 1  // 起点
    export const TP_TREASURE = 2  // 宝藏
    export const TP_TP = 3  // TP点
    export const TP_RUNE = 4  // 神符
    export const TP_UNKNOWN = 5  // 未知事件
    export const TP_AUCTION = 6  // 拍卖行
    export const TP_PRISON = 7  // 监狱
    export const TP_ROSHAN = 8  // 肉山
    export const TP_MONSTER_1 = 9  // 小野
    export const TP_MONSTER_2 = 10  // 大野
    export const TP_MONSTER_3 = 11  // 远古野
    export const TP_DOMAIN_1 = 12  // 领地1号 天辉
    export const TP_DOMAIN_2 = 13  // 领地2号 河道
    export const TP_DOMAIN_3 = 14  // 领地3号 蛇沼
    export const TP_DOMAIN_4 = 15  // 领地4号 夜魇
    export const TP_DOMAIN_5 = 16  // 领地5号 龙谷
    export const TP_DOMAIN_6 = 17  // 领地6号 鵰巢
    export const TP_DOMAIN_7 = 18  // 领地7号 圣所
    export const TP_DOMAIN_8 = 19  // 领地8号
    export const TP_DOMAIN_End = 1000  // 领地结束
    export const TP_STEPS = 1001   // 台阶
    export const TP_SHOP_SIDE = 1002   // 边路商店
    export const TP_SHOP_SECRET = 1003   // 神秘商店

    // 操作类型
    export const TypeOprt = {
        TO_Finish: 0       // 结束回合
        , TO_Roll: 1         // roll点
        , TO_AYZZ: 2         // 安营扎寨
        , TO_GCLD: 3         // 攻城略地
        , TO_TP: 4           // 传送
        , TO_PRISON_OUT: 5   // 出狱
        , TO_AUCTION: 6
        , TO_DeathClearing: 7 // 死亡清算
        , TO_Supply: 8       // 补给轮抽
        , TO_AtkMonster: 9   // 打野
        , TO_RandomCard: 10  // 随机补给卡牌
        , TO_Free: 1000      // 以下为自由操作
        , TO_ZBMM: 1001      // 招兵买马
        , TO_YJXR: 1002      // 养精蓄锐
        , TO_XJGT: 1003      // 解甲归田
        , TO_TREASURE: 1004  // 秘藏探索
        , TO_TRADE: 1005     // 交易
        , TO_TRADE_BE: 1006      // 被交易
        , TO_SendAuction: 1007   // 发起拍卖
        , TO_BidAuction: 1008    // 竞价拍卖
        , TO_FinishAuction: 1009 // 竞拍结束
        , TO_UseCard: 1010       // 使用卡牌
        , TO_MultTrade: 1011     // 屏蔽交易玩家
    }

    // 游戏记录类型
    export const TGameRecord_Roll = 0        // roll点
    export const TGameRecord_AYZZ = 1        // 安营扎寨
    export const TGameRecord_GCLD = 2        // 攻城略地
    export const TGameRecord_YJXR = 3        // 养精蓄锐
    export const TGameRecord_OnRune = 4      // 激活神符
    export const TGameRecord_Treasure = 5    // 秘藏探索
    export const TGameRecord_TP = 6          // TP传送
    export const TGameRecord_Trede = 7       // 交易
    export const TGameRecord_InPrison = 8    // 进监狱(踩入)
    export const TGameRecord_OutPrisonByGold = 9     // 出监狱(买活)
    export const TGameRecord_OutPrisonByRoll = 10    // 出监狱(豹子)
    export const TGameRecord_InPrisonByRoll = 11      // 进监狱(豹子)
    export const TGameRecord_GoldDel = 12            // 扣钱
    export const TGameRecord_GoldAdd = 13            // 加钱
    export const TGameRecord_SendAuction = 14        // 发起拍卖
    export const TGameRecord_BidAuction = 15         // 竞价
    export const TGameRecord_FinishAuction = 16      // 完成拍卖
    export const TGameRecord_XJ = 17                 // 解甲归田
    export const TGameRecord_ChangeGold_Move = 18    // 移动时的金钱变化
    export const TGameRecord_AtkMonster = 19     // 刷野战利品统计
    export const TGameRecord_GCLD_Fail = 20      // 攻城略地失败
    export const TGameRecord_GCLD_Win = 21       // 攻城略地成功
    export const TGameRecord_OUTBZ = 22          // 起兵
    export const TGameRecord_UseCard = 23        // 使用卡牌
    export const TGameRecord_UseCardTarget = 24  // 使用卡牌（对目标）
    export const TGameRecord_NoAuction = 25  // 无人竞拍
    export const TGameRecord_DisconnetOutTime = 26  // 掉线超时
    export const TGameRecord_InPrisonByStart = 27  // 地狱使者，开局入狱
    export const TGameRecord_String = 1000       // 纯文本记录
}
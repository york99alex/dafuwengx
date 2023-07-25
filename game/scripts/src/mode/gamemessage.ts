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
}
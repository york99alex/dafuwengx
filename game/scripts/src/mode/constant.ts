import { GameMessage } from "./gamemessage"

export namespace Constant {
    export const TESTHELP_ALLPATH: boolean = false  // 占领全部地
    export const TESTCARD: boolean = false  // 快速卡牌
    export const TESTITEM: boolean = false  // 全图装备
    export const TESTFREE: boolean = false  // 自由移动
    export const ERRORUPLOAD: boolean = true  // 错误提交

    export const DEBUG: boolean = false  // DEBUG

    export const GAME_MODE_ALLPATH: number = 1  // 全地起兵
    export const GAME_MODE_ONEPATH: number = 2  // 单地起兵
    export const GAME_MODE: number = GAME_MODE_ONEPATH

    export enum TypePathState {
        None = 0,
        Trade = 1,  // 交易
        Auction = 2,    // 拍卖
    }

    // 选择英雄时间  /1s
    export const TIME_SELECTHERO: number = 60
    // 回合操作时限  /0.1s
    export const TIME_OPERATOR: number = 101
    // 回合操作时限（掉线）  /0.1s
    export const TIME_OPERATOR_DISCONNECT: number = 51
    // 豹子加时阈值  /0.1s
    export const TIME_BAOZI_YZ: number = 100
    // 豹子加时时值  /0.1s
    export const TIME_BAOZI_ADD: number = 50
    // 补给操作时限  /0.1s
    export const TIME_SUPPLY_READY: number = 101
    // 补给操作时限  /0.1s
    export const TIME_SUPPLY_OPRT: number = 1
    // 掉线超时  /1s
    export const TIME_OUT_DISCONNECT: number = 300
    // 入狱豹子数
    export const PRISON_BAOZI_COUNT: number = 3
    // 兵卒最大等级
    export const BZ_MAX_LEVEL: number = 3
    // 远程兵卒回魔率
    export const BZ_HUIMO_RATE_Y: number = 0.5
    // 近战兵卒回魔率
    export const BZ_HUIMO_RATE_J: number = 0.4
    // 兵卒受伤回魔率
    export const BZ_HUIMO_BEATK_RATE: number = 0.4
    // 寻路卡死检测时间阈值  /0.1s
    export const TIME_MOVEKASI: number = 10
    // 过路费率
    export const PATH_TOLL_RATE: number = 0.5
    // TP点过路费
    export const PATH_TOLL_TP: number[] = [100, 200, 300, 400]
    // 拍卖最低加价
    export const AUCTION_ADD_GOLD: number = 50
    // 竞拍倒计时时间
    export const AUCTION_BID_TIME: number = 10
    // 初始金币 
    export const INITIAL_GOLD: number = 3000
    // 工资金币
    export const WAGE_GOLD: number = 1000
    // 每圈工资降低
    export const WAGE_GOLD_REDUCE: number = 100
    // 全图购物回合
    export const GLOBAL_SHOP_ROUND: number = 25
    // 英雄每回合回血百分百
    export const ROUNT_HERO_HUIXUE_ROTA: number = 0.15
    // 兵卒每回合回血百分百
    export const ROUNT_BZ_HUIXUE_ROTA: number = 0
    // 出狱金币 
    export const GOLD_OUT_PRISON: number = 300
    // 抽卡消耗
    export const SKIN_RANDOM_GOLD: number = 30

    // 每等级经验
    export const LEVEL_EXP: { [key: number]: number } = {
        1: 0,
        2: 1,
        3: 2,
        4: 3,
        5: 4,
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
        25: 54
    }
    // console.log(indexedArray1['foo'])
    // console.log(indexedArray1.foo)

    // 补给回合
    export const SUPPLY_ROUND: number[] = [1, 5, 10, 15, 20]
    // 每回合补给的开启回合 
    export const SUPPLY_ALL_ROUND: number = 30
    // 补给品数量
    export const SUPPLY_COUNT: number[] = [0, 3, 4, 5, 6, 7]

    export const CUSTOM_TEAM = [
        DotaTeam.CUSTOM_1,
        DotaTeam.CUSTOM_2,
        DotaTeam.CUSTOM_3,
        DotaTeam.CUSTOM_4,
        DotaTeam.CUSTOM_5,
        DotaTeam.CUSTOM_6,
    ]

    // 每级兵卒等级上限
    export const BZ_LEVELMAX = [9, 19, 25]

    export const PATH_TO_PRICE = []
    PATH_TO_PRICE[GameMessage.TP_DOMAIN_1] = 200
    PATH_TO_PRICE[GameMessage.TP_DOMAIN_2] = 300
    PATH_TO_PRICE[GameMessage.TP_DOMAIN_3] = 300
    PATH_TO_PRICE[GameMessage.TP_DOMAIN_4] = 350
    PATH_TO_PRICE[GameMessage.TP_DOMAIN_5] = 400
    PATH_TO_PRICE[GameMessage.TP_DOMAIN_6] = 450
    PATH_TO_PRICE[GameMessage.TP_DOMAIN_7] = 500
    PATH_TO_PRICE[GameMessage.TP_DOMAIN_8] = 550
    PATH_TO_PRICE[GameMessage.TP_TP] = 200

    /**英雄对应横幅旗帜 */
    export const HERO_TO_BANNER = {
        npc_dota_hero_phantom_assassin: 1,
        npc_dota_hero_meepo: 2,
        npc_dota_hero_pudge: 3,
        npc_dota_hero_lina: 4,
        npc_dota_hero_zuus: 5,
        npc_dota_hero_axe: 6,
        npc_dota_hero_techies: 7,
        npc_dota_hero_bloodseeker: 8,
        npc_dota_hero_dragon_knight: 9,
        npc_dota_hero_undying: 10,
        npc_dota_hero_life_stealer: 11
    }

    /**英雄对应兵卒名 */
    export const HERO_TO_BZ = {
        npc_dota_hero_phantom_assassin: "bz_pa_1",
        npc_dota_hero_meepo: "bz_meepo_1",
        npc_dota_hero_pudge: "bz_pudge_1",
        npc_dota_hero_lina: "bz_lina_1",
        npc_dota_hero_zuus: "bz_zuus_1",
        npc_dota_hero_axe: "bz_axe_1",
        npc_dota_hero_techies: "bz_techies_1",
        npc_dota_hero_bloodseeker: "bz_bloodseeker_1",
        npc_dota_hero_dragon_knight: "bz_dragon_knight_1",
        npc_dota_hero_undying: "bz_undying_1",
        npc_dota_hero_life_stealer: "bz_life_stealer_1"
    }


    /**起兵回合 */
    export const BZ_OUT_ROUND = 2

    /**地图拐角处 */
    export const PATH_VERTEX = [1, 11, 21, 31]

    /**回合提示 */
    export const RoundTip = []
    RoundTip[Constant.GLOBAL_SHOP_ROUND] = "global_shop"
    RoundTip[Constant.BZ_OUT_ROUND] = "bz_out"

    /**兵卒属性效果 */
    export const ATTRIBUTE = {
        STRENGTH_HP: 20,
        STRENGTH_HP_REGEN: 0.1,
        AGILITY_ATTACK_SPEED: 1,
        AGILITY_PHYSICAL_ARMOR: 0.17,
        INTELLIGENCE_MANA: 0,
        INTELLIGENCE_MANA_REGEN: 0,
        INTELLIGENCE_MAGICAL_RESISTANCE: 0.1,
        PRIMARY_ATTACK_DAMAGE: 1,
        ALL_ATTACK_DAMAGE: 0.6
    }

}
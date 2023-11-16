import { AbilityManager } from "../ability/abilitymanager"
import { CardManager } from "../card/cardmanager"
import { GameLoop } from "../mode/GameLoop"
import { HeroSelection } from "../mode/HeroSelection"
import { Auction } from "../mode/auction"
import { Constant } from "../mode/constant"
import { DeathClearing } from "../mode/deathclearing"
import { Filters } from "../mode/filters"
import { GS_DeathClearing, GS_Finished, GS_Move, GS_None, GS_ReadyStart, GS_Wait, GS_WaitOperator, PS_AtkMonster, PS_InPrison, TBuyItem_SideAndSecret, TGameRecord_AYZZ, TP_PRISON, TypeOprt } from "../mode/gamemessage"
import { GameRecord } from "../mode/gamerecord"
import { HudError } from "../mode/huderror"
import { Trade } from "../mode/trade"
import { PathManager } from "../path/PathManager"
import { PathPrison } from "../path/pathprison"
import { PathDomain } from "../path/pathsdomain/pathdomain"
import { PathTP } from "../path/pathtp"
import { CDOTA_BaseNPC_BZ } from "../player/CDOTA_BaseNPC_BZ"
import { Player, player_info } from "../player/player"
import { PlayerManager } from "../player/playermanager"
import { IsValid } from "../utils/amhc"
import { EventManager } from "../utils/eventmanager"
import { ParaAdjuster } from "../utils/paraadjuster"

export class GameConfig {

    _DotaState: []
    m_typeState = GS_None //游戏状态
    m_nGameID = -1 // 比赛编号
    m_nOrderID: PlayerID = -1 // 当前操作玩家ID
    m_nOrderFirst: PlayerID = -1 // 首操作玩家ID
    m_nOrderIndex = -1
    m_nOrderFirstIndex = 0 // 首操作index
    m_timeOprt: number = -1  // 回合剩余时限
    m_nRound = 0 // 当前回合数
    m_nBaoZi = 0 // 当前玩家豹子次数
    m_bFinalBattle = false // 终局决战
    m_tabEnd: {
        steamid64: string,
        rank_num: number,
        hero_name: string,
        time_game: number,
        is_abandon: boolean
    }[] = [] // 结算数据
    m_bNoSwap: 1 | 0
    m_tabOprtCan: {
        nPlayerID: number,
        typeOprt: number,
        nPathID?: number,
        nRequest?: number,
        bPrison?: number
    }[] = []// 当前全部可操作
    m_tabOprtSend: { nPlayerID: number, typeOprt: number }[] = [] // 当前全部可操作
    m_tabOprtBroadcast: { nPlayerID: number, typeOprt: number }[] = [] // 当前全部可操作
    m_tabChangeGold: number[]
    m_nTimeChangeGold: number
    m_bOutBZ: boolean   // 是否起兵

    constructor() {
        print("[GameConfig] start...开始配置")
        SendToServerConsole('dota_max_physical_items_purchase_limit 9999') // 用来解决物品数量限制问题

        GameRules.SetCustomGameTeamMaxPlayers(DotaTeam.GOODGUYS, 6)
        GameRules.SetCustomGameTeamMaxPlayers(DotaTeam.BADGUYS, 0)
        GameRules.LockCustomGameSetupTeamAssignment(true)   // 锁定队伍分配
        GameRules.SetCustomGameSetupRemainingTime(0)
        GameRules.SetCustomGameSetupAutoLaunchDelay(5)
        GameRules.SetCustomGameSetupTimeout(10)

        // 选择英雄时间
        GameRules.SetHeroSelectionTime(Constant.TIME_SELECTHERO)
        GameRules.SetHeroSelectPenaltyTime(0)
        GameRules.GetGameModeEntity().SetSelectionGoldPenaltyEnabled(false)
        // 设置决策时间
        GameRules.SetStrategyTime(0.5)
        // 设置展示时间
        GameRules.SetShowcaseTime(0)
        // 设置游戏准备时间
        GameRules.SetPreGameTime(3)
        // 游戏结束断线时间
        GameRules.SetPostGameTime(180)
        // 初始金币
        GameRules.SetStartingGold(0)
        // 取消官方工资
        GameRules.SetGoldTickTime(60)
        GameRules.SetGoldPerTick(0)
        // 禁用随机英雄奖励
        GameRules.GetGameModeEntity().SetRandomHeroBonusItemGrantDisabled(true)
        // 无战争迷雾
        GameRules.GetGameModeEntity().SetFogOfWarDisabled(true)
        AddFOWViewer(DotaTeam.GOODGUYS, Vector(0, 0, 0), 1500, -1, true)
        // 无广播员
        GameRules.GetGameModeEntity().SetAnnouncerDisabled(true)
        // 禁止买活
        GameRules.GetGameModeEntity().SetBuybackEnabled(false)
        GameRules.SetHeroRespawnEnabled(false)
        GameRules.GetGameModeEntity().SetDeathOverlayDisabled(false)
        // 禁用死亡时损失金钱
        GameRules.GetGameModeEntity().SetLoseGoldOnDeath(true)
        // 物品
        GameRules.GetGameModeEntity().SetStashPurchasingDisabled(false) //开关储藏处购买功能
        GameRules.GetGameModeEntity().SetStickyItemDisabled(true) //隐藏快速购买处的物品
        GameRules.GetGameModeEntity().SetRecommendedItemsDisabled(true) //禁止推荐物品

        GameRules.GetGameModeEntity().SetDaynightCycleDisabled(true) // 是否禁用白天黑夜循环
        GameRules.SetTimeOfDay(0.5) // 白天
        GameRules.GetGameModeEntity().SetCustomXPRequiredToReachNextLevel(Constant.LEVEL_EXP)
        GameRules.GetGameModeEntity().SetUseCustomHeroLevels(true) // 是否启用自定义英雄等级
        GameRules.GetGameModeEntity().SetCustomHeroMaxLevel(25) // 设置自定义英雄最大等级

        GameRules.GetGameModeEntity().SetInnateMeleeDamageBlockAmount(0)    // 设置近战英雄天生格挡的伤害

        // GameRules.SetCustomGameSetupAutoLaunchDelay(3) // 游戏设置时间（默认的游戏设置是最开始的队伍分配）
        // GameRules.SetCustomGameSetupRemainingTime(3) // 游戏设置剩余时间
        // GameRules.SetCustomGameSetupTimeout(3) // 游戏设置阶段超时
        // GameRules.SetHeroSelectionTime(0) // 选择英雄阶段的持续时间
        // GameRules.SetShowcaseTime(0) // 选完英雄的展示时间
        // GameRules.SetPreGameTime(0) // 进入游戏后号角吹响前的准备时间
        // GameRules.SetPostGameTime(30) // 游戏结束后时长
        // GameRules.SetSameHeroSelectionEnabled(true) // 是否允许选择相同英雄
        // GameRules.SetStartingGold(0) // 设置初始金钱
        // GameRules.SetGoldTickTime(0) // 设置工资发放间隔
        // GameRules.SetGoldPerTick(0) // 设置工资发放数额
        // GameRules.SetHeroRespawnEnabled(false) // 是否允许英雄重生
        // GameRules.SetCustomGameAllowMusicAtGameStart(false) // 是否允许游戏开始时的音乐
        // GameRules.SetCustomGameAllowHeroPickMusic(false) // 是否允许英雄选择阶段的音乐
        // GameRules.SetCustomGameAllowBattleMusic(false) // 是否允许战斗阶段音乐
        // GameRules.SetUseUniversalShopMode(true) // 是否启用全地图商店模式（在基地也可以购买神秘商店的物品）* 这个不是设置在任何地方都可以购买，如果要设置这个，需要将购买区域覆盖全地图
        // GameRules.SetHideKillMessageHeaders(true) // 是否隐藏顶部的英雄击杀信息

        // const game: CDOTABaseGameMode = GameRules.GetGameModeEntity()
        // game.SetRemoveIllusionsOnDeath(true) // 是否在英雄死亡的时候移除幻象
        // game.SetSelectionGoldPenaltyEnabled(false) // 是否启用选择英雄时的金钱惩罚（超时每秒扣钱）
        // game.SetLoseGoldOnDeath(false) // 是否在英雄死亡时扣除金钱
        // game.SetBuybackEnabled(false) // 是否允许买活

        // game.SetForceRightClickAttackDisabled(true) // 是否禁用右键攻击
        // game.SetHudCombatEventsDisabled(true) // 是否禁用战斗事件（左下角的战斗消息）
        // game.SetCustomGameForceHero(`npc_dota_hero_phoenix`) // 设置强制英雄（会直接跳过英雄选择阶段并直接为所有玩家选择这个英雄）
        // game.SetCustomXPRequiredToReachNextLevel({
        //     // 设置自定义英雄每个等级所需经验，这里的经验是升级到这一级所需要的*总经验）
        //     1: 0,
        // })
        // game.SetDeathOverlayDisabled(true) // 是否禁用死亡遮罩（灰色的遮罩）

        // 设置自定义的队伍人数上限，这里的设置是10个队伍，每个队伍1人
        // GameRules.SetCustomGameTeamMaxPlayers(DotaTeam.GOODGUYS, 1)
        // GameRules.SetCustomGameTeamMaxPlayers(DotaTeam.BADGUYS, 1)
        // for (let team = DotaTeam.CUSTOM_1 team <= DotaTeam.CUSTOM_8 ++team) {
        //     GameRules.SetCustomGameTeamMaxPlayers(team, 1)
        // }

        GameRules.EventManager = new EventManager()
        GameRules.GameLoop = new GameLoop()
        this.registerEvent()
        this.registerMessage()
        this.registerThink()    // 调用GameLoop

        Filters.init()  // 过滤器
        const BZ = new CDOTA_BaseNPC_BZ()
        BZ.init() // 兵卒属性
        ParaAdjuster.init()// 平衡性常数, 注册事件智力不加蓝
        ParaAdjuster.SetIntToMana(0)
        GameRules.PlayerManager = new PlayerManager()    // 玩家管理模块初始化
        GameRules.PlayerManager.init()
        GameRules.PathManager = new PathManager()    // 路径管理模块初始化
        GameRules.PathManager.init()
        AbilityManager.init()   // 技能模块
        // Card
        // Trade
        // Auction
        // DeathClearing
        // ItemManager
        // Selection
        // Supply
        GameRules.HeroSelection = new HeroSelection()   // 自动选择英雄模块初始化
        GameRules.HeroSelection.init()

        this.m_bNoSwap = string.find(GetMapName(), "no_swap") ? 1 : 0
        CustomNetTables.SetTableValue("GamingTable", "game_mode", {
            typeGameMode: Constant.GAME_MODE,
            bNoSwap: this.m_bNoSwap
        })
        print("===New GameConfig===Down===")
    }

    /**更新回合操作时限 */
    updateTimeOprt() {
        if (this.m_typeState === GS_ReadyStart
            || this.m_typeState === GS_WaitOperator) {
            this.m_timeOprt -= 1
            // 每一秒更新到网表
            if (this.m_timeOprt % 10 == 0) {
                CustomNetTables.SetTableValue("GamingTable", "timeOprt", { time: this.m_timeOprt / 10 })
            }
        }
    }

    /**发送操作 */
    sendOprt(tabOprt) {
        // 添加可操作记录
        this.m_tabOprtCan.push(tabOprt)
        this.m_tabOprtSend.push(tabOprt)
        // 发送消息给操作者
        GameRules.PlayerManager.sendMsg("GM_Operator", tabOprt, tabOprt.nPlayerID)

        print("1[LUA]:Send======================>>>>>>>>>>>>>>>")
        DeepPrintTable(tabOprt)
    }

    /**广播操作 */
    broadcastOprt(tabOprt: { nPlayerID: number, typeOprt: number, bPrison?: number }) {
        print("广播操作=======================")
        DeepPrintTable(tabOprt)
        // 添加可操作记录
        this.m_tabOprtCan.push(tabOprt)
        this.m_tabOprtBroadcast.push(tabOprt)
        // 发送消息给操作者
        GameRules.PlayerManager.broadcastMsg("GM_Operator", tabOprt)
    }

    /**验证操作 */
    checkOprt(tabData: { nPlayerID: number, typeOprt: number }, bDel?: boolean) {
        print("======start checkOprt======")
        if (bDel) {
            const cdt = (v: { nPlayerID: number, typeOprt: number }) => v.nPlayerID === tabData.nPlayerID && v.typeOprt === tabData.typeOprt
            this.m_tabOprtSend = this.m_tabOprtSend.filter(value => !cdt(value))
            this.m_tabOprtBroadcast = this.m_tabOprtBroadcast.filter(value => !cdt(value))
        }
        for (let value of this.m_tabOprtCan) {
            if (value.nPlayerID == tabData.nPlayerID && value.typeOprt == tabData.typeOprt) {
                if (bDel) {
                    print("checkOprt delete:==========")
                    DeepPrintTable(value)
                    print("delete=====================")
                    this.m_tabOprtCan = this.m_tabOprtCan.filter(v => v !== value)
                }
                print("checkOprt===success, return:")
                DeepPrintTable(value)
                print("checkOprt===================")
                return value
            }
        }
        print("checkOprt===false")
        return false
    }

    /**设置当前操作玩家ID */
    setOrder(nOrder: PlayerID) {
        print("GameConfig.setOrder:=====================")
        print("last order: ", this.m_nOrderID, " cur order: ", nOrder, " first order:", this.m_nOrderFirst)
        print("GameConfig.setOrder over======================")
        this.m_nOrderID = nOrder
        // 同步网表
        CustomNetTables.SetTableValue("GamingTable", "order", {
            nPlayerID: nOrder,
            heroName: GameRules.PlayerManager.getPlayer(nOrder).m_eHero.GetUnitName(),
        })
    }

    /**跳过投骰子 */
    skipRoll(nPlayerID: number) {
        print("nPlayerID: ", nPlayerID, "  skipRoll~~~~~~~~~~~~~~~~~~~~")
        const tabOprt = {
            typeOprt: TypeOprt.TO_Roll,
            PlayerID: nPlayerID,
            nPlayerID: nPlayerID,
            nNum1: 0,
            nNum2: 0
        }
        DeepPrintTable(this.m_tabOprtCan)
        if (GameRules.GameConfig.checkOprt(tabOprt, true)) {
            GameRules.PlayerManager.broadcastMsg("GM_OperatorFinished", tabOprt)
            // 发送操作, 完成回合
            GameRules.GameConfig.broadcastOprt({
                typeOprt: TypeOprt.TO_Finish,
                nPlayerID: nPlayerID,
            })
            DeepPrintTable(this.m_tabOprtCan)
        }
    }

    //----------事件回调----------
    // 注册事件
    registerEvent() {
        // 游戏状态变更
        ListenToGameEvent("game_rules_state_change", () => this.onEvent_game_rules_state_change(), undefined)

        // 监听Roll点事件
        GameRules.EventManager.Register("Event_Roll", (event: {
            bIgnore: 0 | 1
            nNum1: number
            nNum2: number
            player: Player
        }) => this.onEvent_Roll(event), this, -1000)

        // 监听攻击导致的金钱变化
        GameRules.EventManager.Register("Event_ChangeGold_Atk", (event: {
            nGold: number
            player: Player
        }) => this.onEvent_ChangeGold(event), this)

        // 监听玩家死亡
        GameRules.EventManager.Register("Event_PlayerDie", (event: {
            player: Player
        }) => this.onEvent_PlayerDie(event), this, -1000)
    }

    //----------消息回调----------
    // 注册消息
    registerMessage() {
        CustomGameEventManager.RegisterListener("GM_Operator", (_, event) => this.onMsg_oprt(event))
    }

    // 操作请求
    onMsg_oprt(tabData: {
        nPlayerID: number,
        typeOprt: number,
        nPathID?: number,
        nRequest?: number
    }) {
        print("[LUA]:Receive=================>>>>>>>>>>>>>>>")
        DeepPrintTable(tabData)
        if (tabData.typeOprt == null) {
            return
        }

        if (tabData.typeOprt > TypeOprt.TO_Free) {
            if (tabData.typeOprt == TypeOprt.TO_ZBMM) { }
            else if (tabData.typeOprt == TypeOprt.TO_XJGT) { }
            else if (tabData.typeOprt == TypeOprt.TO_TRADE) {
                GameRules.EventManager.FireEvent(Trade.EvtID.Event_TO_TRADE, tabData)
            } else if (tabData.typeOprt == TypeOprt.TO_TRADE_BE) {
                GameRules.EventManager.FireEvent(Trade.EvtID.Event_TO_TRADE_BE, tabData)
            } else if (tabData.typeOprt == TypeOprt.TO_SendAuction) {
                GameRules.EventManager.FireEvent(Auction.EvtID.Event_TO_SendAuction, tabData)
            } else if (tabData.typeOprt == TypeOprt.TO_BidAuction) {
                GameRules.EventManager.FireEvent(Auction.EvtID.Event_TO_BidAuction, tabData)
            } else if (tabData.typeOprt == TypeOprt.TO_UseCard) {
                GameRules.EventManager.FireEvent(CardManager.EvtID.Event_CardUseRequest, tabData)
            } else {
                // 
            }
            // } else {
        } else if (this.checkOprt(tabData) != false) {
            if (tabData.typeOprt == TypeOprt.TO_Finish) {
                this.processFinish(tabData)
            } else if (tabData.typeOprt == TypeOprt.TO_Roll) {
                this.processRoll(tabData)
            } else if (tabData.typeOprt == TypeOprt.TO_AYZZ) {
                this.processAYZZ(tabData)
            } else if (tabData.typeOprt == TypeOprt.TO_GCLD) {
                this.processGCLD(tabData)
            } else if (tabData.typeOprt == TypeOprt.TO_TP) {
                this.processTP(tabData)
            } else if (tabData.typeOprt == TypeOprt.TO_PRISON_OUT) {
                this.processPrisonOut(tabData)
            } else if (tabData.typeOprt == TypeOprt.TO_DeathClearing) {
                GameRules.EventManager.FireEvent(DeathClearing.EvtID.Event_TO_DeathClearing, tabData)
            } else if (tabData.typeOprt == TypeOprt.TO_Supply) {
                // Supply
            } else if (tabData.typeOprt == TypeOprt.TO_AtkMonster) {
                this.processAtkMonster(tabData)
            }
        }
    }

    /**处理回合结束 */
    processFinish(tabData: { nPlayerID: number, typeOprt: number }) {
        print("processFinish====this.m_typeState:", this.m_typeState)
        if (this.m_typeState == GS_Move) return
        if (this.m_typeState == GS_Wait) return

        GameRules.GameLoop.Timer(() => {
            GameRules.GameLoop.GameStateService.send("tofinished")
            return null
        }, 0)
        // 删除操作
        this.checkOprt(tabData, true)
        const tabOprt = { nRequest: 1 }
        // 回包
        GameRules.PlayerManager.sendMsg("GM_OperatorFinished", tabOprt, tabData.nPlayerID)

        this.autoOprt(null, GameRules.PlayerManager.getPlayer(tabData.nPlayerID))
    }

    /**处理roll点 */
    processRoll(tabData: { nPlayerID: number, typeOprt: number }) {
        if (this.m_typeState == GS_Move) return
        if (this.m_typeState == GS_Wait) return

        const oPlayer = GameRules.PlayerManager.getPlayer(tabData.nPlayerID)
        const bInPrison: boolean = 0 < (PS_InPrison & oPlayer.m_nPlayerState)

        // 有tp和攻城跳过
        this.autoOprt(TypeOprt.TO_TP)
        this.autoOprt(TypeOprt.TO_GCLD)
        this.autoOprt(TypeOprt.TO_AtkMonster)

        let nNum1 = RandomInt(1, 6), nNum2 = RandomInt(1, 6)

        /**是否可占领 */
        function checkPath() {
            if (bInPrison) return
            const path = GameRules.PathManager.getNextPath(oPlayer.m_pathCur, nNum1 + nNum2)
            print("checkPath:", (path instanceof PathDomain || path instanceof PathTP) && !path.m_nOwnerID)
            return (path instanceof PathDomain || path instanceof PathTP) && !path.m_nOwnerID
        }

        print("roll default: ", nNum1, nNum2)

        // 平衡性算法-领地差值
        const difference = GameRules.PlayerManager.getMostPathCount() - GameRules.PlayerManager.getLeastPathCount()
        if (difference > 2) {
            const randomNum = RandomInt(1, 2)
            print("roll randomNum: ", randomNum)
            if (randomNum === 1) {
                let i = 1
                const isLeastPathPlayer = GameRules.PlayerManager.isLeastPathPlayer(tabData.nPlayerID)
                const isMostPathPlayer = GameRules.PlayerManager.isMostPathPlayer(tabData.nPlayerID)
                while (i < 100) {
                    if ((isLeastPathPlayer && checkPath()) || (isMostPathPlayer && !checkPath())) {
                        break
                    }
                    nNum1 = RandomInt(1, 6)
                    nNum2 = RandomInt(1, 6)
                    i++
                }
            }

        }
        // if (oPlayer.m_eHero.GetUnitName() == "npc_dota_hero_phantom_assassin") {
        //     nNum1 = 2
        //     nNum2 = 8
        // }else{
        //     nNum1 = 3
        //     nNum2 = 5
        // }
        // 删除操作
        const tabOprt = this.checkOprt(tabData, true)
        tabOprt["nNum1"] = nNum1
        tabOprt["nNum2"] = nNum2
        // 广播玩家roll点操作
        GameRules.PlayerManager.broadcastMsg("GM_OperatorFinished", tabOprt)
        print("roll final: ", nNum1, nNum2)
        print("playerID", tabData.nPlayerID)

        // 音效
        EmitGlobalSound("Custom.Roll.Ing")

        GameRules.GameLoop.GameStateService.send("towait")

        Timers.CreateTimer(1.5, () => {
            // 设置roll点记录
            // TODO: GameRecord.setGameRecord()

            GameRules.GameLoop.GameStateService.send("towaitoprt")
            // 触发roll事件
            GameRules.EventManager.FireEvent("Event_Roll", {
                bIgnore: 0,
                nNum1: nNum1,
                nNum2: nNum2,
                player: oPlayer
            })
        })

    }

    /**处理安营扎寨 */
    processAYZZ(tabData: {
        nPlayerID: number,
        typeOprt: number,
        nPathID?: number,
        nRequest?: number
    }) {
        print("处理安营扎寨")
        // 删除可操作
        const tabOprt = this.checkOprt(tabData) as {
            nPlayerID: number,
            typeOprt: number,
            nPathID?: number,
            nRequest?: number,
            bPrison?: number
        }

        let oPlayer: Player, oPath: PathDomain | PathTP

        // 验证操作
        tabOprt.nRequest = (() => {
            if (tabData.nRequest == 1) {
                oPlayer = GameRules.PlayerManager.getPlayer(tabOprt.nPlayerID)
                oPath = GameRules.PathManager.getPathByID(tabOprt.nPathID) as PathDomain | PathTP
                if (!oPlayer || !oPath) return 100

                if (oPath.m_nPrice > oPlayer.GetGold()) {
                    // 钱不够提示
                    HudError.FireDefaultError(tabData.nPlayerID, "Error_NeedGold")
                    return 2    // 金币不够
                }
            }
            return tabData.nRequest
        })()

        if (tabOprt.nRequest == 1) {
            // 广播玩家安营扎寨
            GameRules.PlayerManager.broadcastMsg("GM_OperatorFinished", tabOprt)
            // TODO:全地起兵操作

            // 设置玩家领地
            oPlayer.setMyPathAdd(oPath)
            // 花费金币
            oPlayer.setGold(-oPath.m_nPrice)
            this.showGold(oPlayer, -oPath.m_nPrice)

            // 设置游戏记录
            GameRecord.setGameRecord(TGameRecord_AYZZ, tabOprt.nPlayerID, {
                strPathName: "PathName_" + tabOprt.nPathID,
                nGold: oPath.m_nPrice
            })
        } else {
            // 回包
            GameRules.PlayerManager.sendMsg("GM_OperatorFinished", tabOprt, tabOprt.nPlayerID)
        }

        if (tabOprt.nRequest == 0 || tabOprt.nRequest == 1) {
            this.checkOprt(tabData, true)
        }
    }

    /**处理攻城略地 */
    processGCLD(tabData: {
        nPlayerID: number,
        typeOprt: number,
        nPathID?: number,
        nRequest?: number
    }) {
        // 删除可操作
        const tabOprt = this.checkOprt(tabData, true)
        tabOprt["nRequest"] = tabData.nRequest

        let path: PathDomain

        print("===processGCLD===")

        // 验证操作
        tabOprt["nRequest"] = (() => {
            if (tabData.nRequest == 1) {
                path = GameRules.PathManager.getPathByID(tabOprt["nPathID"]) as PathDomain
                if (!path) {
                    return 100
                }

                if (path.m_nOwnerID == tabOprt["nPlayerID"]) {
                    HudError.FireLocalizeError(tabData.nPlayerID, "Error_CantGCLD_Self")
                    return 2    // 自己领地
                } else if (path.m_nPlayerIDGCLD) {
                    HudError.FireLocalizeError(tabData.nPlayerID, "Error_CantGCLD_Battling")
                    return 3    // 已在攻城中
                } else if (path.m_tabENPC && IsValid(path.m_tabENPC[0]) && path.m_tabENPC[0].IsStunned()) {
                    HudError.FireLocalizeError(tabData.nPlayerID, "Error_CantGCLD_Stunned")
                    return 4    // 目标眩晕
                } else if (GameRules.GameConfig.m_typeState == GS_Wait) {
                    HudError.FireLocalizeError(tabData.nPlayerID, "LuaAbilityError_Wait")
                    return 5    // 等待中
                }
                const playerBe = GameRules.PlayerManager.getPlayer(path.m_nOwnerID)
                if (playerBe && 0 < bit.band(PS_InPrison, playerBe.m_nPlayerState)) {
                    HudError.FireLocalizeError(tabData.nPlayerID, "Error_CantGCLD_InPrison")
                    return 6    // 在监狱
                }
            }
            return tabData.nRequest
        })()

        print("===processGCLD===tabOprt:")
        print(tabOprt)
        if (tabOprt["nRequest"] == 1) {
            // 广播玩家攻城略地
            GameRules.PlayerManager.broadcastMsg("GM_OperatorFinished", tabOprt)
            // 玩家攻城
            path.atkCity(GameRules.PlayerManager.getPlayer(tabOprt["nPlayerID"]))

            this.skipRoll(tabOprt["nPlayerID"])
        } else {
            // 回包
            GameRules.PlayerManager.sendMsg("GM_OperatorFinished", tabOprt, tabOprt["nPlayerID"])
        }

        if (tabOprt["nRequest"] == 0 || tabOprt["nRequest"] == 1) {
            this.checkOprt(tabData, true)
        }
    }

    /**处理TP传送 */
    processTP(tabData) {

    }

    /**处理出狱 */
    processPrisonOut(tabData: { nPlayerID: number; typeOprt: number; nPathID?: number; nRequest?: number }) {
        let tabOprt = this.checkOprt(tabData)
        print("===processPrisonOut===0")
        print("===processPrisonOut===GameState:", GameRules.GameLoop.getGameState())
        DeepPrintTable(tabOprt as any)
        const oPlayer = GameRules.PlayerManager.getPlayer(tabData.nPlayerID)

        // 验证操作
        tabOprt["nRequest"] = (() => {
            if (tabData.nRequest == 1) {
                // 玩家买活,验证金币
                if (oPlayer.GetGold() < tabOprt["nGold"]) {
                    // 错误提示
                    HudError.FireLocalizeError(tabData.nPlayerID, "Error_NeedGold")
                    return 2
                }
            }
            return tabData.nRequest
        })()
        print("===processPrisonOut===1")
        DeepPrintTable(tabOprt as any)
        // 回包
        GameRules.PlayerManager.sendMsg("GM_OperatorFinished", tabOprt, tabData.nPlayerID)
        if (tabOprt["nRequest"] > 1) {
            return
        }

        // 成功删除操作
        this.checkOprt(tabData, true)

        // 买活出狱
        if (tabOprt["nRequest"] == 1) {
            (GameRules.PathManager.getPathByType(TP_PRISON)[0] as PathPrison).setOutPrison(oPlayer)
            // 扣钱
            oPlayer.setGold(-tabOprt["nGold"])
            oPlayer.m_eHero.ModifyHealth(oPlayer.m_eHero.GetMaxHealth(), null, false, 0)
            GameRules.GameConfig.showGold(oPlayer, -tabOprt["nGold"])

            // TODO:设置游戏记录
            // GameRecord:setGameRecord

        }

        // 发送Roll点操作
        tabOprt = {
            nPlayerID: oPlayer.m_nPlayerID,
            typeOprt: TypeOprt.TO_Roll,
        }
        this.broadcastOprt(tabOprt)
        print("===processPrisonOut===GameState:", GameRules.GameLoop.getGameState())
        this.m_timeOprt = Constant.TIME_OPERATOR
    }

    /**处理打野 */
    processAtkMonster(tabData) {

    }

    /**自动处理操作 */
    autoOprt(typeOprt?: number, oPlayer?: Player) {
        print("this.m_tabOprtCan.length:", this.m_tabOprtCan.length)
        for (let v of this.m_tabOprtCan) {
            if ((typeOprt == null || v.typeOprt == typeOprt)    // 指定操作
                && (oPlayer == null || v.nPlayerID == oPlayer.m_nPlayerID)) {
                print("验证操作")
                if (TypeOprt.TO_Finish == v.typeOprt) {
                    // 结束回合
                    v.nRequest = 1
                } else if (TypeOprt.TO_Roll == v.typeOprt) {
                    // roll点
                    v.nRequest = 1
                } else if (TypeOprt.TO_AYZZ == v.typeOprt) {
                    // 安营扎寨，默认不
                    v.nRequest = 1
                } else if (TypeOprt.TO_GCLD == v.typeOprt) {
                    // 攻城略地，默认不
                    v.nRequest = 1
                } else if (TypeOprt.TO_TP == v.typeOprt) {
                    // TP传送，默认不
                    v.nRequest = 0
                } else if (TypeOprt.TO_PRISON_OUT == v.typeOprt) {
                    // 出狱，默认不买活
                    v.nRequest = 0
                } else if (TypeOprt.TO_DeathClearing == v.typeOprt) {
                    v.nRequest = 1
                } else if (TypeOprt.TO_AtkMonster == v.typeOprt) {
                    v.nRequest = 0
                } else if (TypeOprt.TO_RandomCard == v.typeOprt) {
                    v.nRequest = 0
                }

                print("v.typeOprt:", v.typeOprt, "typeOprt:", typeOprt)
                print("v.nPlayerID", v.nPlayerID, "oPlayer.m_nPlayerID:", oPlayer?.m_nPlayerID)
                print("v.nRequest", v.nRequest)

                if (v.nRequest != null) {
                    print("autoOprt v.typeOprt: ", v.typeOprt, "~~~~~~~~~~~~~~~~~~~~")
                    this.onMsg_oprt(v)
                    return this.autoOprt(typeOprt, oPlayer)
                }
            }
        }


    }

    // ================计时回调================
    /**注册计时协程 */
    registerThink() {
        // 全局主流程
        this._DotaState = []
        Timers.CreateTimer(2, () => {
            return this.onThink_update()
        })
    }

    /**游戏进行时 */
    onThink_update() {
        const state = GameRules.State_Get()
        if (state == GameState.GAME_IN_PROGRESS) {
            GameRules.GameLoop.GamestateStart()
            return
        }
        return 0.1
    }

    /**玩家死亡 */
    onEvent_PlayerDie(event: {
        player: Player
    }) {
        const nAlive = GameRules.PlayerManager.getAlivePlayerCount()
        this.m_tabEnd.push({
            steamid64: tostring(PlayerResource.GetSteamID(event.player.m_nPlayerID)),
            rank_num: nAlive + 1,
            hero_name: event.player.m_eHero.GetUnitName(),
            time_game: math.floor(GameRules.GetGameTime()),
            is_abandon: event.player.m_bAbandon
        })
        print("nAlive:", nAlive)
        if (nAlive == 2) {
            // 开启决战
            this.m_bFinalBattle = true
            GameRules.EventManager.FireEvent("Event_FinalBattle")
        } else if (nAlive < 2) {
            print("onEvent_PlayerDie:游戏结束")
            print("PlayerManager:isAlivePlayer(player.m_nPlayerID):", GameRules.PlayerManager.isAlivePlayer(event.player.m_nPlayerID))
            GameRules.SetGameWinner(DotaTeam.GOODGUYS)

            // 添加第一名
            for (const player of GameRules.PlayerManager.m_tabPlayers) {
                if (GameRules.PlayerManager.isAlivePlayer(player.m_nPlayerID)) {
                    this.m_tabEnd.push({
                        steamid64: tostring(PlayerResource.GetSteamID(player.m_nPlayerID)),
                        rank_num: 1,
                        hero_name: player.m_eHero.GetUnitName(),
                        time_game: math.floor(GameRules.GetGameTime()),
                        is_abandon: player.m_bAbandon
                    })
                    break
                } else {
                    print("======第一名结算异常======")
                    print("steamid64:", tostring(PlayerResource.GetSteamID(event.player.m_nPlayerID)))
                    print("rank_num: 1")
                    print("heroname:", event.player.m_eHero.GetUnitName())
                    print("time_game:", math.floor(GameRules.GetGameTime()))
                    print("is_abandon:", player.m_bAbandon)
                    print("=========================")
                }
            }

            print("print GameConfig.m_tabEnd:")
            DeepPrintTable(this.m_tabEnd)
        }

        // 剩余操作出来
        if (this.m_nOrderID == event.player.m_nPlayerID
            && this.m_typeState != GS_DeathClearing) {
            // 移除操作
            for (let i = 0; i < this.m_tabOprtCan.length; i++) {
                this.m_tabOprtCan = this.m_tabOprtCan.filter(v =>
                    v.nPlayerID !== event.player.m_nPlayerID)
            }
            if (nAlive > 1) {
                if (GameRules.GameLoop.m_typeStateCur != GS_ReadyStart) {
                    GameRules.GameLoop.setGameState(GS_Finished)
                }
            }
        }

        // 改变首位玩家
        print("this.m_nOrderFirst == event.player.m_nPlayerID:",
            this.m_nOrderFirst == event.player.m_nPlayerID)
        if (this.m_nOrderFirst == event.player.m_nPlayerID) {
            this.m_nOrderFirst = this.getNextValidOrder(event.player.m_nPlayerID)
        }
        print("self.m_nOrderFirst:", this.m_nOrderFirst)

        // 设置结算
        this.setGameEndData()
    }
    // onEvent_ItemBuy() {
    // }

    /**玩家金币变化 */
    onEvent_ChangeGold(event: {
        nGold: number
        player: Player
    }) {
        if (!this.m_tabChangeGold) {
            this.m_tabChangeGold = []
        }
        if (!this.m_tabChangeGold[event.player.m_nPlayerID]) {
            this.m_tabChangeGold[event.player.m_nPlayerID] = 0
        }
        this.m_tabChangeGold[event.player.m_nPlayerID] += event.nGold
        CustomNetTables.SetTableValue("GamingTable", "change_gold", this.m_tabChangeGold)
        print("[network-changeGold]==============================")
        DeepPrintTable(this.m_tabChangeGold)

        // 设置2秒后清除
        if (!this.m_nTimeChangeGold) {
            Timers.CreateTimer(0.1, () => {
                this.m_nTimeChangeGold -= 1
                if (this.m_nTimeChangeGold > 0) return 0.1
                this.m_nTimeChangeGold = null
                this.m_tabChangeGold = null
                CustomNetTables.SetTableValue("GamingTable", "change_gold", {})
            })
        }
        this.m_nTimeChangeGold = 20
    }

    /**玩家roll点后移动 */
    onEvent_Roll(event: {
        bIgnore: 0 | 1
        nNum1: number
        nNum2: number
        player: Player
    }) {
        if (event.bIgnore == 1) return

        // 触发移动事件
        GameRules.EventManager.FireEvent("Event_Move", { entity: event.player.m_eHero })

        const oPlayer = GameRules.PlayerManager.getPlayer(event.player.m_nPlayerID)
        const pathDes = GameRules.PathManager.getNextPath(oPlayer.m_pathCur, event.nNum1 + event.nNum2)

        print("GameRules.GameLoop.getGameState():", GameRules.GameLoop.getGameState())
        if (GameRules.GameLoop.getGameState() === "GSWaitOprt") {
            print("改变状态移动tomove")
            GameRules.GameLoop.Timer(() => {
                GameRules.GameLoop.GameStateService.send("tomove")
                return null
            }, 0)
        }
        oPlayer.moveToPath(pathDes, (bSuccess: boolean) => {
            print("this.m_typeState:", this.m_typeState)
            // 触发移动结束事件
            if (this.m_typeState === GS_Move ||
                this.m_typeState === GS_DeathClearing) {
                // GSMOVE_Exit()结束移动
                GameRules.GameLoop.Timer(() => {
                    GameRules.GameLoop.GameStateService.send("towaitoprt")
                    return null
                }, 0)
            }
            GameRules.EventManager.FireEvent("Event_MoveEnd", { entity: event.player.m_eHero })
            event.player.m_nRollMove++
            // 玩家死亡不操作
            if (event.player.m_bDie) return
            // 触发到达路径功能
            pathDes.onPath(event.player)

            // 判断豹子触发
            // const tEventJudge = { player: event.player }
            // GameRules.EventManager.FireEvent("Event_RollBaoZiJudge", tEventJudge)
            // if (tEventJudge["bIgnore"] == 1 && event.nNum1 == event.nNum2 &&
            if (event.nNum1 == event.nNum2 &&
                (bit.band(oPlayer.m_nPlayerState, PS_InPrison + PS_AtkMonster)) == 0) {
                // 豹子,发送roll点操作
                this.broadcastOprt({
                    typeOprt: TypeOprt.TO_Roll,
                    bPrison: tonumber(Constant.PRISON_BAOZI_COUNT - 1 == this.m_nBaoZi),
                    nPlayerID: oPlayer.m_nPlayerID
                })
                // 追加时间
                if (this.m_timeOprt <= Constant.TIME_BAOZI_YZ) {
                    this.m_timeOprt = Constant.TIME_BAOZI_YZ + Constant.TIME_BAOZI_ADD
                }
                return
            }

            // 发送操作,完成回合
            this.broadcastOprt({
                typeOprt: TypeOprt.TO_Finish,
                nPlayerID: oPlayer.m_nPlayerID
            })
        })
    }

    onEvent_game_rules_state_change(): void {
        if (GameRules.State_Get() == GameState.WAIT_FOR_PLAYERS_TO_LOAD) {
            // 等待玩家加载界面
        } else if (GameRules.State_Get() == GameState.CUSTOM_GAME_SETUP) {
            // 选择队伍界面
        } else if (GameRules.State_Get() == GameState.HERO_SELECTION) {
            // 选择hero
            GameRules.HeroSelection.UpdateTime()
        } else if (GameRules.State_Get() == GameState.PRE_GAME) {
            // 进入地图,准备阶段
            if (GameRules.IsCheatMode() && !IsInToolsMode()) {
                // 作弊
                GameRules.SetGameWinner(DotaTeam.BADGUYS)
            }
        } else if (GameRules.State_Get() == GameState.GAME_IN_PROGRESS) {
            // 游戏开始
        }
    }

    /**获取下一个有效的操作玩家ID */
    getNextValidOrder(nOrder: number) {
        let nIndex = GameRules.HeroSelection.GetPlayerIDIndex(nOrder)
        nIndex = this.addOrder(nIndex + 1)
        if (!GameRules.PlayerManager.isAlivePlayer(GameRules.HeroSelection.m_PlayersSort[nIndex])) {
            return this.getNextValidOrder(GameRules.HeroSelection.m_PlayersSort[nIndex])
        }
        return GameRules.HeroSelection.m_PlayersSort[nIndex]
    }

    /**获取上一个有效的操作玩家ID */
    getLastValidOrder(nOrder: number) {
        let nIndex = GameRules.HeroSelection.GetPlayerIDIndex(nOrder)
        if (!nIndex) {
            return this.getLastValidOrder(GameRules.HeroSelection.m_PlayersSort[nIndex])
        }
        nIndex = this.addOrder(nIndex - 1)
        if (!GameRules.PlayerManager.isAlivePlayer(GameRules.HeroSelection.m_PlayersSort[nIndex])) {
            return this.getLastValidOrder(GameRules.HeroSelection.m_PlayersSort[nIndex])
        }
        return GameRules.HeroSelection.m_PlayersSort[nIndex]
    }

    /**获取顺序上的order */
    addOrder(nOrder: number) {
        if (nOrder < 1) return this.addOrder(nOrder + GameRules.PlayerManager.getPlayerCount())
        nOrder--
        return (nOrder + 1) % GameRules.PlayerManager.getPlayerCount()
    }

    /**飘金 */
    showGold(oPlayer: Player, nGold: number) {
        // 通知UI显式花费
        CustomGameEventManager.Send_ServerToAllClients("S2C_GM_ShowGold", {
            nGold: nGold,
            nPlayerID: oPlayer.m_nPlayerID
        })
    }

    /**增加轮数 */
    addRound() {
        GameRules.PlayerManager.m_tabPlayers.forEach((oPlayer) => {
            const abltCount = oPlayer.m_eHero.GetAbilityCount()
            for (let i = 0; i < abltCount; i++) {
                const ability = oPlayer.m_eHero.GetAbilityByIndex(i)
                if (ability) {
                    print("oPlayer__", oPlayer.m_nPlayerID, "===heroname:", oPlayer.m_eHero.GetUnitName(), " ===index(i)", i, "===abilityname:", oPlayer.m_eHero.GetAbilityByIndex(i).GetAbilityName())
                }
            }
            oPlayer.m_eHero.FindAllModifiers().forEach((oBuff) => {
                print("oPlayer__", oPlayer.m_nPlayerID, "===heroname:", oPlayer.m_eHero.GetUnitName(), " ===oBuff===name:", oBuff.GetName())
            })
        })

        this.m_nRound += 1
        print("===addRound===this.m_nRound:", this.m_nRound)
        // 同步网表
        CustomNetTables.SetTableValue("GamingTable", "round", { nRound: this.m_nRound })

        const tEvtData = {
            isBegin: true,
            nRound: this.m_nRound
        }

        if (Constant.RoundTip[this.m_nRound]) {
            CustomGameEventManager.Send_ServerToAllClients("S2C_round_tip", { sTip: "false" })
        }

        // 触发轮数更新
        GameRules.EventManager.FireEvent("Event_UpdateRound", tEvtData)
        // 根据结果设置是否拦截回合开始
        print("===addRound===tEvtData.isBegin:", tEvtData.isBegin)
        GameRules.GameLoop.m_bRoundBefore = !tEvtData.isBegin

        if (Constant.RoundTip[this.m_nRound + 1]) {
            CustomGameEventManager.Send_ServerToAllClients("S2C_round_tip", { sTip: Constant.RoundTip[this.m_nRound + 1] })
        }

        // 全图商店
        if (this.m_nRound == Constant.GLOBAL_SHOP_ROUND) {
            // 遍历GameRules.Playermanager.m_tabPlayers
            GameRules.PlayerManager.m_tabPlayers.forEach((oPlayer) => {
                oPlayer.setBuyState(TBuyItem_SideAndSecret, -1)
            })
        }
        return tEvtData.isBegin
    }

    /**设置结算数据 */
    setGameEndData() {
        print("设置结算数据")
        for (const value of this.m_tabEnd) {
            const player = GameRules.PlayerManager.getPlayerBySteamID64(value.steamid64)
            if (player) {
                player.m_nRank = value.rank_num
                const keyname = "player_info_" + player.m_nPlayerID as player_info

                CustomNetTables.SetTableValue("EndTable", keyname, {
                    nDamageBZ: player.m_nDamageBZ,
                    nDamageHero: player.m_nDamageHero,
                    nGCLD: player.m_nGCLD,
                    nGoldMax: player.m_nGoldMax,
                    nKill: player.m_nKill,
                    nRank: value.rank_num,
                    nReward: 0
                })
            }
        }
    }

}

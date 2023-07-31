import { CardManager } from "../card/cardmanager";
import { GameLoop } from "../mode/GameLoop";
import { HeroSelection } from "../mode/HeroSelection";
import { Auction } from "../mode/auction";
import { Constant } from "../mode/constant";
import { DeathClearing } from "../mode/deathclearing";
import { GameMessage } from "../mode/gamemessage";
import { Trade } from "../mode/trade";
import { PathManager } from "../path/PathManager";
import { Player } from "../player/player";
import { PlayerManager } from "../player/playermanager";
import { EventManager } from "../utils/eventmanager";
import { reloadable } from "../utils/tstl-utils";
import { interpret } from "../utils/xstate/xstate-dota";

@reloadable
export class GameConfig {

    _DotaState: []

    constructor() {
        print("[GameConfig] start...开始配置")
        SendToServerConsole('dota_max_physical_items_purchase_limit 9999'); // 用来解决物品数量限制问题

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

        // GameRules.SetCustomGameSetupAutoLaunchDelay(3); // 游戏设置时间（默认的游戏设置是最开始的队伍分配）
        // GameRules.SetCustomGameSetupRemainingTime(3); // 游戏设置剩余时间
        // GameRules.SetCustomGameSetupTimeout(3); // 游戏设置阶段超时
        // GameRules.SetHeroSelectionTime(0); // 选择英雄阶段的持续时间
        // GameRules.SetShowcaseTime(0); // 选完英雄的展示时间
        // GameRules.SetPreGameTime(0); // 进入游戏后号角吹响前的准备时间
        // GameRules.SetPostGameTime(30); // 游戏结束后时长
        // GameRules.SetSameHeroSelectionEnabled(true); // 是否允许选择相同英雄
        // GameRules.SetStartingGold(0); // 设置初始金钱
        // GameRules.SetGoldTickTime(0); // 设置工资发放间隔
        // GameRules.SetGoldPerTick(0); // 设置工资发放数额
        // GameRules.SetHeroRespawnEnabled(false); // 是否允许英雄重生
        // GameRules.SetCustomGameAllowMusicAtGameStart(false); // 是否允许游戏开始时的音乐
        // GameRules.SetCustomGameAllowHeroPickMusic(false); // 是否允许英雄选择阶段的音乐
        // GameRules.SetCustomGameAllowBattleMusic(false); // 是否允许战斗阶段音乐
        // GameRules.SetUseUniversalShopMode(true); // 是否启用全地图商店模式（在基地也可以购买神秘商店的物品）* 这个不是设置在任何地方都可以购买，如果要设置这个，需要将购买区域覆盖全地图
        // GameRules.SetHideKillMessageHeaders(true); // 是否隐藏顶部的英雄击杀信息

        // const game: CDOTABaseGameMode = GameRules.GetGameModeEntity();
        // game.SetRemoveIllusionsOnDeath(true); // 是否在英雄死亡的时候移除幻象
        // game.SetSelectionGoldPenaltyEnabled(false); // 是否启用选择英雄时的金钱惩罚（超时每秒扣钱）
        // game.SetLoseGoldOnDeath(false); // 是否在英雄死亡时扣除金钱
        // game.SetBuybackEnabled(false); // 是否允许买活
        // game.SetDaynightCycleDisabled(true); // 是否禁用白天黑夜循环
        // game.SetForceRightClickAttackDisabled(true); // 是否禁用右键攻击
        // game.SetHudCombatEventsDisabled(true); // 是否禁用战斗事件（左下角的战斗消息）
        // game.SetCustomGameForceHero(`npc_dota_hero_phoenix`); // 设置强制英雄（会直接跳过英雄选择阶段并直接为所有玩家选择这个英雄）
        // game.SetUseCustomHeroLevels(true); // 是否启用自定义英雄等级
        // game.SetCustomHeroMaxLevel(1); // 设置自定义英雄最大等级
        // game.SetCustomXPRequiredToReachNextLevel({
        //     // 设置自定义英雄每个等级所需经验，这里的经验是升级到这一级所需要的*总经验）
        //     1: 0,
        // });
        // game.SetDaynightCycleDisabled(true); // 是否禁用白天黑夜循环
        // game.SetDeathOverlayDisabled(true); // 是否禁用死亡遮罩（灰色的遮罩）

        // 设置自定义的队伍人数上限，这里的设置是10个队伍，每个队伍1人
        // GameRules.SetCustomGameTeamMaxPlayers(DotaTeam.GOODGUYS, 1);
        // GameRules.SetCustomGameTeamMaxPlayers(DotaTeam.BADGUYS, 1);
        // for (let team = DotaTeam.CUSTOM_1; team <= DotaTeam.CUSTOM_8; ++team) {
        //     GameRules.SetCustomGameTeamMaxPlayers(team, 1);
        // }

        GameRules.EventManager = new EventManager()
        this.registerEvent()
        this.registerMessage()
        this.registerThink()

        // Filter
        // Attributes 属性
        // ParaAdjuster 平衡性常数
        GameRules.PlayerManager = new PlayerManager()    // 玩家管理模块初始化
        GameRules.PlayerManager.init()
        GameRules.PathManager = new PathManager()    // 路径管理模块初始化
        GameRules.PathManager.init()
        // Ability
        // Card
        // Trade
        // Auction
        // DeathClearing
        // ItemManager
        // Selection
        // Supply
        GameRules.HeroSelection = new HeroSelection()   // 自动选择英雄模块初始化
        GameRules.HeroSelection.init()
        GameRules.GameLoop = new GameLoop()     // 游戏循环模块启动
        GameRules.GameLoop.Start()

        GameRules.PlayerManager.m_bNoSwap = string.find(GetMapName(), "no_swap") ? 1 : 0
        CustomNetTables.SetTableValue("GamingTable", "game_mode", {
            typeGameMode: Constant.GAME_MODE,
            bNoSwap: GameRules.PlayerManager.m_bNoSwap
        })
    }

    //----------事件回调----------
    // 注册事件
    registerEvent() {
        // 游戏状态变更
        ListenToGameEvent("game_rules_state_change", () => this.onEvent_game_rules_state_change(), undefined)

        // 监听Roll点事件,无限次
        GameRules.EventManager.Register("Event_Roll", (event: {
            bIgnore: 0 | 1
            nNum1: number
            nNum2: number
            player: Player
        }) => this.onEvent_Roll(event), this, -1, -1000)

        // 监听攻击导致的金钱变化,无限次
        GameRules.EventManager.Register("Event_ChangeGold_Atk", (event: {
            nGold: number
            player: Player
        }) => this.onEvent_ChangeGold(event), this, -1)

        // 监听玩家死亡,无限次
        GameRules.EventManager.Register("Event_PlayerDie", (event: {
            player: Player
        }) => this.onEvent_PlayerDie(event), this, -1, -1000)
    }

    //----------消息回调----------
    // 注册消息
    registerMessage() {
        CustomGameEventManager.RegisterListener("GM_Operator", (_, event) => this.onMsg_oprt(event))
    }

    // 操作请求
    onMsg_oprt(tabData: Record<any, any>) {
        print("[LUA]:Receive=================>>>>>>>>>>>>>>>")
        DeepPrintTable(tabData)
        if (tabData.typeOprt == null) {
            return
        }
        print("tabData.nPlayerID:", tabData.nPlayerID)
        if (tabData.typeOprt > GameMessage.TypeOprt.TO_Free) {
            if (tabData.typeOprt == GameMessage.TypeOprt.TO_ZBMM) { }
            else if (tabData.typeOprt == GameMessage.TypeOprt.TO_XJGT) { }
            else if (tabData.typeOprt == GameMessage.TypeOprt.TO_TRADE) {
                GameRules.EventManager.FireEvent(Trade.EvtID.Event_TO_TRADE, tabData)
            } else if (tabData.typeOprt == GameMessage.TypeOprt.TO_TRADE_BE) {
                GameRules.EventManager.FireEvent(Trade.EvtID.Event_TO_TRADE_BE, tabData)
            } else if (tabData.typeOprt == GameMessage.TypeOprt.TO_SendAuction) {
                GameRules.EventManager.FireEvent(Auction.EvtID.Event_TO_SendAuction, tabData)
            } else if (tabData.typeOprt == GameMessage.TypeOprt.TO_BidAuction) {
                GameRules.EventManager.FireEvent(Auction.EvtID.Event_TO_BidAuction, tabData)
            } else if (tabData.typeOprt == GameMessage.TypeOprt.TO_UseCard) {
                GameRules.EventManager.FireEvent(CardManager.EvtID.Event_CardUseRequest, tabData)
            } else {
                // 
            }
        } else {
            // } else if (this.checkOprt(tabData) != false) {
            if (tabData.typeOprt == GameMessage.TypeOprt.TO_Finish) {
                this.processFinish(tabData)
            } else if (tabData.typeOprt == GameMessage.TypeOprt.TO_Roll) {
                this.processRoll(tabData)
            } else if (tabData.typeOprt == GameMessage.TypeOprt.TO_AYZZ) {
                this.processAYZZ(tabData)
            } else if (tabData.typeOprt == GameMessage.TypeOprt.TO_GCLD) {
                this.processGCLD(tabData)
            } else if (tabData.typeOprt == GameMessage.TypeOprt.TO_TP) {
                this.processTP(tabData)
            } else if (tabData.typeOprt == GameMessage.TypeOprt.TO_PRISON_OUT) {
                this.processPrisonOut(tabData)
            } else if (tabData.typeOprt == GameMessage.TypeOprt.TO_DeathClearing) {
                GameRules.EventManager.FireEvent(DeathClearing.EvtID.Event_TO_DeathClearing, tabData)
            } else if (tabData.typeOprt == GameMessage.TypeOprt.TO_Supply) {
                // Supply
            } else if (tabData.typeOprt == GameMessage.TypeOprt.TO_AtkMonster) {
                this.processAtkMonster(tabData)
            }
        }
    }

    /**处理回合结束 */
    processFinish(tabData) {

    }

    /**处理roll点 */
    processRoll(tabData: Record<any, any>) {
        const oPlayer = GameRules.PlayerManager.getPlayer(tabData.nPlayerID)
        let nNum1 = RandomInt(1, 6), nNum2 = RandomInt(1, 6)
        print("nNum1:", nNum1)
        print("nNum2:", nNum2)
        print("playerID", tabData.nPlayerID)
        GameRules.EventManager.FireEvent("Event_Roll", {
            bIgnore: 0,
            nNum1: nNum1,
            nNum2: nNum2,
            player: oPlayer
        })
    }

    /**处理安营扎寨 */
    processAYZZ(tabData) {

    }

    /**处理攻城略地 */
    processGCLD(tabData) {

    }

    /**处理TP传送 */
    processTP(tabData) {

    }

    /**处理出狱 */
    processPrisonOut(tabData) {

    }

    /**处理打野 */
    processAtkMonster(tabData) {

    }

    /**验证操作 */
    checkOprt(tabData, bDel?: boolean) {
        print("checkOprt")
        if (bDel) {
            GameRules.PlayerManager.m_tabOprtSend = GameRules.PlayerManager.m_tabOprtSend.filter(item => {
                item.nPlayerID == tabData.PlayerID &&
                    item.typeOprt == tabData.typeOprt
            })
            GameRules.PlayerManager.m_tabOprtBroadcast = GameRules.PlayerManager.m_tabOprtBroadcast.filter(item => {
                item.nPlayerID == tabData.PlayerID &&
                    item.typeOprt == tabData.typeOprt
            })
        }
        for (let index = 0; index < GameRules.PlayerManager.m_tabOprtCan.length; index++) {
            const value = GameRules.PlayerManager.m_tabOprtCan[index];
            // PlayerID:发送网包的玩家ID
            if (bDel) {
                GameRules.PlayerManager.m_tabOprtCan = GameRules.PlayerManager.m_tabOprtCan.filter(item => {
                    item.nPlayerID == tabData.PlayerID &&
                        item.typeOprt == tabData.typeOprt
                })
                return value
            }
        }
        return false
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
        // 对于每一个GS状态都持续update进行
    }

    /**玩家死亡 */
    onEvent_PlayerDie(event: {
        player: Player
    }) {
        const nAlive = GameRules.PlayerManager.getAlivePlayerCount()
        GameRules.PlayerManager.m_tabEnd.push({
            steamid64: tostring(PlayerResource.GetSteamID(event.player.m_nPlayerID)),
            rank_num: nAlive + 1,
            heroname: event.player.m_eHero.GetUnitName(),
            time_game: math.floor(GameRules.GetGameTime()),
            is_abandon: event.player.m_bAbandon
        })
        print("nAlive:", nAlive)
        if (nAlive == 2) {
            // 开启决战
            GameRules.PlayerManager.m_bFinalBattle = true
            GameRules.EventManager.FireEvent("Event_FinalBattle")
        } else if (nAlive < 2) {
            print("onEvent_PlayerDie:游戏结束")
            print("PlayerManager:isAlivePlayer(player.m_nPlayerID):", GameRules.PlayerManager.isAlivePlayer(event.player.m_nPlayerID))
            GameRules.SetGameWinner(DotaTeam.GOODGUYS)

            // 添加第一名
            for (const player of GameRules.PlayerManager.m_tabPlayers) {
                if (GameRules.PlayerManager.isAlivePlayer(player.m_nPlayerID)) {
                    GameRules.PlayerManager.m_tabEnd.push({
                        steamid64: tostring(PlayerResource.GetSteamID(player.m_nPlayerID)),
                        rank_num: 1,
                        heroname: player.m_eHero.GetUnitName(),
                        time_game: math.floor(GameRules.GetGameTime()),
                        is_abandon: player.m_bAbandon
                    })
                    break
                } else {
                    print("steamid64:", tostring(PlayerResource.GetSteamID(event.player.m_nPlayerID)))
                    print("rank_num: 1")
                    print("heroname:", event.player.m_eHero.GetUnitName())
                    print("time_game:", math.floor(GameRules.GetGameTime()))
                    print("is_abandon:", player.m_bAbandon)
                }
            }

            print("print PlayerManager.m_tabEnd:")
            DeepPrintTable(GameRules.PlayerManager.m_tabEnd)
        }

        // 剩余操作出来
        if (GameRules.PlayerManager.m_nOrderID == event.player.m_nPlayerID
            && GameRules.PlayerManager.m_typeState != GameMessage.GS_DeathClearing) {
            // 移除操作
            for (let i = 0; i < GameRules.PlayerManager.m_tabOprtCan.length; i++) {
                delete GameRules.PlayerManager.m_tabOprtCan[i]
            }
            if (nAlive > 1) {
                if (GameRules.PlayerManager.m_typeStateCur != GameMessage.GS_ReadyStart) {
                    // GSManager:setState(GS_Finished)
                }
            }
        }

        // 改变首位玩家
        print("GameRules.PlayerManager.m_nOrderFirst == event.player.m_nPlayerID:", GameRules.PlayerManager.m_nOrderFirst == event.player.m_nPlayerID)
        if (event.player.m_nPlayerID == GameRules.PlayerManager.m_nOrderFirst) {
            GameRules.PlayerManager.m_nOrderFirst = this.getNextValidOrder(event.player.m_nPlayerID)
        }
        print("self.m_nOrderFirst:", GameRules.PlayerManager.m_nOrderFirst)

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
        let tabChangeGold: number[]
        tabChangeGold = GameRules.PlayerManager.m_tabChangeGold
        if (!tabChangeGold) {
            tabChangeGold = []
        }
        if (!tabChangeGold[event.player.m_nPlayerID]) {
            tabChangeGold[event.player.m_nPlayerID] = 0
        }
        tabChangeGold[event.player.m_nPlayerID] += event.nGold
        CustomNetTables.SetTableValue("GamingTable", "change_gold", tabChangeGold)
        print("[network-changeGold]==============================")
        DeepPrintTable(tabChangeGold)

        // 设置2秒后清除
        if (!GameRules.PlayerManager.m_nTimeChangeGold) {
            Timers.CreateTimer(0.1, () => {
                GameRules.PlayerManager.m_nTimeChangeGold--
                if (GameRules.PlayerManager.m_nTimeChangeGold > 0) return 0.1
                tabChangeGold = null
                GameRules.PlayerManager.m_tabChangeGold = null
                GameRules.PlayerManager.m_nTimeChangeGold = null
                CustomNetTables.SetTableValue("GamingTable", "change_gold", {})
            })
        }
        GameRules.PlayerManager.m_nTimeChangeGold = 20
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
        GameRules.EventManager.FireEvent("EventMove", { entity: event.player.m_eHero })

        const oPlayer = GameRules.PlayerManager.getPlayer(event.player.m_nPlayerID)
        const pathDes = GameRules.PathManager.getNextPath(oPlayer.m_pathCur, event.nNum1 + event.nNum2)

        if (interpret(GameRules.GameLoop.GameStateLoop).getState().value == "GSWaitOprt") {
            GameRules.GameLoop.GameStateService.send("to_move")
        }
        oPlayer.moveToPath(pathDes, (bSuccess: boolean) => {
            // 触发移动结束事件
            if (oPlayer.m_typeState == GameMessage.GS_Move ||
                oPlayer.m_typeState == GameMessage.GS_DeathClearing) {
                // GSMOVE_Exit()结束移动
                GameRules.GameLoop.GameStateService.send("to_waitopr")
            }
            GameRules.EventManager.FireEvent("Event_MoveEnd", { entity: event.player.m_eHero })
            event.player.m_nRollMove++
            // 玩家死亡不操作
            if (event.player.m_bDie) return
            // 触发到达路径功能
            pathDes.onPath(event.player)

            // 判断豹子触发
            const tEventJudge = { player: event.player }
            if (!event.bIgnore && event.nNum1 == event.nNum2 &&
                (oPlayer.m_typeState & (GameMessage.PS_InPrison | GameMessage.PS_AtkMonster)) === 0) {
                // 豹子,发送roll点操作
                this.broadcastOprt({
                    typeOprt: GameMessage.TypeOprt.TO_Roll,
                    bPrison: tonumber(Constant.PRISON_BAOZI_COUNT - 1 == GameRules.PlayerManager.m_nBaoZi),
                    nPlayerID: oPlayer.m_nPlayerID
                })
                // 追加时间
                if (GameRules.PlayerManager.m_timeOprt <= Constant.TIME_BAOZI_YZ) {
                    GameRules.PlayerManager.m_timeOprt = Constant.TIME_BAOZI_YZ + Constant.TIME_BAOZI_ADD
                }
                return
            }

            // 发送操作,完成回合
            this.broadcastOprt({
                typeOprt: GameMessage.TypeOprt.TO_Finish,
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

    /**广播操作 */
    broadcastOprt(tabOprt) {
        // 添加可操作记录
        GameRules.PlayerManager.m_tabOprtCan.push(tabOprt)
        GameRules.PlayerManager.m_tabOprtBroadcast.push(tabOprt)
        // 发送消息给操作者
        GameRules.PlayerManager.broadcastMsg("GM_Operator", tabOprt)
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

    /**获取顺序上的order */
    addOrder(nOrder: number) {
        if (nOrder < 1) return this.addOrder(nOrder + GameRules.PlayerManager.getPlayerCount())
        nOrder--
        return (nOrder % GameRules.PlayerManager.getPlayerCount()) + 1
    }

    /**设置结算数据 */
    setGameEndData() {

    }
}

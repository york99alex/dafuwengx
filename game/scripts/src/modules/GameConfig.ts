import { GameLoop } from "../mode/GameLoop";
import { HeroSelection } from "../mode/HeroSelection";
import { Constant } from "../mode/constant";
import { PathManager } from "../path/PathManager";
import { PlayerManager } from "../player/playermanager";

export class GameConfig {

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
        // 购买物品
        CustomGameEventManager.RegisterListener("Event_Roll", (_, event) => this.onEvent_Roll(event))
        CustomGameEventManager.RegisterListener("Event_ChangeGold_Atk", () => this.onEvent_ChangeGold())
        CustomGameEventManager.RegisterListener("Event_ItemBuy", () => this.onEvent_ItemBuy())
        CustomGameEventManager.RegisterListener("Event_PlayerDie", () => this.onEvent_PlayerDie())
        CustomGameEventManager.RegisterListener("Event_Service_AllData", () => GameConfig.onEvent_Service_AllData())
    }

    //----------消息回调----------
    // 注册消息
    registerMessage() {
        CustomGameEventManager.RegisterListener("GM_Operator", (_, event) => this.onMsg_oprt(event))
    }

    // 操作请求
    onMsg_oprt(tabData) {
        DeepPrintTable(tabData)
        print("[LUA]:Receive=================>>>>>>>>>>>>>>>")
        if (tabData.typeOprt == null) {
            return
        }

    }

    registerThink() {
    }

    static onEvent_Service_AllData() {
        throw new Error("Method not implemented.");
    }
    onEvent_PlayerDie() {
        throw new Error("Method not implemented.");
    }
    onEvent_ItemBuy() {
        throw new Error("Method not implemented.");
    }
    onEvent_ChangeGold() {
        throw new Error("Method not implemented.");
    }

    // 玩家roll点后移动
    onEvent_Roll(event: {
        bIgnore: 0 | 1;
        nNum1: number;
        nNum2: number;
        PlayerID: PlayerID;
    }) {
        if (event.bIgnore) {
            return;
        }
        print(event)

        // 触发移动事件
        CustomGameEventManager.Send_ServerToPlayer(PlayerResource.GetPlayer(event.PlayerID), "Event_Move", {
            entity: PlayerResource.GetSelectedHeroEntity(event.PlayerID)
        })

        // // 建议通过PathManager的方法传入playerID获取其当前curPath
        // let pathDes = PathManager.getNextPath(
        //     event.player.curPath,
        //     event.nNum1 + event.nNum2
        // );

        // // 设置状态
        // // Loop

        // event.player.moveToPath(pathDes, success => {

        //     // 触发移动结束事件
        //     if (GameState.Move === GMManager.state ||
        //         GameState.DeathClearing === GMManager.state) {
        //         // 移动结束
        //         GameStateManager.setState(GameState.WaitOperator);
        //     }

        //     EventManager.fireEvent("Event_MoveEnd", {
        //         entity: event.player.hero
        //     });

        //     event.player.rollMoveCount++;

        //     // 玩家死亡不操作
        //     if (event.player.isDead) {
        //         return;
        //     }

        //     // 判断路径触发功能
        //     pathDes.onPath(event.player);

        //     // 触发豹子判断
        //     const judgeEvent = { player: event.player };
        //     EventManager.fireEvent("Event_RollBaoZiJudge", judgeEvent);

        //     if (!judgeEvent.bIgnore &&
        //         event.nNum1 === event.nNum2 &&
        //         (PlayerState.InPrison | PlayerState.AtkMonster) === 0) {

        //         // 豹子,发送roll点操作
        //         GMManager.broadcastOprt({
        //             typeOprt: OpType.Roll,
        //             bPrison: PRISON_BAOZI_COUNT - 1 == GMManager.baoZiCount,
        //             nPlayerID: event.player.id
        //         });

        //         // 追加时间
        //         if (GMManager.oprtTime < TIME_BAOZI_YZ) {
        //             GMManager.oprtTime += TIME_BAOZI_ADD;
        //         }

        //         return;
        //     }

        //     // 发送操作:完成回合
        //     GMManager.broadcastOprt({
        //         typeOprt: OpType.Finish,
        //         nPlayerID: event.player.id
        //     });

        // });

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


}

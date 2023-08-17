import { EventObject, StateMachine, createMachine, interpret } from "../utils/xstate/xstate-dota";
import { Constant } from "./constant";
import { GameMessage } from "./gamemessage";

export class GameLoop {

    MainService: StateMachine.Service<object, EventObject, {
        value: any
        context: object
    }>
    GameStateService: StateMachine.Service<object, EventObject, {
        value: any
        context: object
    }>

    // 游戏的主循环
    MainLoop = createMachine({
        id: "MainLoop",
        initial: "GameInit",
        states: {
            GameInit: { on: { to_heroselection: "HeroSelection" }, entry: "GameInit_Entry", exit: "GameInit_Exit" },
            HeroSelection: { on: { to_gamestate: "GameState" }, entry: "HeroSelection_Entry", exit: "HeroSelection_Exit" },
            GameState: { on: { to_gameover: "GameOver" }, entry: "GameState_Entry", exit: "GameState_Exit" },
            GameOver: { entry: "GameOver_Entry" }
        }
    }, {
        actions: {
            GameInit_Entry: () => this.GameInit_Entry(),
            GameInit_Exit: () => this.GameInit_Exit(),
            HeroSelection_Entry: () => this.HeroSelection_Entry(),
            HeroSelection_Exit: () => this.HeroSelection_Exit(),
            GameState_Entry: () => this.GameState_Entry(),
            GameState_Exit: () => this.GameState_Exit(),
            GameOver_Entry: () => this.GameOver_Entry(),
        }
    })

    // 游戏回合循环
    GameStateLoop = createMachine({
        id: "GameStateLoop",
        initial: "GSNone",
        states: {
            GSNone: { on: { to_readystart: "GSReadyStart" }, entry: "GSNone_Entry", exit: "GSNone_Exit" },
            GSReadyStart: { on: { to_begin: "GSBegin" }, entry: "GSReadyStart_Entry", exit: "GSReadyStart_Exit" },
            GSSupply: { on: { to_begin: "GSBegin" }, entry: "GSSupply_Entry", exit: "GSSupply_Exit" },
            GSBegin: { on: { to_waitoprt: "GSWaitOprt", to_finished: "GSFinished" }, entry: "GSBegin_Entry", exit: "GSBegin_Exit" },
            GSWaitOprt: { on: { to_move: "GSMove", to_wait: "GSWait" }, entry: "GSWaitOprt_Entry", exit: "GSWaitOprt_Exit" },
            GSWait: { on: { to_waitoprt: "GSWaitOprt" }, entry: "GSWait_Entry", exit: "GSWait_Exit" },
            GSMove: { on: { to_waitopr: "GSWaitOprt", to_finished: "GSFinished" }, entry: "GSMove_Entry", exit: "GSMove_Exit" },
            GSFinished: { on: { to_begin: "GSBegin" }, entry: "GSFinished_Entry", exit: "GSFinished_Exit" },
            GSDeathClearing: { entry: "GSDeathClearing_Entry", exit: "GSDeathClearing_Exit" }
        }
    }, {
        actions: {
            GSNone_Entry: () => this.GSNone_Entry(),
            GSNone_Exit: () => this.GSNone_Exit(),
            GSReadyStart_Entry: () => this.GSReadyStart_Entry(),
            GSReadyStart_Exit: () => this.GSReadyStart_Exit(),
            GSSupply_Entry: () => this.GSSupply_Entry(),
            GSSupply_Exit: () => this.GSSupply_Exit(),
            GSBegin_Entry: () => this.GSBegin_Entry(),
            GSBegin_Exit: () => this.GSBegin_Exit(),
            GSWaitOprt_Entry: () => this.GSWaitOprt_Entry(),
            GSWaitOprt_Exit: () => this.GSWaitOprt_Exit(),
            GSWait_Entry: () => this.GSWait_Entry(),
            GSWait_Exit: () => this.GSWait_Exit(),
            GSMove_Entry: () => this.GSMove_Entry(),
            GSMove_Exit: () => this.GSMove_Exit(),
            GSFinished_Entry: () => this.GSFinished_Entry(),
            GSFinished_Exit: () => this.GSFinished_Exit(),
            GSDeathClearing_Entry: () => this.GSDeathClearing_Entry(),
            GSDeathClearing_Exit: () => this.GSDeathClearing_Exit(),
        }
    })

    /**
     * 给全局游戏实体绑定一个计时器,间隔为参数interval,执行函数也是传入的cb,cb返回的
     * @param {() => number | null} callback - callback返回number为每多少秒执行,null为结束计时器
     * @param {number} delay - 延迟几秒后执行callback
     */
    Timer(callback: () => number | null, delay: number) {
        GameRules.GetGameModeEntity().SetContextThink(DoUniqueString("timer"), callback, delay)
    }

    constructor() { }

    MainStart() {
        // start执行MainLoop的initial,也即调用GameInit_Entry方法
        this.MainService = interpret(this.MainLoop).start()
    }

    GamestateStart() {
        // start执行MainLoop的initial,也即调用GameInit_Entry方法
        this.GameStateService = interpret(this.GameStateLoop).start()
    }

    getMainState(Loop: StateMachine.Service<object, EventObject, {
        value: any
        context: object
    }>) {
        return interpret(this.MainLoop).getState().value
    }

    getGameState(Loop: StateMachine.Service<object, EventObject, {
        value: any
        context: object
    }>) {
        return interpret(this.GameStateLoop).getState().value
    }

    // MainLoop

    GameInit_Entry() {
        print("游戏主循环开始")
        this.Timer(() => {
            this.MainService.send("to_heroselection")
            return null
        }, 3)
    }
    GameInit_Exit() { }
    HeroSelection_Entry() {
        this.Timer(() => {
            this.GameStateService = interpret(this.GameStateLoop).start()
            return null
        }, 3)
    }
    HeroSelection_Exit() { }
    GameState_Entry() {
    }
    GameOver_Entry() { }
    GameState_Exit() { }

    // GameStateLoop

    GSNone_Entry() {
        print("GameState_GSNone_Entry")
        if (GameRules.PlayerManager.m_bAllPlayerInit) {
            // 设置首位操作者
            GameRules.GameConfig.m_nOrderFirst = GameRules.HeroSelection.m_PlayersSort[GameRules.GameConfig.m_nOrderFirstIndex]
            GameRules.GameConfig.setOrder(GameRules.GameConfig.m_nOrderFirst)
            GameRules.GameConfig.m_nRound = 0
            this.GameStateService.send("to_readystart")
        }
    }

    GSNone_Exit() { }

    GSReadyStart_Entry() {
        this.setState(GameMessage.GS_ReadyStart)
        print("GameState_GSReadyStart_Entry")
        GameRules.GameConfig.m_timeOprt = 50
        this.Timer(() => {
            GameRules.GameConfig.updateTimeOprt()
            if (GameRules.GameConfig.m_timeOprt <= 0) {
                // 进入GSBegin_Entry
                const isBegin = GameRules.GameConfig.addRound()
                // 游戏开始
                GameRules.EventManager.FireEvent("Event_GameStart")
                if (isBegin) {
                    this.GameStateService.send("to_begin")
                }
                // 剩余两人开启终局决战
                if (GameRules.PlayerManager.getAlivePlayerCount() <= 2) {
                    GameRules.GameConfig.m_bFinalBattle = true
                    GameRules.EventManager.FireEvent("Event_FinalBattle")
                }
                return
            }
            return 0.1
        }, 0)
    }

    GSReadyStart_Exit() {
        GameRules.EventManager.FireEvent("Event_PlayerRoundBefore", { typeGameState: GameMessage.GS_Begin })
    }

    GSBegin_Entry() {
        this.setState(GameMessage.GS_Begin)
        print("GameState_GSBegin_Entry")
        // 通知当前玩家回合开始
        const oPlayer = GameRules.PlayerManager.getPlayer(GameRules.GameConfig.m_nOrderID)
        if (oPlayer == null || oPlayer.m_bDie) {
            this.GameStateService.send("to_finished")
            return
        }

        // 触发玩家回合开始事件
        GameRules.EventManager.FireEvent("Event_PlayerRoundBegin", { oPlayer: oPlayer, bRoll: true })

        // 广播roll点操作
        let tabOprt: { nPlayerID: number, typeOprt: number }
        tabOprt.nPlayerID = GameRules.GameConfig.m_nOrderID
        tabOprt.typeOprt = GameMessage.TypeOprt.TO_Roll
        GameRules.GameConfig.broadcastOprt(tabOprt)
        // 进入等待操作阶段
        this.GameStateService.send("to_waitoprt")
        if (oPlayer.m_bDisconnect) {
            GameRules.GameConfig.m_timeOprt = Constant.TIME_OPERATOR_DISCONNECT
        } else {
            GameRules.GameConfig.m_timeOprt = Constant.TIME_OPERATOR
        }
    }

    GSBegin_Exit() { }

    GSWaitOprt_Entry() {
        this.setState(GameMessage.GS_WaitOperator)
        print("GameState_GSWaitOprt_Entry")
        this.Timer(() => {
            GameRules.GameConfig.updateTimeOprt()
            const timeOprt = GameRules.GameConfig.m_timeOprt
            if (timeOprt < 0) {
                // 时间结束,自动操作
                GameRules.GameConfig.autoOprt()
            } else if (timeOprt == 0) {
                // EmitGlobalSound("Custom.Time.Finish")
            } else if (timeOprt > 0 && timeOprt < 50) {
                if (timeOprt % 10 == 0) {
                    // EmitGlobalSound("Custom.Time.Urgent")

                    // 默认自动操作roll点
                    GameRules.GameConfig.autoOprt(GameMessage.TypeOprt.TO_Roll)
                }
            }
            return 0.1
        }, 0)
        // 通过Roll点进入下一状态
    }

    GSWaitOprt_Exit() {

    }


    GSSupply_Entry() {

    }
    GSSupply_Exit() {

    }


    GSWait_Entry() {

    }
    GSWait_Exit() {

    }

    GSMove_Entry() {
        print("进入GSMOVE")

    }

    GSMove_Exit() {
        print("离开GSMOVE")

    }

    GSFinished_Entry() {
        this.setState(GameMessage.GS_Finished)
        print("GameState_GSFinished_Entry")
        const oPlayer = GameRules.PlayerManager.getPlayer(GameRules.GameConfig.m_nOrderID)
        oPlayer.setRoundFinished(true)

        // 下个回合玩家顺序
        GameRules.GameConfig.setOrder(GameRules.GameConfig.getNextValidOrder(GameRules.GameConfig.m_nOrderID))
        GameRules.GameConfig.m_nBaoZi = 0

        this.GameStateService.send("to_begin")
    }
    GSFinished_Exit() {
        // 新的回合准备
        const oPlayer = GameRules.PlayerManager.getPlayer(GameRules.GameConfig.m_nOrderID)
        let isBegin = true
        if (GameRules.GameConfig.m_nOrderFirst == GameRules.GameConfig.m_nOrderID
            && oPlayer.m_bRoundFinished) {
            isBegin = GameRules.GameConfig.addRound()
        }

        if (isBegin) {
            GameRules.EventManager.FireEvent("Event_PlayerRoundBefore", { typeGameState: GameMessage.GS_Begin })
        }
    }

    GSDeathClearing_Exit() {

    }
    GSDeathClearing_Entry() {

    }

    /**让出当前状态 */
    yieldState(): any {
        throw new Error("Method not implemented.");
    }

    /**恢复挂起的状态 */
    resumeState(_YieldStateCO: any) {
        throw new Error("Method not implemented.");
    }

    /**设置当前状态*/
    setState(typeState: number) {
        print("last state: ", GameRules.GameConfig.m_typeState, " cur state: ", typeState)
        GameRules.GameConfig.m_typeState = typeState
        // TODO: 验证state切换
        CustomNetTables.SetTableValue("GamingTable", "state", { typeState: typeState })
    }


}
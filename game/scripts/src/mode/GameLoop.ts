import { EventObject, StateMachine, createMachine, interpret } from "../utils/xstate/xstate-dota";
import { Constant } from "./constant";
import { GS_Begin, GS_DeathClearing, GS_Finished, GS_Move, GS_None, GS_ReadyStart, GS_Wait, GS_WaitOperator, TypeOprt } from "./gamemessage";

export class GameLoop {

    m_timeWait: number = 0
    m_typeStateCur: number = GS_None
    m_typeStateLast: number = null
    m_thinkName: string = null
    m_bRoundBefore: boolean


    GameStateService: StateMachine.Service<object, EventObject, {
        value: any
        context: object
    }>


    // 游戏回合循环
    GameStateLoop = createMachine({
        id: "GameStateLoop",
        initial: "GSNone",
        states: {
            GSNone: { on: { toreadystart: "GSReadyStart" }, entry: "GSNone_Entry", exit: "GSNone_Exit" },
            GSReadyStart: { on: { tobegin: "GSBegin", toRoundBefore: "GSRoundBefore" }, entry: "GSReadyStart_Entry", exit: "GSReadyStart_Exit" },
            GSRoundBefore: { on: { tobegin: "GSBegin", tomove: "GSMove" }, entry: "GSRoundBefore_Entry", exit: "GSRoundBefore_Exit" },
            GSSupply: { on: { tobegin: "GSBegin" }, entry: "GSSupply_Entry", exit: "GSSupply_Exit" },
            GSBegin: { on: { towaitoprt: "GSWaitOprt", tofinished: "GSFinished" }, entry: "GSBegin_Entry", exit: "GSBegin_Exit" },
            GSWaitOprt: { on: { tomove: "GSMove", towait: "GSWait", tofinished: "GSFinished" }, entry: "GSWaitOprt_Entry", exit: "GSWaitOprt_Exit" },
            GSWait: { on: { towaitoprt: "GSWaitOprt" }, entry: "GSWait_Entry", exit: "GSWait_Exit" },
            GSMove: { on: { towaitoprt: "GSWaitOprt", toRoundBefore: "GSRoundBefore", tobegin: "GSBegin" }, entry: "GSMove_Entry", exit: "GSMove_Exit" },
            GSFinished: { on: { toRoundBefore: "GSRoundBefore" }, entry: "GSFinished_Entry", exit: "GSFinished_Exit" },
            GSDeathClearing: { entry: "GSDeathClearing_Entry", exit: "GSDeathClearing_Exit" },
            GSEnd: { entry: "GSEnd_Entry", exit: "GSEnd_Exit" }
        }
    }, {
        actions: {
            GSNone_Entry: () => this.GSNone_Entry(),
            GSNone_Exit: () => this.GSNone_Exit(),
            GSReadyStart_Entry: () => this.GSReadyStart_Entry(),
            GSReadyStart_Exit: () => this.GSReadyStart_Exit(),
            GSRoundBefore_Entry: () => this.GSRoundBefore_Entry(),
            GSRoundBefore_Exit: () => this.GSRoundBefore_Exit(),
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
            GSEnd_Entry: () => this.GSEnd_Entry(),
            GSEnd_Exit: () => this.GSEnd_Exit(),
        }
    })

    /**
     * 给全局游戏实体绑定一个计时器,间隔为参数interval,执行函数也是传入的cb,cb返回的
     * @param callback - callback返回number为每多少秒执行,null为结束计时器
     * @param {number} delay - 延迟几秒后执行callback
     */
    Timer(callback: () => number | null, delay: number) {
        if (this.m_thinkName) GameRules.GetGameModeEntity().StopThink(this.m_thinkName)
        this.m_thinkName = DoUniqueString("timer")
        GameRules.GetGameModeEntity().SetContextThink(this.m_thinkName, callback, delay)
    }

    constructor() { }

    GamestateStart() {
        // start执行MainLoop的initial,也即调用GameInit_Entry方法
        this.GameStateService = interpret(this.GameStateLoop).start()
    }

    getGameState() {
        return this.GameStateService.getState().value
    }

    // GameStateLoop

    GSNone_Entry(): void {
        print("GameState_GSNone_Entry")
        if (GameRules.PlayerManager.m_bAllPlayerInit) {
            // 设置首位操作者
            GameRules.GameConfig.m_nOrderFirst = GameRules.HeroSelection.m_PlayersSort[GameRules.GameConfig.m_nOrderFirstIndex]
            GameRules.GameConfig.setOrder(GameRules.GameConfig.m_nOrderFirst)
            GameRules.GameConfig.m_nRound = 0
            this.Timer(() => {
                this.GameStateService.send("toreadystart")
                return null
            }, 0)
        }
    }

    GSNone_Exit() { }

    GSReadyStart_Entry() {
        this.setGameState(GS_ReadyStart)
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
                    this.Timer(() => {
                        this.GameStateService.send("toRoundBefore")
                        return null
                    }, 0)
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
    }

    /**玩家回合开始阶段Entry */
    GSRoundBefore_Entry() {
        this.setGameState(GS_Begin)
        print("GameState_GSRoundBefore_Entry")
        GameRules.EventManager.FireEvent("Event_PlayerRoundBefore", { typeGameState: GS_Begin })
        print("GameState_GSRoundBefore_Entry_m_bRoundBefore:", this.m_bRoundBefore)
        this.Timer(() => {
            if (!this.m_bRoundBefore) {
                this.GameStateService.send("tobegin")
            }
            return null
        }, 0.5)
    }

    /**玩家回合开始阶段Exit */
    GSRoundBefore_Exit() {
        this.m_bRoundBefore = null
    }

    GSBegin_Entry() {
        this.setGameState(GS_Begin)
        print("GameState_GSBegin_Entry")
        // 通知当前玩家回合开始
        const oPlayer = GameRules.PlayerManager.getPlayer(GameRules.GameConfig.m_nOrderID)
        if (oPlayer == null || oPlayer.m_bDie) {
            this.Timer(() => {
                this.GameStateService.send("tofinished")
                return null
            }, 0)
            return
        }

        // 触发玩家回合开始事件
        const tabEvent = {
            oPlayer: oPlayer,
            bRoll: true
        }
        GameRules.EventManager.FireEvent("Event_PlayerRoundBegin", tabEvent)

        print("===Event_PlayerRoundBegin===tabEvent:")
        print("oPlayer:",tabEvent.oPlayer)
        print("bRoll:",tabEvent.bRoll)
        if (tabEvent.bRoll) {
            // 广播roll点操作
            const tabOprt = {
                nPlayerID: GameRules.GameConfig.m_nOrderID,
                typeOprt: TypeOprt.TO_Roll
            }
            DeepPrintTable(tabOprt)
            GameRules.GameConfig.broadcastOprt(tabOprt)
            // 进入等待操作阶段
            this.Timer(() => {
                this.GameStateService.send("towaitoprt")
                return null
            }, 0)
            if (oPlayer.m_bDisconnect) {
                GameRules.GameConfig.m_timeOprt = Constant.TIME_OPERATOR_DISCONNECT
            } else {
                GameRules.GameConfig.m_timeOprt = Constant.TIME_OPERATOR
            }
        }
    }

    GSBegin_Exit() { }

    GSWaitOprt_Entry() {
        this.setGameState(GS_WaitOperator)
        print("GameState_GSWaitOprt_Entry")
        this.Timer(() => {
            GameRules.GameConfig.updateTimeOprt()
            const timeOprt = GameRules.GameConfig.m_timeOprt
            // print("timeOprt:", timeOprt)
            if (timeOprt < 0) {
                // 时间结束,自动操作
                print("自动操作")
                GameRules.GameConfig.autoOprt()
                return
            } else if (timeOprt == 0) {
                EmitGlobalSound("Custom.Time.Finish")
            } else if (0 < timeOprt && timeOprt < 51) {
                if (timeOprt % 10 == 0) {
                    EmitGlobalSound("Custom.Time.Urgent")
                    // 默认自动操作roll点
                    GameRules.GameConfig.autoOprt(TypeOprt.TO_Roll)
                }
            }
            return 0.1
        }, 0)
        // End: 通过Roll点进入下一状态
    }

    GSWaitOprt_Exit() {
        print("GameState_GSWaitOprt_Exit")
    }

    GSWait_Entry() {
        this.setGameState(GS_Wait)
        print("GameState_GSWait_Entry")
        this.m_timeWait = 200
        Timers.CreateTimer(0, () => {
            print(this.m_timeWait -= 1)
            if (this.m_timeWait <= 0) {
                // 如果移动超时,blink然后进入waitoprt
                // TODO:
                // this.GameStateService.send("towaitoprt")
                return
            }
            return 0.1
        })
    }

    GSWait_Exit() {
        print("GameState_GSWait_Exit")
        GameRules.EventManager.FireEvent("Event_GSWait_Over")
    }

    GSMove_Entry() {
        this.setGameState(GS_Move)
        print("GameState_GSMove_Entry")
    }

    GSMove_Exit() {
        print("GameState_GSMove_Exit")
        GameRules.EventManager.FireEvent("Event_GSMove_Over")
        this.m_bRoundBefore = null
    }

    GSSupply_Entry() {

    }

    GSSupply_Exit() {

    }

    GSFinished_Entry() {
        this.setGameState(GS_Finished)
        print("GameState_GSFinished_Entry, m_nOrderID=:", GameRules.GameConfig.m_nOrderID)
        const oPlayer = GameRules.PlayerManager.getPlayer(GameRules.GameConfig.m_nOrderID)
        oPlayer.setRoundFinished(true)

        // 下个回合玩家顺序
        GameRules.GameConfig.setOrder(GameRules.GameConfig.getNextValidOrder(GameRules.GameConfig.m_nOrderID))
        GameRules.GameConfig.m_nBaoZi = 0

        // 新的回合准备
        if (GameRules.GameConfig.m_nOrderFirst == GameRules.GameConfig.m_nOrderID
            && oPlayer.m_bRoundFinished) {
            GameRules.GameConfig.addRound()
        }
        this.Timer(() => {
            this.GameStateService.send("toRoundBefore")
            return null
        }, 0)
    }

    GSFinished_Exit() { }

    GSDeathClearing_Entry() {
        this.setGameState(GS_DeathClearing)
        print("GameState_GSDeathClearing_Entry")
        print("=========DeathClearing=========")
        this.Timer(() => {
            GameRules.GameConfig.updateTimeOprt()
            const timeOprt = GameRules.GameConfig.m_timeOprt
            // print("timeOprt:", timeOprt)
            if (timeOprt < 0) {
                // 时间结束,自动操作
                print("自动操作")
                GameRules.GameConfig.autoOprt()
                return
            } else if (timeOprt == 0) {
                EmitGlobalSound("Custom.Time.Finish")
            } else if (0 < timeOprt && timeOprt < 51) {
                if (timeOprt % 10 == 0)
                    EmitGlobalSound("Custom.Time.Urgent")
            }
            return 0.1
        }, 0)
    }

    GSDeathClearing_Exit() {
        //TODO: 死亡清算?
    }

    GSEnd_Entry() {

    }

    GSEnd_Exit() {

    }

    /**设置当前状态*/
    setGameState(typeState: number) {
        print("last state: ", GameRules.GameConfig.m_typeState, " cur state: ", typeState)
        this.m_typeStateLast = GameRules.GameConfig.m_typeState
        this.m_typeStateCur = typeState
        GameRules.GameConfig.m_typeState = typeState
        // TODO: 验证state切换
        CustomNetTables.SetTableValue("GamingTable", "state", { typeState: typeState })
    }


}
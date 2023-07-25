import { EventObject, StateMachine, createMachine, interpret } from "../utils/xstate/xstate-dota";

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
            GSBegin: { on: { to_waitoprt: "GSWaitOprt" }, entry: "GSBegin_Entry", exit: "GSBegin_Exit" },
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

    Timer(cb: () => number | null, interval: number) {
        // 给全局游戏实体绑定一个计时器,间隔为参数interval,执行函数也是传入的cb,cb返回的
        GameRules.GetGameModeEntity().SetContextThink(DoUniqueString("timer"), cb, interval)
    }

    constructor() {

    }

    Start() {
        // start执行MainLoop的initial,也即调用GameInit_Entry方法
        this.MainService = interpret(this.MainLoop).start()
    }

    // MainLoop

    GameInit_Entry(): void {
        print("游戏主循环开始")
        this.Timer(() => {
            this.MainService.send("to_heroselection")
            return null
        }, 3)
    }
    GameInit_Exit(): void {
        print("游戏初始化结束")
    }
    HeroSelection_Entry(): void {
        print("英雄选择开始")
        this.Timer(() => {
            this.GameStateService = interpret(this.GameStateLoop).start()
            return null
        }, 3)
    }
    HeroSelection_Exit(): void {
        print("英雄选择结束")
    }
    GameState_Entry(): void {
        print("游戏主循环开始")

    }
    GameOver_Entry(): void {
    }
    GameState_Exit(): void {
    }

    // GameStateLoop

    GSNone_Entry(): void {
        print("GameState初始化开始,GSNone_Entry")
        this.Timer(() => {
            this.GameStateService.send("to_readystart")
            return null
        }, 3)
    }
    GSNone_Exit(): void {
        print("GameState初始化结束,GSNone_Exit")
    }
    GSReadyStart_Entry(): void {

    }
    GSReadyStart_Exit(): void {

    }
    GSSupply_Entry(): void {

    }
    GSSupply_Exit(): void {

    }
    GSBegin_Entry(): void {

    }
    GSBegin_Exit(): void {

    }
    GSWaitOprt_Exit(): void {

    }
    GSWaitOprt_Entry(): void {

    }
    GSWait_Entry(): void {

    }
    GSWait_Exit(): void {

    }
    GSMove_Exit(): void {

    }
    GSMove_Entry(): void {

    }

    GSFinished_Entry(): void {

    }
    GSFinished_Exit(): void {

    }

    GSDeathClearing_Exit(): void {

    }
    GSDeathClearing_Entry(): void {

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
    setState(typeState: number, immediately?: boolean) {
        throw new Error("Method not implemented.");
    }

    
}
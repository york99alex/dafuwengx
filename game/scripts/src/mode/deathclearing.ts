import { Player } from '../player/player';
import { TIME_OPERATOR } from '../constants/constant';
import { GS_Move, GS_None, GS_Supply, GS_Wait, TypeOprt } from '../constants/gamemessage';

/**死亡清算 */
export class DeathClearing {
    beforeGameState: {
        m_typeState: number;
        m_nOrderID: PlayerID;
        m_timeOprt: number;
        m_tabOprtSend?: { nPlayerID: number; typeOprt: number }[];
        m_tabOprtBroadcast?: { nPlayerID: number; typeOprt: number }[];
    } = {
        m_typeState: GS_None,
        m_nOrderID: -1,
        m_timeOprt: -1,
    };
    mHooks = null;
    //  正在清算的玩家
    mDCPlayers: PlayerID[] = [];

    resumeGameTimer = null;
    static EvtID = {
        //  触发死亡清算
        Event_TO_SendDeathClearing: 'Event_TO_SendDeathClearing',
        //  死亡清算操作结束
        Event_TO_DeathClearing: 'Event_TO_DeathClearing',
    };

    init() {
        this.beforeGameState = null;
        GameRules.EventManager.Register(
            DeathClearing.EvtID.Event_TO_SendDeathClearing,
            (event: { nPlayerID: PlayerID }) => this.ProcessSendDC(event),
            null,
            100
        );
        GameRules.EventManager.Register(DeathClearing.EvtID.Event_TO_DeathClearing, event => this.ProcessDC(event), null, 101);
    }

    /**玩家发起死亡清算 */
    ProcessSendDC(event: { nPlayerID: PlayerID }) {
        const player = GameRules.PlayerManager.getPlayer(event.nPlayerID);
        print('===ProcessSendDC: playerid ' + event.nPlayerID + ' gold:' + player.GetGold());
        const gameState = GameRules.GameConfig.m_typeState;
        print('===DeathClearing===m_typeState:', gameState, 'GameLoop.state:' + GameRules.GameLoop.getGameState());

        if (player.GetGold() < 0 && (gameState == GS_Move || gameState == GS_Wait || gameState == GS_Supply)) {
            let EvtID: string = '';
            switch (gameState) {
                case GS_Move:
                    EvtID = 'Event_GSMove_Over';
                    break;
                case GS_Wait:
                    EvtID = 'Event_GSWait_Over';
                    break;
                case GS_Supply:
                    EvtID = 'Event_GSSupply_Over';
                    break;
            }
            GameRules.EventManager.Register(EvtID, () => {
                print('===Event_Wait_Over===0');
                if (player.GetGold() < 0 && !player.m_bDie) {
                    print('===Event_Wait_Over===1');
                    if (this.mDCPlayers.indexOf(player.m_nPlayerID) == -1) {
                        this.StartDC(player.m_nPlayerID);
                        print('===Event_Wait_Over===2');
                    }
                }
                return true;
            });
            return;
        }
        if (this.mDCPlayers.indexOf(player.m_nPlayerID) == -1 && player.GetGold() < 0) this.StartDC(player.m_nPlayerID);
        else {
            this.ProcessDC({
                PlayerID: event.nPlayerID,
                nPlayerID: event.nPlayerID,
                typeOprt: TypeOprt.TO_DeathClearing,
                nRequest: 0,
            });
        }
    }

    /**死亡清算准备 */
    StartDC(playerID: PlayerID) {
        if (this.resumeGameTimer) Timers.RemoveTimer(this.resumeGameTimer);
        if (this.beforeGameState == null) {
            this.beforeGameState = {
                m_typeState: GameRules.GameConfig.m_typeState,
                m_nOrderID: GameRules.GameConfig.m_nOrderID,
                m_timeOprt: GameRules.GameConfig.m_timeOprt,
                m_tabOprtSend: Object.assign(GameRules.GameConfig.m_tabOprtSend),
                m_tabOprtBroadcast: Object.assign(GameRules.GameConfig.m_tabOprtBroadcast),
            };
        }

        this.mDCPlayers.push(playerID);
        print('===DeathClearing===StartDC-Before GameLoop.state:' + GameRules.GameLoop.getGameState());
        GameRules.GameLoop.GameStateService.send('todeathclearing');
        GameRules.GameConfig.setOrder(playerID);
        GameRules.GameConfig.m_timeOprt = math.ceil(TIME_OPERATOR * 1.5);

        // 设置死亡清算状态，暂停其他操作
        GameRules.GameConfig.m_tabOprtCan = GameRules.GameConfig.m_tabOprtCan.filter(v => v.typeOprt != TypeOprt.TO_DeathClearing);
        GameRules.GameConfig.m_tabOprtSend = GameRules.GameConfig.m_tabOprtSend.filter(v => v.typeOprt != TypeOprt.TO_DeathClearing);
        GameRules.GameConfig.m_tabOprtBroadcast = GameRules.GameConfig.m_tabOprtBroadcast.filter(v => v.typeOprt != TypeOprt.TO_DeathClearing);

        const sendAllData = {
            nPlayerID: playerID,
            typeOprt: TypeOprt.TO_DeathClearing,
        };
        GameRules.GameConfig.broadcastOprt(sendAllData);
        print('===DeathClearing===StartDC-broadcastOprt:', sendAllData);
        const player = GameRules.PlayerManager.getPlayer(playerID);
        this.PlayerDC(player, true);
    }

    /**处理死亡清算 */
    ProcessDC(event) {
        print('===ProcessDC: ', event);
        print('===ProcessDC===this.beforeGameState:', this.beforeGameState);
        if (this.beforeGameState == null) return;

        const checkOprt = GameRules.GameConfig.checkOprt(event, true);
        print('===ProcessDC===checkOprt:', checkOprt);
        if (checkOprt != false) {
            const player = GameRules.PlayerManager.getPlayer(event.nPlayerID);
            this.mDCPlayers.splice(this.mDCPlayers.indexOf(player.m_nPlayerID), 1);

            let playerDie = false;
            print('player:GetGold():', player.GetGold());
            if (player.GetGold() < 0) {
                this.PlayerDeath(player);
                playerDie = true;
            }

            if (this.mDCPlayers.length == 0) {
                // 还原之前游戏状态
                GameRules.GameConfig.setOrder(this.beforeGameState.m_nOrderID);
                GameRules.GameConfig.m_timeOprt = (this.beforeGameState.m_timeOprt / 10) * 10 + 1;
                if (playerDie && this.beforeGameState.m_nOrderID == event.nPlayerID) {
                    GameRules.GameLoop.GameStateService.send('tofinished');
                } else {
                    print('===ProcessDC===beforeGameState typeState is ', this.beforeGameState.m_typeState);
                    // TODO:
                    // GameRules.GameLoop.setGameState(this.beforeGameState.m_typeState);
                }
                print('===ProcessDC:m_tabOprtCan.length', GameRules.GameConfig.m_tabOprtCan.length);
                if (GameRules.GameConfig.m_tabOprtCan.length > 0) {
                    // 恢复之前操作
                    print('===ProcessDC resume 恢复之前操作');
                    this.resumeGameTimer = Timers.CreateTimer(() => {
                        print('resume m_tabOprtSend:', this.beforeGameState.m_tabOprtSend);
                        print('resume m_tabOprtBroadcast:', this.beforeGameState.m_tabOprtBroadcast);
                        for (const tabOprt of this.beforeGameState.m_tabOprtBroadcast) {
                            if ((tabOprt.nPlayerID == event.nPlayerID && playerDie == false) || tabOprt.nPlayerID != event.nPlayerID) {
                                print('GMManager.broadcastOprt:', tabOprt);
                                GameRules.GameConfig.broadcastOprt(tabOprt);
                            }
                        }
                        for (const tabOprt of this.beforeGameState.m_tabOprtSend) {
                            if ((tabOprt.nPlayerID == event.nPlayerID && playerDie == false) || tabOprt.nPlayerID != event.nPlayerID) {
                                print('GMManager.sendOprt:', tabOprt);
                                GameRules.GameConfig.sendOprt(tabOprt);
                            }
                        }
                        print('===ProcessDC resume end');
                        this.beforeGameState = null;
                    });
                }
            } else {
                GameRules.GameConfig.setOrder(this.mDCPlayers[0]);
            }
            GameRules.PlayerManager.broadcastMsg('GM_OperatorFinished', {
                nPlayerID: event.nPlayerID,
                typeOprt: TypeOprt.TO_DeathClearing,
            });
            this.PlayerDC(player, false);
        }
    }

    /**设置玩家死亡清算状态 */
    PlayerDC(player: Player, state: boolean) {
        print('===PlayerDC===player.m_bDeathClearing', player.m_bDeathClearing);
        if (player.m_bDeathClearing != state) {
            player.m_bDeathClearing = state;
            player.setNetTableInfo();
        }
    }

    /**设置玩家死亡 */
    PlayerDeath(player: Player) {
        print('===PlayerDeath===', player.m_nPlayerID);
        if (GameRules.GameConfig.m_nOrderFirst == player.m_nPlayerID)
            GameRules.GameConfig.m_nOrderFirst = GameRules.GameConfig.getNextValidOrder(player.m_nPlayerID);
        GameRules.EventManager.FireEvent('Event_PlayerDie', { player: player });
    }
}

import { GameLoop } from "../mode/GameLoop"
import { Constant } from "../mode/constant"
import { GameMessage } from "../mode/gamemessage"
import { Player } from "../player/player"
import { AHMC } from "../utils/amhc"
import { reloadable } from "../utils/tstl-utils"
import { Path } from "./Path"

@reloadable
export class PathDomain extends Path {
    m_tabENPC: CDOTA_BaseNPC[] | any[]			// 路径上的全部NPC实体（城池的兵卒）
    m_eCity: CBaseEntity 			// 建筑点实体
    m_eBanner: CBaseModelEntity           // 横幅旗帜实体
    m_nPrice: number			// 价值
    m_nOwnerID: number			// 领主玩家ID
    m_nPlayerIDGCLD: number		// 正在攻城玩家ID
    m_nPtclIDGCLD: ParticleID		// 攻城特效ID
    private _YieldStateCO: any
    private _tEventIDGCLD: CustomGameEventListenerID[]

    constructor(entity: CBaseEntity) {
        super(entity)

        this.m_eCity = Entities.FindByName(null, "city_" + this.m_nID)
        this.m_eBanner = Entities.FindByName(null, "bann_" + this.m_nID) as CBaseModelEntity
        this.setBanner()

        this.m_nPrice = Constant.PATH_TO_PRICE[this.m_typePath]

        this.m_tabENPC = []

        CustomGameEventManager.RegisterListener("Event_PlayerRoundBefore", (_, event) => this.onEvent_PlayerRoundBefore(event))
        CustomGameEventManager.RegisterListener("Event_FinalBattle", () => this.Event_FinalBattle())
        CustomGameEventManager.RegisterListener("Event_PlayerDie", () => this.Event_PlayerDie())
        CustomGameEventManager.RegisterListener("Event_BZLevel", () => this.Event_BZLevel())
    }

    /** 设置横幅旗帜 */
    setBanner(strHeroName?: string) {
        // strHeroName为空就表示销毁旗帜
        if (strHeroName == null) {
            this.m_eBanner.SetOrigin(this.m_eCity.GetOrigin() - Vector(0, 0, 1000) as Vector)
        } else {
            this.m_eBanner.SetOrigin(this.m_eCity.GetOrigin())
            this.m_eBanner.SetSkin(Constant.HERO_TO_BANNER[strHeroName])
        }
    }

    /** 玩家回合开始：结束攻城 */
    onEvent_PlayerRoundBefore(tabEvent: {
        typeGameState: number;
        PlayerID: PlayerID
    }) {
        if (this.m_nPlayerIDGCLD != GameRules.GameConfig.m_nOrderID
            || GameMessage.GS_Begin != tabEvent.typeGameState) return

        const listenerId = CustomGameEventManager.RegisterListener("Event_PlayerMove", (_, event) => this.onMove(event))
        this.atkCityEnd(false)
        CustomGameEventManager.UnregisterListener(listenerId);
    }

    // 监听玩家移动回路径
    onMove(event: { player: any; PlayerID: PlayerID }) {
        const oPlayer = GameRules.PlayerManager.getPlayer(this.m_nPlayerIDGCLD)
        if (event.player == oPlayer) {
            // 如果要移动,游戏状态改为移动状态
            this._YieldStateCO = GameRules.GameLoop.yieldState()
            GameRules.GameLoop.setState(GameMessage.GS_Move)
            CustomGameEventManager.RegisterListener("Event_PlayerMoveEnd", (event3) => {
                if (event.player == oPlayer) {
                    // 移动结束,游戏状态恢复
                    GameRules.GameLoop.resumeState(this._YieldStateCO);
                    return true
                }
            })
        }
        return true;
    }

    /**玩家攻城结束 */
    atkCityEnd(bWin: boolean, bMoveBack?: boolean) {
        if (bWin == null) bWin = false
        if (bMoveBack == null) bMoveBack = true

        const oPlayerOwn = GameRules.PlayerManager.getPlayer(this.m_nOwnerID)
        const oPlayer = GameRules.PlayerManager.getPlayer(this.m_nPlayerIDGCLD)
        // 销毁特效
        if (this.m_nPtclIDGCLD != null) {
            ParticleManager.DestroyParticle(this.m_nPtclIDGCLD, false)
            this.m_nPtclIDGCLD = null
        }
        StopSoundOn("Hero_LegionCommander.Duel", oPlayer.m_eHero)

        // 解除事件
        for (let value of this._tEventIDGCLD) {
            CustomGameEventManager.UnregisterListener(value)
        }
        this._tEventIDGCLD = null
        if (this.m_tabENPC.length > 0 && AHMC.IsValid(this.m_tabENPC[0])) {
            this.m_tabENPC[0].m_bBattle = null
            this.m_tabENPC[0].m_bGCLD = null
        }
        oPlayerOwn.setBzAttack(this.m_tabENPC[0])
        oPlayerOwn.setBzAtker(this.m_tabENPC[0], oPlayer.m_eHero, true)
        oPlayerOwn.setBzBeAttack(this.m_tabENPC[0], false)

    }

    Event_FinalBattle() {

    }

    Event_PlayerDie() {

    }

    Event_BZLevel() {

    }

    /**设置领主 */
    setOwner(oPlayer: Player, bSetBZ?: boolean) {
        bSetBZ = bSetBZ || true

        let nOwnerIDLast = this.m_nOwnerID
        if (oPlayer == null) {
            this.setState(Constant.TypePathState.None)
            // 移除领主
            this.setBanner()
            this.m_nOwnerID = null
        } else {
            print("=====设置领主======")
            print("oPlayer.m_eHero.GetUnitName()", oPlayer.m_eHero.GetUnitName())
            // 设置新领主
            this.setBanner(oPlayer.m_eHero.GetUnitName())
            this.m_nOwnerID = oPlayer.m_nPlayerID
            // 占领音效
            // StartSoundEvent("Custom.AYZZ", oPlayer.m_eHero)
        }
        if (nOwnerIDLast) {
            this.setBuff(GameRules.PlayerManager.getPlayer(nOwnerIDLast))
        }
        if (bSetBZ) {
            this.setBZ()
        }
        GameRules.EventManager.FireEvent("Event_PathOwnChange", {
            path: this,
            nOwnerIDLast: nOwnerIDLast
        })
    }


    /**设置领地BUFF */
    setBuff(oPlayer: Player) {

    }

    /**设置起兵 */
    setBZ() {
        print("=====设置起兵======")
        if (this.m_nOwnerID == null) {
            print(1)
            // 无领主
            if (this.m_tabENPC.length > 0) {
                print(2)
                // 有兵卒
                this.setAllBZDel()
            }
        } else {
            print(3)
            // 有领主
            const oPlayer = GameRules.PlayerManager.getPlayer(this.m_nOwnerID)
            if (!oPlayer) {
                print(4)
                return
            }
            if (Constant.GAME_MODE == Constant.GAME_MODE_ONEPATH) {
                print(5)
                // 单地起兵模式
                if (GameRules.GameConfig.m_nRound >= Constant.BZ_OUT_ROUND) {
                    if (this.m_tabENPC.length > 0) {
                        if (oPlayer.m_nPlayerID != this.m_tabENPC[0].GetPlayerOwnerID()) {
                            this.setAllBZDel()
                            oPlayer.createBZOnPath(this, 1)
                        }
                    } else {
                        oPlayer.createBZOnPath(this, 1)
                    }
                }
            }

        }
    }

    /**移除全部兵卒 */
    setAllBZDel() {
        for (let i = 0; i < this.m_tabENPC.length; i++) {
            if (this.m_tabENPC[i] && !this.m_tabENPC[i].IsNull()) {
                const player = GameRules.PlayerManager.getPlayer(this.m_tabENPC[i].GetPlayerOwnerID())
                if (player) {
                    player.removeBz(this.m_tabENPC[i])
                }
            } else {
                delete this.m_tabENPC[i]
            }

        }
    }

}
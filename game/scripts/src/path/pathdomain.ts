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

        GameRules.EventManager.Register("Event_PlayerRoundBefore", (_, event) => this.onEvent_PlayerRoundBefore(event), this, -987654321)
        GameRules.EventManager.Register("Event_FinalBattle", () => this.Event_FinalBattle())
        GameRules.EventManager.Register("Event_PlayerDie", () => this.Event_PlayerDie(), this, 10000)
        GameRules.EventManager.Register("Event_BZLevel", () => this.Event_BZLevel())
    }

    /**触发路径 */
    onPath(player: Player): void {
        super.onPath(player)

        if (this.m_nOwnerID == null) {
            // 无主之地,发送安营扎寨操作
            const tabOprt = {
                nPlayerID: player.m_nPlayerID,
                typeOprt: GameMessage.TypeOprt.TO_AYZZ,
                typePath: this.m_typePath,
                nPathID: this.m_nID
            }
            // 操作前处理上一个(如果有的话)
            GameRules.GameConfig.autoOprt(tabOprt.typeOprt, player)
            GameRules.GameConfig.sendOprt(tabOprt)
            print("======发送安营扎寨操作======")
        } else if (this.m_nOwnerID != player.m_nPlayerID) {
            // 非己方城池
            const playerOwn = GameRules.PlayerManager.getPlayer(this.m_nOwnerID)
            // 领主未进监狱
            if (0 === (GameMessage.PS_InPrison & playerOwn.m_nPlayerState)) {
                if (this.m_tabENPC.length == 0) {
                    // 交过路费
                    const nGold = math.floor(this.m_nPrice * Constant.PATH_TOLL_RATE)
                    player.giveGold(nGold, playerOwn)
                    GameRules.GameConfig.showGold(playerOwn, nGold)
                    GameRules.GameConfig.showGold(player, -nGold)
                    // TODO:给钱音效
                    // EmitGlobalSound()
                } else {
                    // 有兵卒的城池,发送攻城略地操作
                    if (this.m_tabENPC[0].IsInvisible()
                        || this.m_tabENPC[0].IsStunned()) {
                        // 兵卒隐身,眩晕无法攻城
                        return
                    }
                    const tabEvent = {
                        entity: player.m_eHero,
                        path: this,
                        bIgnore: false
                    }
                    GameRules.EventManager.FireEvent("Event_GCLDReady", tabEvent)
                    if (tabEvent.bIgnore) return
                    const tabOprt = {
                        nPlayerID: player.m_nPlayerID,
                        typeOprt: GameMessage.TypeOprt.TO_GCLD,
                        typePath: this.m_typePath,
                        nPathID: this.m_nID
                    }
                    // 操作前处理上一个(如果有的话)
                    GameRules.GameConfig.autoOprt(tabOprt.typeOprt, player)
                    GameRules.GameConfig.sendOprt(tabOprt)
                    GameRules.EventManager.Register("Event_CurPathChange", (event) => {
                        if (event.player == player && this != player.m_pathCur) {
                            GameRules.GameConfig.autoOprt(GameMessage.TypeOprt.TO_GCLD, player)
                        }
                    })
                }
            }
        }
    }

    /** 设置横幅旗帜 */
    setBanner(strHeroName?: string) {
        // strHeroName为空就表示隐藏旗帜
        if (strHeroName == null) {
            this.m_eBanner.SetOrigin(this.m_eCity.GetOrigin() - Vector(0, 0, 1000) as Vector)
        } else {
            this.m_eBanner.SetOrigin(this.m_eCity.GetOrigin())
            print("SetSkin====strHeroName:", strHeroName)
            this.m_eBanner.SetSkin(Constant.HERO_TO_BANNER[strHeroName] + 1)
        }
    }

    /** 玩家回合开始：结束攻城 */
    onEvent_PlayerRoundBefore(tabEvent: {
        typeGameState: number;
        PlayerID: PlayerID
    }) {
        if (this.m_nPlayerIDGCLD != GameRules.GameConfig.m_nOrderID
            || GameMessage.GS_Begin != tabEvent.typeGameState) return

        const oPlayer = GameRules.PlayerManager.getPlayer(this.m_nPlayerIDGCLD)

        // 监听玩家移动回路径
        function onMove(tabEvent2) {
            if (tabEvent2.player == oPlayer) {
                // 如果要移动,游戏状态改为移动状态
                // GameRules.GameLoop.GameStateService.send("tomove")
                GameRules.EventManager.Register("Event_PlayerMoveEnd", (event3) => {
                    if (tabEvent2.player == oPlayer) {
                        // TODO:玩家移动结束，游戏状态恢复
                        //(攻城/打野可以持续到新的一回合开始)
                        // GameRules.GameLoop.GameStateService.send("tobegin")
                        return true
                    }
                })
            }
            return true
        }

        GameRules.EventManager.Register("Event_PlayerMove", onMove)
        this.atkCityEnd(false)
        GameRules.EventManager.UnRegister("Event_PlayerMove", onMove)
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
            this.setPathState(Constant.TypePathState.None)
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
            print("setBZ===1")
            // 无领主
            if (this.m_tabENPC.length > 0) {
                print("setBZ===2")
                // 有兵卒
                this.setAllBZDel()
            }
        } else {
            print("setBZ===3")
            // 有领主
            const oPlayer = GameRules.PlayerManager.getPlayer(this.m_nOwnerID)
            if (!oPlayer) {
                print("setBZ===4")
                return
            }
            if (Constant.GAME_MODE == Constant.GAME_MODE_ONEPATH) {
                print("setBZ===5")
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
                    this.setBanner()
                    this.setBuff(oPlayer)
                } else {
                    // 监听起兵回合
                    GameRules.EventManager.Register("Event_UpdateRound", () => {
                        if (GameRules.GameConfig.m_nRound >= Constant.BZ_OUT_ROUND) {
                            if (!GameRules.GameConfig.m_bOutBZ) {
                                GameRules.GameConfig.m_bOutBZ = true
                                print("======起兵=======")
                                EmitGlobalSound("Custom.AYZZ.All")
                            }
                            if (this.m_nOwnerID == oPlayer.m_nPlayerID && !this.m_tabENPC[0]) {
                                oPlayer.createBZOnPath(this, 1)
                                this.setBanner()
                                this.setBuff(oPlayer)
                            }
                            return true
                        }
                    })
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
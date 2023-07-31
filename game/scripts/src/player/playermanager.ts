import { GameMessage } from "../mode/gamemessage"
import { Player } from "./player"

export class PlayerManager {
    m_bAllPlayerInit: boolean
    m_tabPlayers: Player[]
    nInit: number // 初始化人数
    m_typeState = GameMessage.GS_None //游戏状态
    m_nGameID = -1 // 比赛编号
    m_nOrderID = -1 // 当前操作玩家ID
    m_nOrderFirst = -1 // 首操作玩家ID
    m_nOrderIndex = -1
    m_nOrderFirstIndex = 1 // 首操作index
    m_timeOprt = -1 // 回合剩余时限
    m_nRound = 0 // 当前回合数
    m_nBaoZi = 0 // 当前玩家豹子次数
    m_bFinalBattle = false // 终局决战
    m_tabOprtCan = [] // 当前全部可操作
    m_tabOprtSend = [] // 当前全部可操作
    m_tabOprtBroadcast = [] // 当前全部可操作
    m_tabEnd = [] // 结算数据
    m_bNoSwap: 1 | 0
    m_tabChangeGold: number[]
    m_nTimeChangeGold: number
    m_typeStateCur: number = GameMessage.GS_None

    constructor() {
        this.m_bAllPlayerInit = false, // 全部玩家初始化完成
            this.m_tabPlayers = [] // 全部玩家数据
    }

    init() {
        if (IsServer()) {
            // 玩家断线
            // ListenToGameEvent("player_disconnect", (event) => this.onEvent_playerDisconnect(event), this)
        }
        // 玩家连接
        ListenToGameEvent("player_connect_full", (event) => this.onEvent_playerConnectFull(event), this)
        // 选择英雄
        ListenToGameEvent("dota_player_pick_hero", (event) => this.onEvent_playerPickHero(event), this)
        // 玩家英雄的生成
        ListenToGameEvent("npc_spawned", (event) => this.onEvent_NPCSpawned(event), this)
        // 单位受伤
        ListenToGameEvent("entity_hurt", (event) => this.onEvent_entityHurt(event), this)
        // 玩家使用技能
        ListenToGameEvent("dota_player_used_ability", (event) => this.onEvent_dota_player_used_ability(event), this)
        // 玩家聊天
        ListenToGameEvent("player_chat", (event) => this.onEvent_player_chat(event), this)
    }
    // 玩家断线
    onEvent_playerDisconnect(event: GameEventProvidedProperties & PlayerDisconnectEvent) {
        print("onEvent_playerDisconnect")
        DeepPrintTable(event)
        if (event.PlayerID < 0) {
            return
        }
        let player = GameRules.PlayerManager.getPlayer(event.PlayerID)
        if (player == null) {
            player = new Player(event.PlayerID)
            player.m_oCDataPlayer = PlayerResource.GetPlayer(event.PlayerID)
        }
        // 掉线随机英雄
        if (PlayerResource.GetSelectedHeroID(event.PlayerID) == -1 &&
            player.m_oCDataPlayer != null &&
            GameRules.State_Get() == GameState.HERO_SELECTION) {
            print("PlayerID:", event.PlayerID, "MakeRandomHeroSelection")
            GameRules.HeroSelection.SelectHero(event.PlayerID)
        }

        player.setDisconnect(true)
    }

    // 玩家连接
    onEvent_playerConnectFull(event: GameEventProvidedProperties & PlayerConnectFullEvent) {
        print("onEvent_playerConnectFull")
        DeepPrintTable(event)
        if (event.userid < 0) return
        let oPlayer = GameRules.PlayerManager.getPlayer(event.PlayerID)
        if (oPlayer == null) {
            oPlayer = new Player(event.PlayerID)
            this.m_tabPlayers[event.PlayerID] = oPlayer
            oPlayer.m_oCDataPlayer = PlayerResource.GetPlayer(oPlayer.m_nPlayerID)
        } else {
            oPlayer.m_oCDataPlayer = PlayerResource.GetPlayer(oPlayer.m_nPlayerID)
            // 断线重连
            oPlayer.setDisconnect(false)
            // 重新发送手牌
            oPlayer.sendHandCardData()
            // 重新发操作
            for (let i = 0; i < this.m_tabOprtCan.length; i++) {
                const tabOprt = this.m_tabOprtCan[i]
                if (tabOprt.nPlayerID == event.PlayerID) {
                    print("9[LUA]:ReconnectSend===========>>>>>>>>>>>>>>>")
                    DeepPrintTable(tabOprt)
                    CustomGameEventManager.Send_ServerToPlayer(oPlayer.m_oCDataPlayer, "GM_Operator", tabOprt)
                }

            }
        }
        oPlayer.m_nUserID = event.userid

    }

    // 选择英雄
    onEvent_playerPickHero(event: GameEventProvidedProperties & DotaPlayerPickHeroEvent): void {
        if (this.m_typeState == GameMessage.PS_None) {
            print("onEvent_playerPickHero")
            DeepPrintTable(event)
            const eHero = EntIndexToHScript(event.heroindex as EntityIndex) as CDOTA_BaseNPC_Hero
            const oPlayer = this.m_tabPlayers[eHero.GetPlayerOwnerID()]
            GameRules.HeroSelection.m_SelectHeroPlayerID.push(eHero.GetPlayerOwnerID())
            if (GameRules.State_Get() != GameState.HERO_SELECTION) {
                GameRules.HeroSelection.GiveAllPlayersSort()
            }
            if (oPlayer != null && !oPlayer.__init) {
                oPlayer.m_eHero = eHero
                oPlayer.initPlayer()
                if (this.nInit == null) this.nInit = 0
                this.nInit++
                if (this.nInit == this.getPlayerCount()) {
                    this.nInit == null
                    Timers.CreateTimer(1, () => {
                        this.m_bAllPlayerInit = true
                    })
                }
            }
        }
    }

    // 玩家英雄的生成
    onEvent_NPCSpawned(event: GameEventProvidedProperties & NpcSpawnedEvent): void {
    }

    // 单位受伤
    onEvent_entityHurt(event: GameEventProvidedProperties & EntityHurtEvent): void {
    }

    // 玩家使用技能
    onEvent_dota_player_used_ability(event: GameEventProvidedProperties & DotaPlayerUsedAbilityEvent): void {
        print("onEvent_dota_player_used_ability")
        DeepPrintTable(event)
        CustomGameEventManager.Send_ServerToPlayer(PlayerResource.GetPlayer(event.PlayerID), "dota_player_used_ability", event)
    }

    // 玩家聊天
    onEvent_player_chat(event: GameEventProvidedProperties & PlayerChatEvent): void {
    }

    /**
     * getPlayer
    nPlayerID:numbber     */
    getPlayer(nPlayerID: number) {
        return this.m_tabPlayers[nPlayerID]
    }

    getPlayerCount() {
        return this.m_tabPlayers.length
    }

    /**广播事件消息 */
    broadcastMsg(strMgsID: string, tabData) {
        // CustomGameEventManager.Send_ServerToAllClients(strMgsID, tabData)
    }

    /**获取存活玩家数量 */
    getAlivePlayerCount() {
        let nCount = 0
        for (const player of this.m_tabPlayers) {
            if (this.isAlivePlayer(player.m_nPlayerID)) {
                nCount++
            }
        }
        return nCount
    }

    /**玩家是否存活 */
    isAlivePlayer(nPlayerID: number) {
        const player = this.getPlayer(nPlayerID)
        return player && !player.m_bDie
    }
}


import { GameMessage } from "../mode/gamemessage";
import { Player } from "../player/player";
import { Path } from "./Path";

export class PathMonster extends Path {
    m_eCity: CBaseEntity = null				    // 建筑点实体

    m_tabEHero = null				// 野区打野英雄实体
    m_tabEMonster: [] = null		    // 野区生物实体
    m_tabMonsterInfo = null	    // 可刷新的野怪信息
    m_tabAtker = null              // 野怪可攻击的单位
    m_tabTrophy = null             // 打野英雄获取的战利品统计<etab>

    m_typeMonsterCur = null        // 当前野怪类型
    m_typeMonsterLast = null       // 上次野怪类型

    constructor(entity: CBaseEntity) {
        super(entity)
        this.m_eCity = Entities.FindByName(null, "city_" + this.m_nID)
        // if (this.m_eCity) {
        //     this.m_eCity.SetForwardVector(Vector(0, 0, 0) - this.m_eCity.GetAbsOrigin() as Vector)
        //     // 路径视野
        //     AddFOWViewer(DotaTeam.GOODGUYS, this.m_eCity.GetAbsOrigin(), 500, -1, true)
        // }
        this.m_tabEHero = []
        this.m_tabEMonster = []
        this.m_tabAtker = []
        this.m_tabTrophy = []

        this.m_tabMonsterInfo = []
        // TODO:处理野怪类型,给m_tabMonsterInfo赋值
        switch (this.m_typePath) {
            case GameMessage.TP_MONSTER_1:

                break;
            case GameMessage.TP_MONSTER_2:

                break;
            case GameMessage.TP_MONSTER_3:

                break;
            default:
                break;
        }
        this.registerEvent()
    }

    // 触发路径
    onPath(oPlayer: Player) {
        super.onPath(oPlayer)

        if (this.m_tabEMonster.length == 0) return

        // 操作前处理上一个(如果有的话)
        GameRules.GameConfig.autoOprt(GameMessage.TypeOprt.TO_AtkMonster, oPlayer)
        GameRules.GameConfig.sendOprt({
            nPlayerID: oPlayer.m_nPlayerID,
            typeOprt: GameMessage.TypeOprt.TO_AtkMonster,
            typePath: this.m_typePath,
            nPathID: this.m_nID
        })
        GameRules.EventManager.Register("Event_CurPathChange", (event) => {
            if (event.player == oPlayer && this != oPlayer.m_pathCur) {
                GameRules.GameConfig.autoOprt(GameMessage.TypeOprt.TO_AtkMonster, oPlayer)
            }
        })
    }

    //事件回调-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    /**注册事件 */
    registerEvent() {
        ListenToGameEvent("entity_killed", (event) => this.onEvent_entityKilled(event), this)
        GameRules.EventManager.Register("Event_PlayerRoundBefore", () => this.onEvent_PlayerRoundBefore(), this, -987654321)
        GameRules.EventManager.Register("Event_PlayerDie", () => this.onEvent_PlayerDie(), this)
        GameRules.EventManager.Register("Event_Atk", () => this.Event_Atk(), this)

        if (this.m_typePath == GameMessage.TP_MONSTER_2
            || this.m_typePath == GameMessage.TP_MONSTER_3) {
            GameRules.EventManager.Register("Event_UpdateRound", () => {
                if(GameRules.GameConfig.m_nRound == 5 *(this.m_typePath - GameMessage.TP_MONSTER_2 + 1)){
                    this.spawnMonster()
                    return true
                }
            }, this)
        }else{
            GameRules.EventManager.Register("Event_GameStart",()=>{
                this.spawnMonster()
                return true
            })
        }
    }

    onEvent_entityKilled(event: GameEventProvidedProperties & EntityKilledEvent) {
        this.m_tabEMonster = []
        this.m_tabMonsterInfo = []

    }

    onEvent_PlayerRoundBefore() {

    }

    onEvent_PlayerDie() {

    }

    Event_Atk() {

    }

    /**刷新野怪 */
    spawnMonster(){
        
    }
}
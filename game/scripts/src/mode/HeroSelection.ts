import { Constant } from "./constant"

export class HeroSelection {

    m_timeLast = Constant.TIME_SELECTHERO
    m_allHeroName = {}
    m_AllHeroAbility = {}
    m_allSoldierAbility = {}
    m_RandomHeroPlayerID: PlayerID[] = []
    m_SelectHeroPlayerID: PlayerID[] = []
    m_PlayersSort: PlayerID[] = []

    init() {
        print("PlayerManager.m_tabPlayers:")
        DeepPrintTable(GameRules.PlayerManager.m_tabPlayers)
    }

    /** 自动选择英雄(自动随机英雄) */
    autoSelectHero() {
        for (const oPlayer of GameRules.PlayerManager.m_tabPlayers) {
            if (PlayerResource.GetSelectedHeroID(oPlayer.m_nPlayerID) == -1) {
                PlayerResource.GetPlayer(oPlayer.m_nPlayerID).MakeRandomHeroSelection()
            } else {
                this.m_SelectHeroPlayerID.push(oPlayer.m_nPlayerID)
            }
        }
    }

    UpdateTime() {
        Timers.CreateTimer(() => {
            if (GameRules.State_Get() == GameState.HERO_SELECTION) {
                if (this.m_timeLast == 0) {
                    this.autoSelectHero()
                    return
                }
                this.m_timeLast--
                return 1
            }
        })
    }

    /** 随机回合顺序 */
    GiveAllPlayersSort() {
        this.m_PlayersSort = this.m_SelectHeroPlayerID.concat(this.m_RandomHeroPlayerID)
        for (let index = this.m_PlayersSort.length - 1; index > 0; index--) {
            const idx = RandomInt(0, index)
            const temp = this.m_PlayersSort[idx]
            this.m_PlayersSort[idx] = this.m_PlayersSort[index]
            this.m_PlayersSort[index] = temp
        }
        for (const oPlayer of GameRules.PlayerManager.m_tabPlayers) {
            oPlayer.m_nOprtOrder = this.GetPlayerIDIndex(oPlayer.m_nPlayerID)
        }
        print("[PlayersSort]:")
        DeepPrintTable(this.m_PlayersSort)
    }

    /** 获得(this.m_PlayersSort)玩家ID对应的index */
    GetPlayerIDIndex(nPlayerID: number): number {
        for (let index = 0; index < this.m_PlayersSort.length; index++) {
            if (this.m_PlayersSort[index] == nPlayerID)
                return index
        }
    }
}
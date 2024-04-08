import { TIME_SELECTHERO } from '../constants/constant';
import { TP_START } from '../constants/gamemessage';
import { KeyValues } from '../kv';
import { getRandomsInRange } from '../utils/amhc';

export class HeroSelection {
    m_timeLast = TIME_SELECTHERO;
    m_allHeroName = {};
    m_AllHeroAbility = {};
    m_allSoldierAbility = {};
    m_RandomHeroPlayerID: PlayerID[] = [];
    m_SelectHeroPlayerID: PlayerID[] = [];
    m_PlayersSort: PlayerID[] = [];
    hostID: PlayerID;
    botSetNum: number = 0;
    m_tBots: CDOTA_BaseNPC_Hero[] = [];

    init() {
        print('[HeroSelection] init...');

        CustomGameEventManager.RegisterListener('C2S_Bot_Setting', (_, event) => {
            this.botSetNum = event.setNum;
        });
    }

    /** 自动选择英雄(自动随机英雄) */
    autoSelectHero() {
        for (const oPlayer of GameRules.PlayerManager.m_tabPlayers) {
            if (PlayerResource.GetSelectedHeroID(oPlayer.m_nPlayerID) == -1) {
                PlayerResource.GetPlayer(oPlayer.m_nPlayerID).MakeRandomHeroSelection();
            } else {
                this.m_SelectHeroPlayerID.push(oPlayer.m_nPlayerID);
            }
        }
    }

    UpdateTime() {
        Timers.CreateTimer(() => {
            if (GameRules.State_Get() == GameState.HERO_SELECTION) {
                if (this.m_timeLast == 0) {
                    this.autoSelectHero();
                    return;
                }
                this.m_timeLast--;
                return 1;
            }
        });
    }

    /** 随机回合顺序 */
    GiveAllPlayersSort() {
        if (GameRules.State_Get() != GameState.GAME_IN_PROGRESS) this.m_PlayersSort = this.m_SelectHeroPlayerID.concat(this.m_RandomHeroPlayerID);
        for (let index = this.m_PlayersSort.length - 1; index > 0; index--) {
            const idx = RandomInt(0, index);
            const temp = this.m_PlayersSort[idx];
            this.m_PlayersSort[idx] = this.m_PlayersSort[index];
            this.m_PlayersSort[index] = temp;
        }
        for (const oPlayer of GameRules.PlayerManager.m_tabPlayers) {
            oPlayer.m_nOprtOrder = this.GetPlayerIDIndex(oPlayer.m_nPlayerID);
        }
        // TODO: TEST
        // this.m_PlayersSort = [1, 0];
        print('[PlayersSort]:');
        DeepPrintTable(this.m_PlayersSort);
        CustomNetTables.SetTableValue('HeroSelection', 'PlayersSort', this.m_PlayersSort);
    }
    /** 获得(this.m_PlayersSort)玩家ID对应的index */
    GetPlayerIDIndex(nPlayerID: number): number {
        for (let index = 0; index < this.m_PlayersSort.length; index++) {
            if (this.m_PlayersSort[index] == nPlayerID) return index;
        }
    }

    /**更新房主id至网表 */
    UpdateHost() {
        for (const player of GameRules.PlayerManager.m_tabPlayers) {
            if (GameRules.PlayerHasCustomGameHostPrivileges(PlayerResource.GetPlayer(player.m_nPlayerID))) {
                this.hostID = player.m_nPlayerID;
                CustomNetTables.SetTableValue('HostPlayer', 'hostPlayer', { hostID: this.hostID });
                return;
            }
        }
    }

    /**创建机器人玩家 */
    spawnBots() {
        if (this.botSetNum == 0) return;

        let botHeroes = this.getUnselectedHeroes();
        const randoms = getRandomsInRange(0, botHeroes.length - 1, this.botSetNum);

        for (let i = 0; i < this.botSetNum; i++) {
            const heroname = botHeroes[randoms[i]];
            const eBot = GameRules.AddBotPlayerWithEntityScript(heroname, heroname.split('npc_dota_hero_')[1], DotaTeam.GOODGUYS, null, true);
            this.m_tBots.push(eBot);
            FindClearSpaceForUnit(eBot, GameRules.PathManager.getPathByType(TP_START)[0].getNilPos(eBot), true);
        }
    }

    /**获取未选择的英雄 */
    getUnselectedHeroes() {
        let result: string[] = [];
        for (const heroname in KeyValues.HeroKV) {
            let bSelect = false;
            for (const player of GameRules.PlayerManager.m_tabPlayers) {
                if (PlayerResource.GetSelectedHeroName(player.m_nPlayerID) == heroname) {
                    bSelect = true;
                    break;
                }
            }
            if (!bSelect) result.push(heroname);
        }
        return result;
    }
}

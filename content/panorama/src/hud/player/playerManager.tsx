import { useNetTableKey } from 'react-panorama-x';
import { player_info } from '../mode/constant';

export class PlayerManager {
    /**其他玩家ID[] */
    otherPlayers: PlayerID[] = this.getOtherPlayerIDs();
    /**sortPlayers */
    sortPlayers: PlayerID[] = this.getSortedPlayers();

    constructor() {
        console.log('===PlayerManager===init', Players.GetLocalPlayer(), Players.GetPlayerSelectedHero(Players.GetLocalPlayer()));
    }

    getOtherPlayerIDs(): PlayerID[] {
        const ids: PlayerID[] = Object.values(CustomNetTables.GetTableValue('GamingTable', 'all_playerids') ?? {});
        console.log('===PlayerManager===getOtherPlayerIDs', ids);
        const heroID = Players.GetLocalPlayer();
        return ids.filter(id => id != heroID);
    }

    getSortedPlayers(): PlayerID[] {
        const players = CustomNetTables.GetTableValue('HeroSelection', 'PlayersSort');
        if (players == undefined) {
            setTimeout(() => {
                return this.getSortedPlayers();
            }, 100);
        }
        const ids: PlayerID[] = Object.values(players ?? []);
        return ids;
    }

    getPlayerSumGold(playerID: PlayerID): number {
        const keyname = ('player_info_' + playerID) as player_info;
        return useNetTableKey('GamingTable', keyname)?.nSumGold ?? 0;
    }

    getPlayerGold(playerID: PlayerID): number {
        const keyname = ('player_info_' + playerID) as player_info;
        return useNetTableKey('GamingTable', keyname)?.nGold ?? 0;
    }
}

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
}

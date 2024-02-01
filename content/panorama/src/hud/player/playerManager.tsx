export class PlayerManager {
    /**当前玩家ID */
    playerID: PlayerID = Players.GetLocalPlayer();
    /**其他玩家ID[] */
    otherPlayers: PlayerID[] = this.getOtherPlayerIDs();
    /**sortPlayers */
    sortPlayers: PlayerID[] = this.getSortedPlayers();

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

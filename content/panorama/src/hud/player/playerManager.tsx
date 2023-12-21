export class PlayerManager {
    /**当前玩家ID */
    playerID: PlayerID = Players.GetLocalPlayer();
    /**其他玩家ID[] */
    otherPlayers: PlayerID[] = this.getOtherPlayerIDs();

    getOtherPlayerIDs(): PlayerID[] {
        const ids: PlayerID[] = Object.values(CustomNetTables.GetTableValue('GamingTable', 'all_playerids') ?? {});
        console.log('===PlayerManager===getOtherPlayerIDs', ids);
        const heroID = Players.GetLocalPlayer();
        return ids.filter(id => id != heroID);
    }
}

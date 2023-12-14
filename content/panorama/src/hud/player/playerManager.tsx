import { useNetTableKey } from 'react-panorama-x';

export class PlayerManager {
    static getOtherPlayerIDs(): PlayerID[] {
        const ids: PlayerID[] = Object.values(useNetTableKey('GamingTable', 'all_playerids')) ?? [];
        console.log('===PlayerManager===getOtherPlayerIDs',ids);
        const heroID = Players.GetLocalPlayer();
        return ids.filter(id => id != heroID);
    }
}

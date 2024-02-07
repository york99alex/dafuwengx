import { useNetTableKey } from 'react-panorama-x';
import { player_info } from '../mode/constant';

export class Player {
    static getPlayerSteamID(playerID: PlayerID): number {
        const keyname = ('player_info_' + playerID) as player_info;
        // =w=
        return CustomNetTables.GetTableValue('GamingTable', keyname)?.nSteamID32 ?? 0;
    }

    static getPlayerPath(playerID: PlayerID): number[] {
        const keyname = ('player_info_' + playerID) as player_info;
        return Object.values(useNetTableKey('GamingTable', keyname)?.tabPath ?? {});
    }
}

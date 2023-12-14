import { useNetTableKey } from 'react-panorama-x';
import { player_info } from '../mode/constant';

export class Player {
    static getPlayerInfo(playerID: PlayerID) {}

    static getPlayerPath(playerID: PlayerID): number[] {
        const keyname = ('player_info_' + Players.GetLocalPlayer()) as player_info;
        return Object.values(useNetTableKey('GamingTable', keyname)!.tabPath) ?? [];
    }
}

declare interface CustomNetTableDeclarations {
    game_timer: {
        game_timer: {
            current_time: number;
            current_state: 1 | 2 | 3 | 4 | 5;
            current_round: number;
        };
    };
    hero_list: {
        hero_list: Record<string, string> | string[];
    };
    custom_net_table_1: {
        key_1: number;
        key_2: string;
    };
    custom_net_table_3: {
        key_1: number;
        key_2: string;
    };
    GamingTable: {
        game_mode: {
            typeGameMode: number
            bNoSwap: 1 | 0
        }
        all_playerids: any
        player_info_0: {
            bDisconnect: 1 | 0
            nGold: number
            nSumGold: number
            bRoundFinished: 1 | 0
            nPathCurID: number
            nSteamID64: number
            nSteamID32: any
            tabPathHasBZ
            tabPath: any
            nCard: number
            nCDSub: number
            nManaSub: number
            nKill: number
            nGCLD: number
            nBuyItem: number
            typeBuyState: number
            bDeathClearing: 1 | 0
            nOprtOrder: number
            tMuteTradePlayers
            typeTeam: number
        }
        player_info_1: {
            bDisconnect: 1 | 0
            nGold: number
            nSumGold: number
            bRoundFinished: 1 | 0
            nPathCurID: number
            nSteamID64: number
            nSteamID32: any
            tabPathHasBZ
            tabPath: any
            nCard: number
            nCDSub: number
            nManaSub: number
            nKill: number
            nGCLD: number
            nBuyItem: number
            typeBuyState: number
            bDeathClearing: 1 | 0
            nOprtOrder: number
            tMuteTradePlayers
            typeTeam: number
        }
        player_info_2: {
            bDisconnect: 1 | 0
            nGold: number
            nSumGold: number
            bRoundFinished: 1 | 0
            nPathCurID: number
            nSteamID64: number
            nSteamID32: any
            tabPathHasBZ
            tabPath: any
            nCard: number
            nCDSub: number
            nManaSub: number
            nKill: number
            nGCLD: number
            nBuyItem: number
            typeBuyState: number
            bDeathClearing: 1 | 0
            nOprtOrder: number
            tMuteTradePlayers
            typeTeam: number
        }
        player_info_3: {
            bDisconnect: 1 | 0
            nGold: number
            nSumGold: number
            bRoundFinished: 1 | 0
            nPathCurID: number
            nSteamID64: number
            nSteamID32: any
            tabPathHasBZ
            tabPath: any
            nCard: number
            nCDSub: number
            nManaSub: number
            nKill: number
            nGCLD: number
            nBuyItem: number
            typeBuyState: number
            bDeathClearing: 1 | 0
            nOprtOrder: number
            tMuteTradePlayers
            typeTeam: number
        }
        player_info_4: {
            bDisconnect: 1 | 0
            nGold: number
            nSumGold: number
            bRoundFinished: 1 | 0
            nPathCurID: number
            nSteamID64: number
            nSteamID32: any
            tabPathHasBZ
            tabPath: any
            nCard: number
            nCDSub: number
            nManaSub: number
            nKill: number
            nGCLD: number
            nBuyItem: number
            typeBuyState: number
            bDeathClearing: 1 | 0
            nOprtOrder: number
            tMuteTradePlayers
            typeTeam: number
        }
        player_info_5: {
            bDisconnect: 1 | 0
            nGold: number
            nSumGold: number
            bRoundFinished: 1 | 0
            nPathCurID: number
            nSteamID64: number
            nSteamID32: any
            tabPathHasBZ
            tabPath: any
            nCard: number
            nCDSub: number
            nManaSub: number
            nKill: number
            nGCLD: number
            nBuyItem: number
            typeBuyState: number
            bDeathClearing: 1 | 0
            nOprtOrder: number
            tMuteTradePlayers
            typeTeam: number
        }
        path_info: {
            vPos:{
                x:number
                y:number
                z:number
            }
        }[]
    }

}

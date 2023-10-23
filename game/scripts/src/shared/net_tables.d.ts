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
        timeOprt: { time: number }
        order: { nPlayerID: number }
        round: { nRound: number }
        state: { typeState: number }
        change_gold: any
        all_playerids: any
        player_info_0: {
            bDisconnect: 1 | 0
            nGold: number
            nSumGold: number
            bRoundFinished: 1 | 0
            nPathCurID: number
            nSteamID64: number
            nSteamID32: any
            tabPathHasBZ: any
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
            tMuteTradePlayers: any
            typeTeam: number
            bDie?: 1 | 0
        }
        player_info_1: {
            bDisconnect: 1 | 0
            nGold: number
            nSumGold: number
            bRoundFinished: 1 | 0
            nPathCurID: number
            nSteamID64: number
            nSteamID32: any
            tabPathHasBZ: any
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
            tMuteTradePlayers: any
            typeTeam: number
            bDie?: 1 | 0
        }
        player_info_2: {
            bDisconnect: 1 | 0
            nGold: number
            nSumGold: number
            bRoundFinished: 1 | 0
            nPathCurID: number
            nSteamID64: number
            nSteamID32: any
            tabPathHasBZ: any
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
            tMuteTradePlayers: any
            typeTeam: number
            bDie?: 1 | 0
        }
        player_info_3: {
            bDisconnect: 1 | 0
            nGold: number
            nSumGold: number
            bRoundFinished: 1 | 0
            nPathCurID: number
            nSteamID64: number
            nSteamID32: any
            tabPathHasBZ: any
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
            tMuteTradePlayers: any
            typeTeam: number
            bDie?: 1 | 0
        }
        player_info_4: {
            bDisconnect: 1 | 0
            nGold: number
            nSumGold: number
            bRoundFinished: 1 | 0
            nPathCurID: number
            nSteamID64: number
            nSteamID32: any
            tabPathHasBZ: any
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
            tMuteTradePlayers: any
            typeTeam: number
            bDie?: 1 | 0
        }
        player_info_5: {
            bDisconnect: 1 | 0
            nGold: number
            nSumGold: number
            bRoundFinished: 1 | 0
            nPathCurID: number
            nSteamID64: number
            nSteamID32: any
            tabPathHasBZ: any
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
            tMuteTradePlayers: any
            typeTeam: number
            bDie?: 1 | 0
        }
        path_info: {
            vPos: {
                x: number
                y: number
                z: number
            }
        }[]
        game_record: any
    }

    EndTable: {
        player_info_0: {
            nDamageBZ: number,
            nDamageHero: number,
            nGCLD: number,
            nGoldMax: number,
            nKill: number,
            nRank: number,
            nReward: 0,
        }
        player_info_1: {
            nDamageBZ: number,
            nDamageHero: number,
            nGCLD: number,
            nGoldMax: number,
            nKill: number,
            nRank: number,
            nReward: 0,
        }
        player_info_2: {
            nDamageBZ: number,
            nDamageHero: number,
            nGCLD: number,
            nGoldMax: number,
            nKill: number,
            nRank: number,
            nReward: 0,
        }
        player_info_3: {
            nDamageBZ: number,
            nDamageHero: number,
            nGCLD: number,
            nGoldMax: number,
            nKill: number,
            nRank: number,
            nReward: 0,
        }
        player_info_4: {
            nDamageBZ: number,
            nDamageHero: number,
            nGCLD: number,
            nGoldMax: number,
            nKill: number,
            nRank: number,
            nReward: 0,
        }
        player_info_5: {
            nDamageBZ: number,
            nDamageHero: number,
            nGCLD: number,
            nGoldMax: number,
            nKill: number,
            nRank: number,
            nReward: 0,
        }
    }
}

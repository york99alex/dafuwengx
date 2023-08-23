/**
 * This file contains types for the events you want to send between the UI (Panorama)
 * and the server (VScripts).
 * 
 * IMPORTANT: 
 * 
 * The dota engine will change the type of event data slightly when it is sent, so on the
 * Panorama side your event handlers will have to handle NetworkedData<EventType>, changes are:
 *   - Booleans are turned to 0 | 1
 *   - Arrays are automatically translated to objects when sending them as event. You have
 *     to change them back into arrays yourself! See 'toArray()' in src/panorama/hud.ts
 */
// To declare an event for use, add it to this table with the type of its data
declare interface CustomGameEventDeclarations {
    c2s_test_event: {};

    dota_player_used_ability: {
        PlayerID: PlayerID;
        abilityname: string;
        caster_entindex: EntityIndex;
    }

    /** 玩家英雄离开某路径 */
    Event_CurPathChange: {
        playerID: PlayerID
    }
    /** 玩家停住某路径 */
    Event_JoinPath: {
        playerID: PlayerID
    }


    Event_TO_SendDeathClearing: {
        nPlayerId: PlayerID
    }

    GM_Operator: {
        nPlayerID: number;
        typeOprt: number;
        nRequest: number;
        // 路径
        typePath: number;
        nPathID: number;
        // 出狱
        nGold: number;
        // 交易
        jPlayerTrade: {
            nPlayerTrade: {
                nPlayerTradeID: number
                nGold: number
                arrPath: number[]
            }
            nPlayerBeTrade: {
                nPlayerBeTradeID: number
                nGold: number
                arrPath: number[]
            }
        }
    };

    S2C_GM_Operator: {
        nPlayerID: number
        typeOprt: number
    }

    S2C_GM_OperatorFinished: {
        nNum1: number
        nNum2: number
    }

    GM_OperatorFinished: {
        nPlayerID: number;
        typeOprt: number;
        nRequest: number;
        nNum1: number;
        nNum2: number;
        typePath: number;
        nPathID: number;
        nCardID: number;
        typeCard: number;
        nManaCost: number;
        nTargetEntID: number;
        nPosX: number;
        nPosY: number;
        nPosZ: number;
    };

    GM_CardAdd: {
        nPlayerID: number;
        json: {
            nCardID: number;
            typeCard: number;
            typeCast: number;
            nManaCost: number;
        }[];
    };

    GM_CardUpdata: {
        nPlayerID: number;
        json: {
            nCardID: number;
            typeCard: number;
            typeCast: number;
            nManaCost: number;
        }[];
    };

    GM_CardInfo: {
        tabCardInfo: any;
    };

    Event_PlayerRoundBefore: {
        typeGameState: number
    }

    Event_PlayerMove: {
        player: any
    }

    Event_BZCanAtk: {
        entity: any
    }

    Event_BZCantAtk: {
        entity: any
    }

    Event_GameStart: {

    }

    S2C_round_tip: {
        sTip: string
    }
}
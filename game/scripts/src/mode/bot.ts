import { GameMessage } from "./gamemessage"

export class Bot {


    constructor(eBot?: CDOTA_BaseNPC_Hero) {
    }

    static init() {
        // 添加机器人测试
        const eBot1 = GameRules.AddBotPlayerWithEntityScript("npc_dota_hero_bloodseeker", "bloodseeker", DotaTeam.CUSTOM_1, null, true)
        const eBot2 = GameRules.AddBotPlayerWithEntityScript("npc_dota_hero_lina", "lina", DotaTeam.CUSTOM_2, null, true)

        GameRules.PathManager.moveToPath(eBot1, GameRules.PathManager.getPathByType(GameMessage.TP_START)[0], false, null)
        GameRules.PathManager.moveToPath(eBot2, GameRules.PathManager.getPathByType(GameMessage.TP_START)[0], false, null)
    
    }
}
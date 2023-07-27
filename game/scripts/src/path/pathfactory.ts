import { GameMessage } from "../mode/gamemessage"
import { Path } from "./Path";
import { PathDomain } from "./pathdomain";
import { PathDomain_2 } from "./pathdomain_2";
import { PathDomain_6 } from "./pathdomain_6";
import { PathDomain_7 } from "./pathdomain_7";
import { PathMonster } from "./pathmonster";
import { PathPrison } from "./pathprison";
import { PathRune } from "./pathrune";
import { PathShop } from "./pathshop";
import { PathStart } from "./pathstart";
import { PathSteps } from "./pathsteps";
import { PathTP } from "./pathtp";
import { PathTreasure } from "./pathtreasure";

export class PathFactory {
    static create(entity: CBaseEntity) {
        const typePath = entity.GetIntAttr("PathType")
        // 对应类型的子类
        if (typePath >= GameMessage.TP_DOMAIN_1 && typePath < GameMessage.TP_DOMAIN_End) {
            switch (typePath) {
                case GameMessage.TP_DOMAIN_2:
                    return new PathDomain_2(entity)
                case GameMessage.TP_DOMAIN_6:
                    return new PathDomain_6(entity)
                case GameMessage.TP_DOMAIN_7:
                    return new PathDomain_7(entity)
                default:
                    return new PathDomain(entity)
            }
        } else {
            switch (typePath) {
                case GameMessage.TP_TP:
                    return new PathTP(entity)
                case GameMessage.TP_TREASURE:
                    return new PathTreasure(entity)
                case GameMessage.TP_RUNE:
                    return new PathRune(entity)
                case GameMessage.TP_PRISON:
                    return new PathPrison(entity)
                case GameMessage.TP_STEPS:
                    return new PathSteps(entity)
                case GameMessage.TP_START:
                    return new PathStart(entity)
                case GameMessage.TP_MONSTER_1:
                case GameMessage.TP_MONSTER_2:
                case GameMessage.TP_MONSTER_3:
                    return new PathMonster(entity)
                case GameMessage.TP_SHOP_SIDE | GameMessage.TP_SHOP_SECRET:
                    return new PathShop(entity)
                default:
                    return new Path(entity)
            }
        }

    }
}
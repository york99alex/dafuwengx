import {
    TP_DOMAIN_1,
    TP_DOMAIN_2,
    TP_DOMAIN_6,
    TP_DOMAIN_7,
    TP_DOMAIN_End,
    TP_MONSTER_1,
    TP_MONSTER_2,
    TP_MONSTER_3,
    TP_PRISON,
    TP_RUNE,
    TP_SHOP_SECRET,
    TP_SHOP_SIDE,
    TP_START,
    TP_STEPS,
    TP_TP,
    TP_TREASURE,
} from '../constants/gamemessage';
import { Path } from './Path';
import { PathDomain } from './pathtype/pathsdomain/pathdomain';
import { PathDomain_2 } from './pathtype/pathsdomain/pathdomain_2';
import { PathDomain_6 } from './pathtype/pathsdomain/pathdomain_6';
import { PathDomain_7 } from './pathtype/pathsdomain/pathdomain_7';
import { PathMonster } from './pathtype/pathmonster';
import { PathPrison } from './pathtype/pathprison';
import { PathRune } from './pathtype/pathrune';
import { PathShop } from './pathtype/pathshop';
import { PathStart } from './pathtype/pathstart';
import { PathSteps } from './pathtype/pathsteps';
import { PathTP } from './pathtype/pathtp';
import { PathTreasure } from './pathtype/pathtreasure';

export class PathFactory {
    static create(entity: CBaseEntity) {
        const typePath = entity.GetIntAttr('PathType');
        // 对应类型的子类
        if (typePath >= TP_DOMAIN_1 && typePath < TP_DOMAIN_End) {
            switch (typePath) {
                case TP_DOMAIN_2:
                    return new PathDomain_2(entity);
                case TP_DOMAIN_6:
                    return new PathDomain_6(entity);
                case TP_DOMAIN_7:
                    return new PathDomain_7(entity);
                default:
                    return new PathDomain(entity);
            }
        } else {
            switch (typePath) {
                case TP_TP:
                    return new PathTP(entity);
                case TP_TREASURE:
                    return new PathTreasure(entity);
                case TP_RUNE:
                    return new PathRune(entity);
                case TP_PRISON:
                    return new PathPrison(entity);
                case TP_STEPS:
                    return new PathSteps(entity);
                case TP_START:
                    return new PathStart(entity);
                case TP_MONSTER_1:
                case TP_MONSTER_2:
                case TP_MONSTER_3:
                    return new PathMonster(entity);
                case TP_SHOP_SIDE:
                case TP_SHOP_SECRET:
                    return new PathShop(entity);
                default:
                    return new Path(entity);
            }
        }
    }
}

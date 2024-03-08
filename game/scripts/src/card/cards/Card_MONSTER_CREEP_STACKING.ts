import { TP_MONSTER_1, TP_MONSTER_2, TP_MONSTER_3 } from '../../constants/gamemessage';
import { PathMonster } from '../../path/pathtype/pathmonster';
import { Card } from '../card';

/**拉野 10008 */
export class Card_MONSTER_CREEP_STACKING extends Card {
    m_sName: string = '拉野';
    CastFilterResultLocation(location: Vector): UnitFilterResult {
        print('===Card_CastFilterResultLocation', Card_MONSTER_CREEP_STACKING.name);
        if (!this.CanUseCard()) return UnitFilterResult.FAIL_CUSTOM;
        for (const path of GameRules.PathManager.m_tabPaths) {
            const dis = ((location - path.m_entity.GetAbsOrigin()) as Vector).Length2D();
            if (dis < 450 && [TP_MONSTER_1, TP_MONSTER_2, TP_MONSTER_3].includes(path.m_typePath)) {
                this.mTargetPath = path;
                return UnitFilterResult.SUCCESS;
            }
        }
    }
    isCanCastMove(): boolean {
        return true;
    }
    isCanCastInPrison(): boolean {
        return true;
    }
    isCanCastHeroAtk(): boolean {
        return true;
    }
    OnSpellStart(): void {
        (this.mTargetPath as PathMonster).spawnMonster(true);
    }
}

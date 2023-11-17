import { player_info } from "../../player/player";
import { registerAbility } from "../../utils/dota_ts_adapter";
import { reloadable } from "../../utils/tstl-utils";
import { AbilityManager } from "../abilitymanager";
import { TSBaseItem } from "../tsBaseItem";

@reloadable
@registerAbility()
export class item_tp_scroll extends TSBaseItem {

    GetCastRange(location: Vector, target: CDOTA_BaseNPC): number {
        AbilityManager.showAbltMark(this, this.GetCaster(), [6, 16, 26, 36])
        return 0
    }

    CastFilterResultLocation(location: Vector): UnitFilterResult {
        if (!this.isCanCast()) {
            return UnitFilterResult.FAIL_CUSTOM
        }
        if (IsServer() && GameRules.PathManager && GameRules.PathManager.m_tabPaths) {
            const path = GameRules.PathManager.getClosePath(location)
            const dis = (location - path.m_entity.GetAbsOrigin() as Vector).Length2D()
            if (dis < 150) {
                this.m_pathTarget = path
                return UnitFilterResult.SUCCESS
            }
            this.m_strCastError = "AbilityError_TargetNotPath"
            return UnitFilterResult.FAIL_CUSTOM
        } else {
            return UnitFilterResult.SUCCESS
        }
    }
    
}
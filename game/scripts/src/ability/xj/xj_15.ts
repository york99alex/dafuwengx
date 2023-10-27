import { CDOTA_BaseNPC_BZ } from "../../player/CDOTA_BaseNPC_BZ";
import { registerAbility } from "../../utils/dota_ts_adapter";
import { onAblt_xj } from "../abilitymanager";
import { TSBaseAbility } from "../tsBaseAbilty";

/**
 * 技能：通用路径养精蓄锐
 */
@registerAbility()
export class xj_15 extends TSBaseAbility {

    /**选择无目标时 */
    CastFilterResult(): UnitFilterResult {
        print("========xj======CastFilterResult====")
        if (IsServer()) {
            print("===xj==this.GetCaster()===",this.GetCaster().GetOwner().GetName())
            print("===xj==this.GetCaster()===",this.GetCaster().GetOwner().GetTeamNumber())
            this.OnSpellStart()
        }
        return UnitFilterResult.SUCCESS
    }

    /**开始技能效果 */
    OnSpellStart(): void {
        print("========xj======OnSpellStart====")
        if (!GameRules.PlayerManager)
            return

        EmitGlobalSound("Hero_Omniknight.GuardianAngel")
        onAblt_xj({
            caster: this.GetCaster() as CDOTA_BaseNPC_BZ,
            ability: this
        })
    }
}
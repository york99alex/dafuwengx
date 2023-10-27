import { CDOTA_BaseNPC_BZ } from "../../player/CDOTA_BaseNPC_BZ";
import { registerAbility } from "../../utils/dota_ts_adapter";
import { onAblt_xj } from "../abilitymanager";
import { TSBaseAbility } from "../tsBaseAbilty";

/**
 * 技能：圣所路径卸甲归田
 */
@registerAbility()
export class xj_18 extends TSBaseAbility {

    /**选择无目标时 */
    CastFilterResult(): UnitFilterResult {
        if (IsServer() && this.GetCaster().HasModifier("modifier_medusa_stone_gaze_stone")) {
            print("===xj==this.GetCaster()===", this.GetCaster().GetName())
            this.OnSpellStart()
        }
        return UnitFilterResult.SUCCESS
    }

    /**开始技能效果 */
    OnSpellStart(): void {
        if (!GameRules.PlayerManager)
            return

        EmitGlobalSound("Hero_Omniknight.GuardianAngel")
        onAblt_xj({
            caster: this.GetCaster() as CDOTA_BaseNPC_BZ,
            ability: this
        })
    }
}
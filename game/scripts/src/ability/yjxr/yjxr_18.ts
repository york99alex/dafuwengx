import { CDOTA_BaseNPC_BZ } from "../../player/CDOTA_BaseNPC_BZ";
import { registerAbility } from "../../utils/dota_ts_adapter";
import { onAblt_yjxr } from "../abilitymanager";
import { TSBaseAbility } from "../tsBaseAbilty";

/**
 * 技能：圣所路径养精蓄锐
 */
@registerAbility()
export class yjxr_18 extends TSBaseAbility {

    /**选择无目标时 */
    CastFilterResult(): UnitFilterResult {
        if (IsServer() && this.GetCaster().HasModifier("modifier_medusa_stone_gaze_stone")) {
            print("===yjxr==this.GetCaster()===", this.GetCaster().GetName())
            this.OnSpellStart()
        }
        return UnitFilterResult.SUCCESS
    }

    /**开始技能效果 */
    OnSpellStart(): void {
        if (!GameRules.PlayerManager)
            return

        EmitGlobalSound("Hero_Omniknight.GuardianAngel")
        onAblt_yjxr({
            caster: this.GetCaster() as CDOTA_BaseNPC_BZ,
            ability: this
        })
        print("========yjxr======OnSpellStart====End")
    }
}
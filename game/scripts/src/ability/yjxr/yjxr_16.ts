import { CDOTA_BaseNPC_BZ } from "../../player/CDOTA_BaseNPC_BZ";
import { registerAbility } from "../../utils/dota_ts_adapter";
import { onAblt_yjxr } from "../abilitymanager";
import { TSBaseAbility } from "../tsBaseAbilty";

/**
 * 技能：通用路径养精蓄锐
 */
@registerAbility()
export class yjxr_16 extends TSBaseAbility {

    /**选择无目标时 */
    CastFilterResult(): UnitFilterResult {
        print("========yjxr======CastFilterResult====")
        if (IsServer()) {
            print("===yjxr==this.GetCaster()===",this.GetCaster().GetOwner().GetName())
            print("===yjxr==this.GetCaster()===",this.GetCaster().GetOwner().GetTeamNumber())
            return UnitFilterResult.SUCCESS
        }
    }

    /**开始技能效果 */
    OnSpellStart(): void {
        print("========yjxr======OnSpellStart====")
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
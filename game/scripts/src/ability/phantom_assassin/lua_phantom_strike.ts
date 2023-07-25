import { BaseAbility, registerAbility } from "../../utils/dota_ts_adapter";
import { reloadable } from "../../utils/tstl-utils";

@reloadable
@registerAbility()
class lua_phantom_strike extends BaseAbility{
    OnSpellStart(): void {
        print("开始释放技能")
    }
}
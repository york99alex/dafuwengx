import { BaseModifier, registerModifier } from "../../utils/dota_ts_adapter";

@registerModifier()
export class modifier_base_agility extends BaseModifier {

    IsHidden(): boolean {
        return true
    }

    IsDebuff(): boolean {
        return false
    }

    IsPurgable(): boolean {
        return false
    }

    IsPurgeException(): boolean {
        return false
    }

    AllowIllusionDuplicate(): boolean {
        return false
    }

    DestroyOnExpire(): boolean {
        return false
    }
}
import { registerModifier, BaseModifier } from '../../utils/dota_ts_adapter';

@registerModifier()
export class modifier_unselect extends BaseModifier {
    CheckState(): Partial<Record<ModifierState, boolean>> {
        return {
            [ModifierState.UNSELECTABLE]: true,
        };
    }
}

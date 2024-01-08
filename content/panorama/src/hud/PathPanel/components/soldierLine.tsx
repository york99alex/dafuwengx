import { SafeLocalize } from '../../../utils/useful';
import { TP_MONSTERS, TP_PRISON } from '../../mode/constant';

export function SoldierLine(props: { typePath: number; level?: number; capture?: boolean }) {
    return (
        <Panel className="SoldierLine">
            <Label
                className="LeftLabel"
                html={true}
                text={
                    TP_MONSTERS.includes(props.typePath) || props.typePath == TP_PRISON
                        ? ''
                        : props.capture
                        ? $.Localize('#Capture')
                        : SafeLocalize('#SoldierKey' + props.level + '_' + props.typePath ?? 0)
                }
            />
            <Label
                className="RightLabel"
                html={true}
                text={
                    TP_MONSTERS.includes(props.typePath) || props.typePath == TP_PRISON
                        ? ''
                        : props.capture
                        ? $.Localize('#Capture_' + props.typePath)
                        : SafeLocalize('#SoldierVal' + props.level + '_' + props.typePath ?? 0)
                }
            />
        </Panel>
    );
}

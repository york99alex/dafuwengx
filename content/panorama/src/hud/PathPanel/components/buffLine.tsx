import { SafeLocalize } from '../../../utils/useful';

export function BuffLine(props: { typePath?: number; level?: number }) {
    return (
        <Panel className="BuffLine">
            <Label className="BuffKey" html={true} text={SafeLocalize('#PathBuffKey' + props.level + '_' + props.typePath ?? 0)} />
            <Label className="BuffValue" html={true} text={SafeLocalize('#PathBuffVal' + props.level + '_' + props.typePath ?? 0)} />
        </Panel>
    );
}

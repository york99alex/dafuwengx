import { useEffect, useRef, useState } from 'react';
import { useGameEvent } from 'react-panorama-x';
import { PathDomainsType, PathMonstersType, PathPrisonType, PathType } from '../../path/PathManager';
import { GameMgr, PathMgr, PlayerMgr } from '../..';
import { TP_PRISON, TypeOprt } from '../../mode/constant';
import { SoldierLine } from './soldierLine';
import { BuffLine } from './buffLine';
import { SafeLocalize } from '../../../utils/useful';
import { UIHelper } from '../../utils/UIHelper';

export function PathPanel() {
    const [event, setEvent] = useState<any>();
    const [title, setTitle] = useState('');
    const pathPanel = useRef<Panel>(null);
    const [tipLabel, setTipLabel] = useState('');
    const oprtPanel = useRef<Panel>(null);
    const [btnYesText, setBtnYesText] = useState('');
    const [btnNoText, setBtnNoText] = useState('');
    const [GCLD, setGCLD] = useState(false);

    useGameEvent(
        'GM_Operator',
        data => {
            if (data.typeOprt == TypeOprt.TO_PRISON_OUT) {
                // 监狱路径  { nPlayerID: 0, nGold: 300, typeOprt: 5 }
                data.typePath = TP_PRISON;
                data.nPathID = 11;
                // console.log('===PathPanel GM_Operator InPrison:', data);
                resetState();
                setEvent(data);
                pathPanel.current!.RemoveClass('Hidden');
                setTitle($.Localize('#TypeOperator_PRISON_title'));
                setBtnYesText($.Localize('#Prison_Out') + "<font color='#FFFF00'> " + data.nGold + ' </font>');
                setBtnNoText($.Localize('#text_give_up'));
                setTipLabel($.Localize('#OperatorBody_Hell'));
                return;
            } else if (data.typeOprt == TypeOprt.TO_GCLD) {
                // 攻城略地 { typePath: 12, nPathID: 4, nPlayerID: 1, typeOprt: 3 }
                // console.log('===PathPanel GM_Operator GCLD:', data);
                resetState();
                setEvent(data);
                setTitle($.Localize('#TypeOperator_GCLD'));
                setBtnYesText("<font color='#FF0000'> " + $.Localize('#TypeOperator_GCLD') + ' </font>');
                setBtnNoText($.Localize('#text_give_up'));
                setTipLabel($.Localize('#PathTitleTip_GCLD'));
                setGCLD(true);
                pathPanel.current!.RemoveClass('Hidden');
                return;
            }
            if (data.nPathID == null || data.typePath == null || data.nPathID == null) return;
            // console.log('===PathPanel GM_Operator:', data);
            resetState();
            setEvent(data);
            pathPanel.current!.RemoveClass('Hidden');
            if (PathDomainsType.includes(data.typePath)) {
                // 领地路径
                setTitle($.Localize('#TypeOperator_AYZZ'));
                setBtnYesText($.Localize('#Capture'));
                setBtnNoText($.Localize('#text_give_up'));
            } else if (PathMonstersType.includes(data.typePath)) {
                // 打野路径
                setTitle($.Localize('#TypeOperator_AtkMonster'));
                setBtnYesText($.Localize('#TypeOperator_AtkMonster'));
                setBtnNoText($.Localize('#text_give_up'));
                setTipLabel($.Localize('#PathTitleTip_AtkMonster'));
            }
        },
        []
    );

    useGameEvent(
        'GM_OperatorFinished',
        data => {
            console.log('===PathPanel GM_OperatorFinished', data);
            // { typeOprt: 2, nRequest: 1, nPlayerID: 1, nPathID: 3, typePath: 12 }
            if (data.typeOprt == TypeOprt.TO_AYZZ) {
                if (data.nRequest == 1) {
                    if (data.nPlayerID != Players.GetLocalPlayer()) {
                        // 领地路径
                        resetState();
                        setEvent(data);
                        pathPanel.current!.RemoveClass('Hidden');
                        setTitle($.Localize('#TypeOperator_AYZZ'));
                    }
                    // 占领成功
                    setTipLabel($.Localize('#' + Players.GetPlayerSelectedHero(data.nPlayerID)) + $.Localize('#TypeOperator_AYZZ_Owner'));
                    $('#YES').visible = false;
                    setBtnNoText($.Localize('#text_understand'));
                } else if (data.nPlayerID == Players.GetLocalPlayer()) {
                    // 占领失败
                    resetState();
                    pathPanel.current!.AddClass('Hidden');
                }
            }
        },
        []
    );

    function ButtonOprt(bVal: boolean) {
        if (!bVal && event.typeOprt == TypeOprt.TO_AYZZ) {
            pathPanel.current!.AddClass('Hidden');
            resetState();
            return;
        }

        if (event.typeOprt == TypeOprt.TO_AYZZ) {
            if (PathDomainsType.includes(event.typePath)) {
                GameMgr.SendOperatorToServer({
                    nPlayerID: Players.GetLocalPlayer(),
                    typeOprt: TypeOprt.TO_AYZZ,
                    nRequest: bVal ? 1 : 0,
                });
            } else if (PathMonstersType.includes(event.typePath)) {
                GameMgr.SendOperatorToServer({
                    nPlayerID: Players.GetLocalPlayer(),
                    typeOprt: TypeOprt.TO_AtkMonster,
                    nRequest: bVal ? 1 : 0,
                });
                pathPanel.current!.AddClass('Hidden');
                resetState();
            }
        } else if (event.typeOprt == TypeOprt.TO_PRISON_OUT) {
            GameMgr.SendOperatorToServer({
                nPlayerID: Players.GetLocalPlayer(),
                typeOprt: TypeOprt.TO_PRISON_OUT,
                nRequest: bVal ? 1 : 0,
                nGold: event.nGold,
            });
            pathPanel.current!.AddClass('Hidden');
            resetState();
        } else if (event.typeOprt == TypeOprt.TO_GCLD) {
            GameMgr.SendOperatorToServer({
                nPlayerID: Players.GetLocalPlayer(),
                typeOprt: TypeOprt.TO_GCLD,
                nRequest: bVal ? 1 : 0,
            });
            pathPanel.current!.AddClass('Hidden');
            resetState();
        } else if (event.typeOprt == TypeOprt.TO_AtkMonster) {
            GameMgr.SendOperatorToServer({
                nPlayerID: Players.GetLocalPlayer(),
                typeOprt: TypeOprt.TO_AtkMonster,
                nRequest: bVal ? 1 : 0,
            });
            pathPanel.current!.AddClass('Hidden');
            resetState();
        }
    }

    function resetState() {
        setTipLabel('');
        setGCLD(false);
        setEvent(null);
        setTitle('');
        oprtPanel.current!.style.visibility = 'visible';
        $('#YES').visible = true;
        $('#NO').visible = true;
    }

    return (
        <Panel className="PathPanel Hidden" ref={pathPanel} hittest={true}>
            <Panel className="PathTitle">
                <Label className="LabelTitle" text={title} />
            </Panel>
            <Panel className="PathTitleTip">
                <Label text={$.Localize('#PathTitleTip_text')} />
                <Label text={$.Localize('#PathTitleTip_buff')} />
            </Panel>
            <Panel className="PathDescription">
                <Panel className="PathContain Left">
                    <Label className="PathName" text={$.Localize('#PathName_' + (event?.nPathID ?? 1))} />
                    <Panel className="PathImage">
                        <Image className="PathBG" src="file://{images}/custom_game/path/path_bg.png" />
                        <Image className="Path" src={`file://{images}/custom_game/path/path${PathType[event?.nPathID ?? 7]}.png`} />
                    </Panel>
                    <Panel className="SoldierContain">
                        {GCLD ? (
                            <>
                                <Label className="PathGCLDDescription" html={true} text={$.Localize('#PathGCLDDescription')} />
                            </>
                        ) : (
                            <>
                                <SoldierLine level={1} typePath={event?.typePath} />
                                <SoldierLine level={2} typePath={event?.typePath} />
                                <SoldierLine level={3} typePath={event?.typePath} />
                                <SoldierLine level={4} typePath={event?.typePath} />
                                <SoldierLine capture={true} typePath={event?.typePath} />
                            </>
                        )}
                    </Panel>
                </Panel>
                <Panel className="CenterContain" />
                <Panel className="PathContain Right">
                    <Label className="BuffName" html={true} text={SafeLocalize('#PathBuff_' + (event?.typePath ?? 1))} />
                    <Label className="BuffDescription" html={true} text={SafeLocalize('#PathBuffDescription_' + (event?.typePath ?? 1))} />
                    <Panel className="BuffAttribute">
                        <BuffLine level={1} typePath={event?.typePath} />
                        <BuffLine level={2} typePath={event?.typePath} />
                        <BuffLine level={3} typePath={event?.typePath} />
                        <BuffLine level={4} typePath={event?.typePath} />
                        <BuffLine level={5} typePath={event?.typePath} />
                    </Panel>
                </Panel>
            </Panel>
            <Panel className="OprtTip">
                <Label className="TipLabel" html={true} text={tipLabel} />
            </Panel>
            <Panel className="OprtGroup" ref={oprtPanel}>
                <Button id="YES" className="ButtonBevel" onactivate={() => ButtonOprt(true)}>
                    <Label text={btnYesText} html={true} />
                </Button>
                <Button id="NO" className="ButtonBevel" onactivate={() => ButtonOprt(false)}>
                    <Label text={btnNoText} html={true} />
                </Button>
            </Panel>
        </Panel>
    );
}

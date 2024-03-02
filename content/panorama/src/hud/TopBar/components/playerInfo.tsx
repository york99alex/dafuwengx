import { useGameEvent, useNetTableKey } from 'react-panorama-x';
import { player_info } from '../../mode/constant';
import { useRef, useState } from 'react';
import { judgeNetBoolean } from '../../mode/utils';

export function PlayerInfo(props: { playerID: PlayerID }) {
    const [showGold, setShowGold] = useState('+777');
    const changeGold = useRef<Panel>(null);

    // 后端setGold更新网表
    const { nGold, bDie, bDisconnect, bDeathClearing } = useNetTableKey('GamingTable', ('player_info_' + props.playerID) as player_info)!;
    const { nPlayerID } = useNetTableKey('GamingTable', 'order') ?? { nPlayerID: -1 };

    /** 玩家飘金showGold */
    useGameEvent(
        'S2C_GM_ShowGold',
        event => {
            if (event.nPlayerID == props.playerID) {
                // 飘金
                $.Msg('玩家ID:', event.nPlayerID, '飘金:', event.nGold);
                changeGold.current!.visible = true;
                const positive = event.nGold > 0;
                changeGold.current!.AddClass(positive ? 'Add' : 'Cut');
                setShowGold((positive ? '+' : '') + event.nGold);
                changeGold.current!.AddClass('Changing');
                $.Schedule(1, () => {
                    if (positive) changeGold.current!.RemoveClass('Add');
                    else changeGold.current!.RemoveClass('Cut');
                    changeGold.current!.RemoveClass('Changing');
                    changeGold.current!.visible = false;
                });
            }
        },
        []
    );

    function onClickPlayer(playerID: PlayerID) {
        GameUI.SetCameraTargetPosition(Entities.GetAbsOrigin(Players.GetPlayerHeroEntityIndex(playerID)), 0.2);
        Players.PlayerPortraitClicked(playerID, false, false);
        $.Schedule(0.5, () => {
            GameUI.SetCameraTarget(-1 as EntityIndex);
        });
    }

    return (
        <Panel className="Player" hittest={false}>
            <Panel className="Head" hittest={false}>
                <Panel className="Flag" />
                <Panel className="HeroImageBG" onactivate={() => onClickPlayer(props.playerID)} />
                <Panel className="Mask" visible={nPlayerID == props.playerID}>
                    <Panel className={'Mask1' + (judgeNetBoolean(bDeathClearing) ? ' DC' : '')} />
                    <Panel className={'Mask2' + (judgeNetBoolean(bDeathClearing) ? ' DC' : '')} />
                </Panel>
                <DOTAHeroImage
                    className={'HeroImage' + (judgeNetBoolean(bDie) ? ' Death' : '')}
                    heroname={Players.GetPlayerSelectedHero(props.playerID)}
                />
                <Panel className={'Disconnect' + (judgeNetBoolean(bDisconnect) ? ' True' : ' False')} />
            </Panel>
            <Label className="Gold" text={nGold} />
            <Panel className="ChangeGold" ref={changeGold} visible={false}>
                <Label className="ChangeGoldLabel" hittest={false} text={showGold} />
            </Panel>
        </Panel>
    );
}

import { useNetTableKey } from 'react-panorama-x';
import { GameMgr, PlayerMgr } from '../../hud';
import { Player } from '../../hud/player/player';
import { SafeLocalize } from '../../utils/useful';
import { AUCTIONSTATE, TypeOprt, player_info } from '../../hud/mode/constant';
import { SelectPathList } from '../../hud/Trade/components/selectPathList';
import { useRef, useState } from 'react';

export function PlayerBoard(props: { playerID: PlayerID }) {
    const muteRef = useRef<Panel>(null);
    const [mute, setMute] = useState(false);

    function setTradeMute() {
        setMute(!mute);
        GameMgr.SendOperatorToServer({
            typeOprt: TypeOprt.TO_MuteTrade,
            nPlayerID: PlayerMgr.playerID,
            nPlayerMute: props.playerID,
            bMute: !mute,
        });
    }

    return (
        <>
            <Panel className="PlayerPanel">
                <DOTAAvatarImage
                    id="AvatarImage"
                    className="ScoreboardAvatar"
                    steamid={PlayerMgr.playerID == props.playerID ? 'local' : String(Player.getPlayerSteamID(props.playerID))}
                    style={{
                        width: '38px',
                        height: '38px',
                        verticalAlign: 'center',
                        marginLeft: '6px',
                        marginRight: '4px',
                        backgroundColor: 'gradient(linear, 0% 0%, 0% 100%, from(#88888822), to(#44444433))',
                        backgroundSize: '100%',
                    }}
                />

                <DOTAHeroImage id="HeroImage" className="ScoreboardHeroImage" heroname={Players.GetPlayerSelectedHero(props.playerID)} />

                <Panel id="PlayerAndHeroNameContainer" className="TopBottomFlow">
                    <Label
                        id="PlayerNameLabel"
                        className={'PlayerNameLabel' + (PlayerMgr.playerID == props.playerID ? ' LocalPlayer' : '')}
                        text={props.playerID >= 0 ? Players.GetPlayerName(props.playerID) : ''}
                    />
                    <Label
                        id="HeroNameLabel"
                        className={'HeroNameLabel' + (PlayerMgr.playerID == props.playerID ? ' LocalPlayer' : '')}
                        text={SafeLocalize('#' + Players.GetPlayerSelectedHero(props.playerID))}
                    />
                </Panel>
                <Panel id="ScoreboardXP" className="ScoreboardXP">
                    <Panel id="LevelBackground" />
                    <Label
                        id="LevelLabel"
                        className="MonoNumbersFont"
                        text={props.playerID >= 0 ? Players.GetLevel(props.playerID) : ''}
                        hittest={false}
                    />
                    <CircularProgressBar
                        id="CircularXPProgress"
                        value={Entities.GetCurrentXP(Players.GetPlayerHeroEntityIndex(props.playerID))}
                        max={Entities.GetNeededXPToLevel(Players.GetPlayerHeroEntityIndex(props.playerID))}
                    />
                    <CircularProgressBar
                        id="CircularXPProgressBlur"
                        hittest={false}
                        value={Entities.GetCurrentXP(Players.GetPlayerHeroEntityIndex(props.playerID))}
                        max={Entities.GetNeededXPToLevel(Players.GetPlayerHeroEntityIndex(props.playerID))}
                    />
                </Panel>

                <Panel id="GoldContainerTotal" className="GoldContainer">
                    <Label
                        className="ScoreboardGold MonoNumbersFont"
                        text={useNetTableKey('GamingTable', ('player_info_' + props.playerID) as player_info)?.nSumGold ?? 0}
                    />
                </Panel>
                <Panel id="GoldContainer" className="GoldContainer">
                    <Label
                        className="ScoreboardGold MonoNumbersFont"
                        text={useNetTableKey('GamingTable', ('player_info_' + props.playerID) as player_info)?.nGold ?? 0}
                    />
                </Panel>

                <Label
                    className={'KDANumbers KDAKills MonoNumbersFont' + (PlayerMgr.playerID == props.playerID ? ' LocalPlayer' : '')}
                    text={useNetTableKey('GamingTable', ('player_info_' + props.playerID) as player_info)?.nKill ?? 0}
                />
                <Label
                    className={'KDANumbers MonoNumbersFont' + (PlayerMgr.playerID == props.playerID ? ' LocalPlayer' : '')}
                    text={useNetTableKey('GamingTable', ('player_info_' + props.playerID) as player_info)?.nGCLD ?? 0}
                />
                <Panel
                    ref={muteRef}
                    id="ScoreboardMuteButtons"
                    className={'LeftRightFlow' + (PlayerMgr.playerID == props.playerID ? ' LocalPlayer' : '')}
                >
                    <ToggleButton
                        id="VoiceMute"
                        className="ScoreboardMuteButton Voice"
                        onactivate={() => Game.SetPlayerMuted(props.playerID, !Game.IsPlayerMuted(props.playerID))}
                    />
                    <ToggleButton
                        id="TradeMute"
                        className="ScoreboardMuteButton Trade"
                        onmouseover={() => $.DispatchEvent('DOTAShowTextTooltip', muteRef.current!, $.Localize('#scoreboard_tool_tip_mute_trade'))}
                        onmouseout={() => $.DispatchEvent('DOTAHideTextTooltip', muteRef.current!)}
                        onactivate={setTradeMute}
                    />
                </Panel>
            </Panel>
            <Panel id="PathsContainer">
                {/* <Label id="PathLabel" text={$.Localize('#scoreboard_title_path')} /> */}
                <Panel id="ShowPaths">
                    <SelectPathList
                        pathIDs={Player.getPlayerPath(props.playerID)}
                        selectIDs={[]}
                        SetSelectIDs={() => {}}
                        tradeState={AUCTIONSTATE.None}
                    ></SelectPathList>
                </Panel>
            </Panel>
        </>
    );
}

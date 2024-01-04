import { useEffect, useState } from 'react';

export function PlayerPanel(props: { playerID: PlayerID; data: any; oprtID: number }) {
    const [heroname, setHeroname] = useState('');

    useEffect(() => {
        setHeroname(Players.GetPlayerSelectedHero(props.playerID));
    }, [props.playerID]);

    return (
        <Panel className="PlayerPanel">
            <Panel className="HeroImage">
                <DOTAHeroImage heroname={heroname ?? 'npc_dota_hero_wisp'} heroimagestyle="portrait" />
            </Panel>
            <Panel className="PlayerContain">
                <Panel className="PlayerInfo">
                    <Label className="PlayerNameLabel" text={Players.GetPlayerName(props.playerID)} />
                    <Label className="HeroNameLabel" text={$.Localize('#' + (heroname ?? 'npc_dota_hero_wisp'))} />
                </Panel>
                <Panel className="PlayerTip" visible={props.oprtID == props.playerID}>
                    <Label className="PlayerTipLabel" text={$.Localize('#supply_tip_select')} />
                </Panel>
                <Panel className="ItemGrid">
                    <Panel className="PlayerItem">
                        <DOTAItemImage style={{ width: '100%', height: '100%' }} itemname="" showtooltip={true} />
                    </Panel>
                </Panel>
                {/* <Panel className="PlayerItemTip">
                    <Label className="PlayerItemTipLabel" text="#supply_tip_item_FullIventory" />
                </Panel> */}
            </Panel>
        </Panel>
    );
}

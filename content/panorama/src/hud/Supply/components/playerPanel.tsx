import { useEffect, useRef, useState } from 'react';
import { PathType } from '../../path/PathManager';

export function PlayerPanel(props: { playerID: PlayerID; data: any; oprtID: number }) {
    const [heroname, setHeroname] = useState('');
    const item = useRef<Panel>(null);
    const [supplyInfo, setSupplyInfo] = useState<{ name?: any; type?: string }>();

    useEffect(() => {
        setHeroname(Players.GetPlayerSelectedHero(props.playerID));
    }, [props.playerID]);

    useEffect(() => {
        if (props.oprtID && props.oprtID == -2) {
            setTimeout(() => {
                item.current!.visible = false;
                setSupplyInfo({});
            }, 2000);
        }
    }, [props.oprtID]);

    useEffect(() => {
        if (!props.data) return;
        for (const supply of props.data) {
            if (supply.nOwnerID != null && supply.nOwnerID == props.playerID.valueOf()) {
                item.current!.visible = true;
                setSupplyInfo({
                    name: supply.itemName || supply.pathID,
                    type: supply.type,
                });
                return;
            }
        }
    }, [props.data]);

    function onRightClick() {
        if (supplyInfo?.type == 'item')
            GameEvents.SendEventClientSide('dota_link_clicked', {
                link: 'dota.item.' + supplyInfo?.name,
                shop: 0,
                recipe: 0,
                nav: 0,
                nav_back: 0,
            });
    }

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
                    <Panel className="PlayerItem" visible={false} ref={item}>
                        {supplyInfo &&
                            (supplyInfo.type == 'item' ? (
                                <DOTAItemImage
                                    className="Item"
                                    itemname={supplyInfo?.name}
                                    showtooltip={true}
                                    onactivate={onRightClick}
                                    oncontextmenu={onRightClick}
                                />
                            ) : supplyInfo.type == 'path' ? (
                                <Image
                                    className="Path"
                                    src={`file://{images}/custom_game/path/path${PathType[supplyInfo.name]}.png`}
                                    onmouseover={panel => $.DispatchEvent('DOTAShowTextTooltip', panel, $.Localize('#PathName_' + supplyInfo.name))}
                                    onmouseout={panel => $.DispatchEvent('DOTAHideTextTooltip', panel)}
                                />
                            ) : (
                                <></>
                            ))}
                    </Panel>
                </Panel>
                {/* <Panel className="PlayerItemTip">
                    <Label className="PlayerItemTipLabel" text="#supply_tip_item_FullIventory" />
                </Panel> */}
            </Panel>
        </Panel>
    );
}
